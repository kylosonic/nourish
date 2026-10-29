import type {
  AccountConsent,
  ConsentPatch,
  Meal,
  RemoteMeal,
  RemoteWater,
  RemoteWeight,
  SyncChanges,
  SyncOperation,
  WaterLog,
  WeightLog,
} from '../types';

type RemoteChange =
  | (RemoteMeal & { kind: 'meal' })
  | (RemoteWater & { kind: 'water' })
  | (RemoteWeight & { kind: 'weight' });

interface LocalSyncState {
  meals: Meal[];
  water: WaterLog[];
  weights: WeightLog[];
  queue: SyncOperation[];
  syncCursor: string | null;
}

export interface SyncApplyCounts {
  applied: number;
  removed: number;
  kept: number;
  unchanged: number;
  ignored: number;
}

export interface SyncApplyResult {
  meals: Meal[];
  water: WaterLog[];
  weights: WeightLog[];
  queue: SyncOperation[];
  syncCursor: string | null;
  counts: SyncApplyCounts;
}

interface Version {
  updatedAt: string;
  clientSeq: number;
}

function compare(a: Version, b: Version): number {
  const time = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
  return time === 0 ? a.clientSeq - b.clientSeq : time;
}

function queueVersion(operation: SyncOperation | undefined): Version | null {
  return operation
    ? { updatedAt: operation.updatedAt, clientSeq: operation.clientSeq }
    : null;
}

function rowVersion(
  row: Meal | WaterLog | WeightLog,
): Version {
  return {
    updatedAt:
      row.updatedAt ??
      ('createdAt' in row ? row.createdAt : row.loggedAt),
    clientSeq: 'clientSeq' in row ? row.clientSeq ?? 0 : 0,
  };
}

function effectiveLocalVersion(
  row: Meal | WaterLog | WeightLog | undefined,
  operation: SyncOperation | undefined,
): Version | null {
  const local = row ? rowVersion(row) : null;
  const queued = queueVersion(operation);
  if (!local) return queued;
  if (!queued) return local;
  return compare(queued, local) > 0 ? queued : local;
}

function remoteVersion(change: RemoteChange): Version {
  return {
    updatedAt: change.updatedAt,
    clientSeq: change.kind === 'meal' ? change.clientSeq : 0,
  };
}

function latestQueuedByClient(queue: SyncOperation[]): Map<string, SyncOperation> {
  const result = new Map<string, SyncOperation>();
  for (const operation of queue) {
    const current = result.get(operation.clientId);
    if (
      !current ||
      compare(
        { updatedAt: operation.updatedAt, clientSeq: operation.clientSeq },
        { updatedAt: current.updatedAt, clientSeq: current.clientSeq },
      ) > 0
    ) {
      result.set(operation.clientId, operation);
    }
  }
  return result;
}

function removeQueueAtOrBefore(
  queue: SyncOperation[],
  clientId: string,
  remote: Version,
): SyncOperation[] {
  return queue.filter(
    (operation) =>
      operation.clientId !== clientId ||
      compare(
        { updatedAt: operation.updatedAt, clientSeq: operation.clientSeq },
        remote,
      ) > 0,
  );
}

function mealFromRemote(change: RemoteMeal): Meal {
  return {
    id: change.clientId,
    dateKey: change.dateKey,
    slot: change.slot as Meal['slot'],
    loggedAt: change.loggedAt,
    createdAt: change.loggedAt,
    updatedAt: change.updatedAt,
    clientSeq: change.clientSeq,
    source: 'manual',
    items: change.items.map((item) => ({
      id: item.clientId,
      foodId: item.foodId,
      foodName: item.foodName,
      category: 'Restored meal',
      portionUnit: item.portionUnit as Meal['items'][number]['portionUnit'],
      portionQuantity: item.portionQuantity,
      grams: item.grams,
      nutrition: {
        kcal: item.kcal,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        ...(item.fiberG == null ? {} : { fiberG: item.fiberG }),
        ...(item.sodiumMg == null ? {} : { sodiumMg: item.sodiumMg }),
      },
    })),
  };
}

function waterFromRemote(change: RemoteWater): WaterLog {
  return {
    id: change.clientId,
    dateKey: change.dateKey,
    amountMl: change.amountMl,
    loggedAt: change.loggedAt,
    updatedAt: change.updatedAt,
  };
}

function weightFromRemote(change: RemoteWeight): WeightLog {
  return {
    id: change.clientId,
    dateKey: change.dateKey,
    weightKg: change.weightKg,
    loggedAt: change.loggedAt,
    updatedAt: change.updatedAt,
  };
}

/**
 * Merge a server delta by stable client id. Newer server rows win, equal rows
 * are no-ops, and newer local/queued writes are retained for the push path.
 */
export function mergeRemoteChanges(
  local: LocalSyncState,
  changes: SyncChanges,
): SyncApplyResult {
  let meals = [...local.meals];
  let water = [...local.water];
  let weights = [...local.weights];
  let queue = [...local.queue];
  const counts: SyncApplyCounts = {
    applied: 0,
    removed: 0,
    kept: 0,
    unchanged: 0,
    ignored: 0,
  };
  const queued = latestQueuedByClient(queue);

  const apply = <T extends Meal | WaterLog | WeightLog>(
    rows: T[],
    change: RemoteChange,
    create: () => T,
  ): T[] => {
    const index = rows.findIndex((row) => row.id === change.clientId);
    const existing = index >= 0 ? rows[index] : undefined;
    const operation = queued.get(change.clientId);
    const known = existing != null || operation != null;
    const localVersion = effectiveLocalVersion(existing, operation);
    const remote = remoteVersion(change);

    if (!known) {
      if (change.deletedAt != null) {
        counts.ignored++;
        return rows;
      }
      counts.applied++;
      return [...rows, create()];
    }
    const order = localVersion ? compare(remote, localVersion) : 1;
    if (order <= 0) {
      if (order < 0) counts.kept++;
      else counts.unchanged++;
      return rows;
    }

    queue = removeQueueAtOrBefore(queue, change.clientId, remote);
    if (change.deletedAt != null) {
      counts.removed++;
      return index >= 0
        ? rows.filter((row) => row.id !== change.clientId)
        : rows;
    }
    counts.applied++;
    if (index < 0) return [...rows, create()];
    const next = [...rows];
    next[index] = create();
    return next;
  };

  for (const change of changes.meals) {
    meals = apply(meals, { ...change, kind: 'meal' }, () => mealFromRemote(change));
  }
  for (const change of changes.water) {
    water = apply(water, { ...change, kind: 'water' }, () => waterFromRemote(change));
  }
  for (const change of changes.weight) {
    weights = apply(weights, { ...change, kind: 'weight' }, () =>
      weightFromRemote(change),
    );
  }

  return {
    meals,
    water,
    weights,
    queue,
    syncCursor: changes.serverTime || local.syncCursor,
    counts,
  };
}

export function consentPatchFromServer(consent: AccountConsent): ConsentPatch {
  return {
    healthDataProcessing: consent.healthDataProcessing.granted,
    aiImprovement: consent.aiImprovement.granted,
    analytics: consent.analytics.granted,
  };
}

export function applyConsentOptimistically(
  pending: ConsentPatch,
  patch: ConsentPatch,
): ConsentPatch {
  return { ...pending, ...patch };
}
