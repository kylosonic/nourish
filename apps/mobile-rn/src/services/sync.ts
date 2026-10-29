import {
  ApiError,
  deleteAccount,
  fetchChanges,
  fetchConsent,
  pushChanges,
  refreshSession,
  updateConsent,
} from '../data/api';
import { applyConsentOptimistically, mergeRemoteChanges } from '../domain/sync';
import type {
  AccountSession,
  AppData,
  ConsentPatch,
} from '../types';

export interface SyncRunResult {
  data: AppData;
  session: AccountSession;
  message: string;
  rejected: { reason: string }[];
  changed: boolean;
}

async function withSessionRefresh<T>(
  session: AccountSession,
  action: (session: AccountSession) => Promise<T>,
): Promise<{ session: AccountSession; result: T }> {
  try {
    return { session, result: await action(session) };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const refreshed = await refreshSession(session);
    return { session: refreshed, result: await action(refreshed) };
  }
}

/**
 * Pull account changes into the encrypted local snapshot without duplicating
 * rows. The cursor and merged collections are returned together so the caller
 * persists them atomically.
 */
export async function pullAndRestoreAccountData(
  session: AccountSession,
  data: AppData,
): Promise<{ data: AppData; session: AccountSession; counts: ReturnType<typeof mergeRemoteChanges>['counts'] }> {
  const fetched = await withSessionRefresh(session, (active) =>
    fetchChanges(active, data.syncCursor),
  );
  const merged = mergeRemoteChanges(data, fetched.result);
  return {
    session: fetched.session,
    data: {
      ...data,
      meals: merged.meals,
      water: merged.water,
      weights: merged.weights,
      queue: merged.queue,
      syncCursor: merged.syncCursor,
    },
    counts: merged.counts,
  };
}

async function flushConsents(
  session: AccountSession,
  data: AppData,
): Promise<{ data: AppData; session: AccountSession }> {
  const pendingEntries = Object.entries(data.pendingConsents).filter(
    ([, value]) => typeof value === 'boolean',
  );
  if (pendingEntries.length > 0) {
    const sent = await withSessionRefresh(session, (active) =>
      updateConsent(active, data.pendingConsents),
    );
    return {
      session: sent.session,
      data: {
        ...data,
        pendingConsents: {},
        settings: {
          ...data.settings,
          aiImprovementConsent: sent.result.aiImprovement.granted,
          analyticsConsent: sent.result.analytics.granted,
        },
      },
    };
  }
  const fetched = await withSessionRefresh(session, fetchConsent);
  return {
    session: fetched.session,
    data: {
      ...data,
      settings: {
        ...data.settings,
        aiImprovementConsent: fetched.result.aiImprovement.granted,
        analyticsConsent: fetched.result.analytics.granted,
      },
    },
  };
}

/** Push queued mutations, flush consent, then pull the server delta. */
export async function syncAccountData(
  session: AccountSession,
  data: AppData,
): Promise<SyncRunResult> {
  let activeSession = session;
  let next: AppData = data;
  let rejected: { reason: string }[] = [];

  if (next.queue.length > 0) {
    const pushed = await withSessionRefresh(activeSession, (active) =>
      pushChanges(active, next.queue),
    );
    activeSession = pushed.session;
    rejected = pushed.result.rejected;
    const completed = new Set(
      pushed.result.applied.map((operation) => operation.clientId),
    );
    next = {
      ...next,
      queue: next.queue.filter(
        (operation) => !completed.has(operation.clientId),
      ),
    };
  }

  const consented = await flushConsents(activeSession, next);
  activeSession = consented.session;
  next = consented.data;

  const restored = await pullAndRestoreAccountData(activeSession, next);
  activeSession = restored.session;
  next = restored.data;
  const count = restored.counts.applied + restored.counts.removed;
  return {
    data: next,
    session: activeSession,
    rejected,
    changed: count > 0 || data.queue.length > 0,
    message:
      rejected.length > 0
        ? `${rejected.length} change${rejected.length === 1 ? '' : 's'} need review: ${rejected[0].reason}`
        : count > 0
          ? `${count} account change${count === 1 ? '' : 's'} restored.`
          : 'Everything is up to date.',
  };
}

export function queueConsentUpdate(
  data: AppData,
  patch: ConsentPatch,
): AppData {
  return {
    ...data,
    pendingConsents: applyConsentOptimistically(data.pendingConsents, patch),
    settings: {
      ...data.settings,
      ...(patch.aiImprovement == null
        ? {}
        : { aiImprovementConsent: patch.aiImprovement }),
      ...(patch.analytics == null
        ? {}
        : { analyticsConsent: patch.analytics }),
    },
  };
}

export async function deleteRemoteAccount(
  session: AccountSession,
): Promise<void> {
  await withSessionRefresh(session, deleteAccount);
}
