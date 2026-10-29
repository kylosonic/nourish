import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { AppState as NativeAppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import type {
  AccountSession,
  AppData,
  AppState,
  ConsentPatch,
  Food,
  Meal,
  MealDraftItem,
  MealItem,
  MealSlot,
  Nutrition,
  OnboardingData,
  Settings,
  SyncOperation,
} from '../types';
import {
  fetchCatalog,
  logout as remoteLogout,
  ApiError,
  refreshSession,
  updateConsent as remoteUpdateConsent,
} from '../data/api';
import {
  clearAppData,
  initialState,
  loadAppData,
  loadSession,
  saveAppData,
  saveSession,
} from './storage';
import { makeMealItem, targetFromOnboarding } from '../domain/nutrition';
import { addDays, localDateKey, newId } from '../utils/date';
import { reconcileHydrationReminders } from '../services/notifications';
import {
  deleteRemoteAccount,
  queueConsentUpdate,
  syncAccountData,
  type SyncRunResult,
} from '../services/sync';

type Action =
  | { type: 'hydrate'; data: AppData; session: AccountSession | null }
  | { type: 'patchOnboarding'; patch: Partial<OnboardingData> }
  | { type: 'startOnboarding' }
  | { type: 'completeOnboarding'; target: AppState['target'] }
  | { type: 'addMeal'; meal: Meal }
  | { type: 'updateMeal'; id: string; items: MealItem[] }
  | { type: 'deleteMeal'; id: string }
  | { type: 'addWater'; amountMl: number; dateKey: string }
  | { type: 'removeWater'; amountMl: number; dateKey: string }
  | { type: 'addWeight'; weightKg: number; dateKey: string }
  | { type: 'patchSettings'; patch: Partial<Settings> }
  | { type: 'setCatalog'; foods: Food[]; version: string }
  | { type: 'setSession'; session: AccountSession | null }
  | { type: 'setSync'; state: AppState['syncState']; message?: string | null }
  | { type: 'acknowledgeSync'; appliedClientIds: string[] }
  | { type: 'applySync'; result: SyncRunResult }
  | { type: 'queueConsent'; patch: ConsentPatch }
  | { type: 'synchronizeConsent'; patch: ConsentPatch }
  | { type: 'replaceQueue'; queue: SyncOperation[] }
  | { type: 'reset' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.data, session: action.session, hydrated: true };
    case 'startOnboarding':
      return {
        ...state,
        onboarding: { ...state.onboarding, started: true, step: 1 },
      };
    case 'patchOnboarding':
      return {
        ...state,
        onboarding: { ...state.onboarding, ...action.patch },
      };
    case 'completeOnboarding':
      return {
        ...state,
        target: action.target,
        onboarding: {
          ...state.onboarding,
          started: true,
          completed: true,
          step: 7,
        },
      };
    case 'addMeal': {
      const sequence = state.queue.length + 1;
      const mealWithVersion: Meal = {
        ...action.meal,
        updatedAt: action.meal.createdAt,
        clientSeq: sequence,
      };
      const operation: SyncOperation = {
        id: newId('queue'),
        kind: 'meal',
        op: 'upsert',
        clientId: action.meal.id,
        clientSeq: sequence,
        updatedAt: mealWithVersion.updatedAt!,
        loggedAt: action.meal.loggedAt,
        dateKey: action.meal.dateKey,
        slot: action.meal.slot,
        items: action.meal.items,
      };
      return {
        ...state,
        meals: [mealWithVersion, ...state.meals],
        queue: [...state.queue, operation],
      };
    }
    case 'updateMeal': {
      const meal = state.meals.find((candidate) => candidate.id === action.id);
      if (!meal || action.items.length === 0) return state;
      const sequence = state.queue.length + 1;
      const updatedAt = new Date().toISOString();
      const updatedMeal: Meal = {
        ...meal,
        items: action.items,
        updatedAt,
        clientSeq: sequence,
      };
      return {
        ...state,
        meals: state.meals.map((candidate) =>
          candidate.id === action.id ? updatedMeal : candidate,
        ),
        queue: [
          ...state.queue.filter(
            (operation) => operation.clientId !== action.id,
          ),
          {
            id: newId('queue'),
            kind: 'meal',
            op: 'upsert',
            clientId: meal.id,
            clientSeq: sequence,
            updatedAt,
            loggedAt: meal.loggedAt,
            dateKey: meal.dateKey,
            slot: meal.slot,
            items: action.items,
          },
        ],
      };
    }
    case 'deleteMeal': {
      const meal = state.meals.find((candidate) => candidate.id === action.id);
      if (!meal) return state;
      return {
        ...state,
        meals: state.meals.filter((candidate) => candidate.id !== action.id),
        queue: [
          ...state.queue,
          {
            id: newId('queue'),
            kind: 'meal',
            op: 'delete',
            clientId: meal.id,
            clientSeq: state.queue.length + 1,
            updatedAt: new Date().toISOString(),
            dateKey: meal.dateKey,
          },
        ],
      };
    }
    case 'addWater': {
      const logId = newId('water');
      const loggedAt = new Date().toISOString();
      const sequence = state.queue.length + 1;
      return {
        ...state,
        water: [
          ...state.water,
          {
            id: logId,
            dateKey: action.dateKey,
            amountMl: action.amountMl,
            loggedAt,
            updatedAt: loggedAt,
          },
        ],
        queue: [
          ...state.queue,
          {
            id: newId('queue'),
            kind: 'water',
            op: 'upsert',
            clientId: logId,
            clientSeq: sequence,
            updatedAt: loggedAt,
            loggedAt,
            dateKey: action.dateKey,
            amountMl: action.amountMl,
          },
        ],
      };
    }
    case 'removeWater': {
      const candidates = state.water
        .filter((log) => log.dateKey === action.dateKey && log.amountMl > 0)
        .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
      let remaining = action.amountMl;
      const removed: string[] = [];
      for (const log of candidates) {
        if (remaining <= 0) break;
        removed.push(log.id);
        remaining -= log.amountMl;
      }
      if (removed.length === 0) return state;
      return {
        ...state,
        water: state.water.filter((log) => !removed.includes(log.id)),
        queue: [
          ...state.queue,
          ...removed.map((id, index) => ({
            id: newId('queue'),
            kind: 'water' as const,
            op: 'delete' as const,
            clientId: id,
            clientSeq: state.queue.length + index + 1,
            updatedAt: new Date().toISOString(),
            dateKey: action.dateKey,
          })),
        ],
      };
    }
    case 'addWeight': {
      const id = newId('weight');
      const loggedAt = new Date().toISOString();
      const sequence = state.queue.length + 1;
      return {
        ...state,
        weights: [
          ...state.weights,
          {
            id,
            dateKey: action.dateKey,
            weightKg: action.weightKg,
            loggedAt,
            updatedAt: loggedAt,
          },
        ],
        queue: [
          ...state.queue,
          {
            id: newId('queue'),
            kind: 'weight',
            op: 'upsert',
            clientId: id,
            clientSeq: sequence,
            updatedAt: loggedAt,
            loggedAt,
            dateKey: action.dateKey,
            weightKg: action.weightKg,
          },
        ],
      };
    }
    case 'patchSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'setCatalog':
      return {
        ...state,
        catalog: action.foods,
        catalogVersion: action.version,
      };
    case 'setSession':
      return { ...state, session: action.session };
    case 'setSync':
      return {
        ...state,
        syncState: action.state,
        syncMessage: action.message ?? state.syncMessage,
        lastSyncedAt: action.state === 'idle' ? new Date().toISOString() : state.lastSyncedAt,
      };
    case 'acknowledgeSync':
      return {
        ...state,
        queue: state.queue.filter(
          (operation) => !action.appliedClientIds.includes(operation.clientId),
        ),
      };
    case 'applySync':
      return {
        ...state,
        ...action.result.data,
        session: action.result.session,
        syncState: action.result.rejected.length > 0 ? 'error' : 'idle',
        syncMessage: action.result.message,
        lastSyncedAt: new Date().toISOString(),
      };
    case 'queueConsent':
      return { ...state, ...queueConsentUpdate(state, action.patch) };
    case 'synchronizeConsent':
      return {
        ...state,
        pendingConsents: Object.fromEntries(
          Object.entries(state.pendingConsents).filter(
            ([key]) => !(key in action.patch),
          ),
        ),
        settings: {
          ...state.settings,
          ...(action.patch.aiImprovement == null
            ? {}
            : { aiImprovementConsent: action.patch.aiImprovement }),
          ...(action.patch.analytics == null
            ? {}
            : { analyticsConsent: action.patch.analytics }),
        },
      };
    case 'replaceQueue':
      return { ...state, queue: action.queue };
    case 'reset':
      return {
        ...initialState,
        hydrated: true,
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  startOnboarding: () => void;
  patchOnboarding: (patch: Partial<OnboardingData>) => void;
  completeOnboarding: () => void;
  addDraftMeal: (
    slot: MealSlot,
    drafts: MealDraftItem[],
    source?: Meal['source'],
    dateKey?: string,
  ) => Meal;
  addResolvedMeal: (
    slot: MealSlot,
    items: MealItem[],
    source: Meal['source'],
    analysisId?: string,
    photoUri?: string,
  ) => Meal;
  deleteMeal: (id: string) => void;
  updateMeal: (id: string, items: MealItem[]) => void;
  addWater: (amountMl?: number, dateKey?: string) => void;
  removeWater: (amountMl?: number, dateKey?: string) => void;
  addWeight: (weightKg: number, dateKey?: string) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  setSession: (session: AccountSession | null) => void;
  updateConsent: (patch: ConsentPatch) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  syncCatalog: () => Promise<void>;
  deleteCurrentAccount: () => Promise<void>;
  resetLocalData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    void Promise.all([loadAppData(), loadSession()]).then(([data, session]) => {
      dispatch({ type: 'hydrate', data, session });
    });
  }, []);

  useEffect(() => {
    if (state.hydrated) void saveAppData(state);
  }, [state]);

  useEffect(() => {
    if (state.hydrated) void saveSession(state.session);
  }, [state.hydrated, state.session]);

  const waterToday = dayWater(state);
  useEffect(() => {
    if (!state.hydrated) return;
    void reconcileHydrationReminders(state.settings, waterToday).catch(() => {
      // Permission state and platform scheduling are reconciled again whenever
      // the user opens the notification setting.
    });
  }, [
    state.hydrated,
    state.settings,
    waterToday,
  ]);

  const startOnboarding = useCallback(() => dispatch({ type: 'startOnboarding' }), []);

  const patchOnboarding = useCallback(
    (patch: Partial<OnboardingData>) => dispatch({ type: 'patchOnboarding', patch }),
    [],
  );

  const completeOnboarding = useCallback(() => {
    const target = targetFromOnboarding(state.onboarding);
    dispatch({ type: 'completeOnboarding', target });
  }, [state.onboarding]);

  const addDraftMeal = useCallback<AppContextValue['addDraftMeal']>(
    (slot, drafts, source = 'search', dateKey = localDateKey()) => {
      if (drafts.length === 0) throw new Error('Add at least one food before saving.');
      const now = new Date().toISOString();
      const meal: Meal = {
        id: newId('meal'),
        dateKey,
        slot,
        loggedAt: now,
        createdAt: now,
        items: drafts.map(makeMealItem),
        source,
      };
      dispatch({ type: 'addMeal', meal });
      return meal;
    },
    [],
  );

  const addResolvedMeal = useCallback<AppContextValue['addResolvedMeal']>(
    (slot, items, source, analysisId, _photoUri) => {
      const now = new Date().toISOString();
      const meal: Meal = {
        id: newId('meal'),
        dateKey: localDateKey(),
        slot,
        loggedAt: now,
        createdAt: now,
        items,
        source,
        analysisId,
      };
      dispatch({ type: 'addMeal', meal });
      return meal;
    },
    [],
  );

  const deleteMeal = useCallback(
    (id: string) => dispatch({ type: 'deleteMeal', id }),
    [],
  );
  const updateMeal = useCallback(
    (id: string, items: MealItem[]) =>
      dispatch({ type: 'updateMeal', id, items }),
    [],
  );
  const addWater = useCallback(
    (amountMl = 250, dateKey = localDateKey()) =>
      dispatch({ type: 'addWater', amountMl, dateKey }),
    [],
  );
  const removeWater = useCallback(
    (amountMl = 250, dateKey = localDateKey()) =>
      dispatch({ type: 'removeWater', amountMl, dateKey }),
    [],
  );
  const addWeight = useCallback(
    (weightKg: number, dateKey = localDateKey()) =>
      dispatch({ type: 'addWeight', weightKg, dateKey }),
    [],
  );
  const patchSettings = useCallback(
    (patch: Partial<Settings>) => dispatch({ type: 'patchSettings', patch }),
    [],
  );
  const setSession = useCallback(
    (session: AccountSession | null) => dispatch({ type: 'setSession', session }),
    [],
  );

  const signOut = useCallback(async () => {
    if (state.session) {
      try {
        await remoteLogout(state.session);
      } catch {
        // Local credentials are still removed; a retryable server error must
        // not trap the user in a signed-in state.
      }
    }
    dispatch({ type: 'setSession', session: null });
  }, [state.session]);

  const runSync = useCallback(async (manual: boolean) => {
    if (state.syncState === 'syncing') return;
    if (!state.session) {
      if (manual) {
        dispatch({
          type: 'setSync',
          state: 'error',
          message: 'Sign in to sync your account.',
        });
      }
      return;
    }
    dispatch({
      type: 'setSync',
      state: 'syncing',
      message: manual ? 'Syncing your account…' : 'Syncing changes…',
    });
    try {
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        throw new ApiError(
          'You are offline. Your changes remain queued.',
          'OFFLINE',
        );
      }
      const result = await syncAccountData(state.session, state);
      dispatch({ type: 'applySync', result });
    } catch (error) {
      dispatch({
        type: 'setSync',
        state: 'error',
        message: error instanceof Error ? error.message : 'Backup failed. Please try again.',
      });
    }
  }, [state]);

  const syncNow = useCallback(() => runSync(true), [runSync]);

  const updatePrivacyConsent = useCallback(async (patch: ConsentPatch) => {
    dispatch({ type: 'queueConsent', patch });
    if (!state.session) return;
    try {
      let session = state.session;
      let result;
      try {
        result = await remoteUpdateConsent(session, patch);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          session = await refreshSession(session);
          dispatch({ type: 'setSession', session });
          result = await remoteUpdateConsent(session, patch);
        } else {
          throw error;
        }
      }
      dispatch({
        type: 'synchronizeConsent',
        patch: {
          aiImprovement: result.aiImprovement.granted,
          analytics: result.analytics.granted,
        },
      });
    } catch {
      // The optimistic value remains in pendingConsents and is flushed by the
      // next reconnect, foreground, background or manual sync.
    }
  }, [state.session]);

  const autoRestoreSession = useRef<string | null>(null);
  useEffect(() => {
    if (
      !state.hydrated ||
      !state.session ||
      state.meals.length > 0 ||
      state.water.length > 0 ||
      state.weights.length > 0 ||
      state.queue.length > 0
    ) {
      return;
    }
    const key = `${state.session.email ?? state.session.phone ?? 'account'}:${state.session.createdAt}`;
    if (autoRestoreSession.current === key) return;
    autoRestoreSession.current = key;
    void runSync(false);
  }, [
    runSync,
    state.hydrated,
    state.meals.length,
    state.queue.length,
    state.session,
    state.water.length,
    state.weights.length,
  ]);

  const previousConnection = useRef<boolean | null>(null);
  useEffect(() => {
    if (!state.session || !state.hydrated) return;
    const unsubscribe = NetInfo.addEventListener((network) => {
      const online =
        Boolean(network.isConnected) && network.isInternetReachable !== false;
      if (previousConnection.current === false && online) {
        void runSync(false);
      }
      previousConnection.current = online;
    });
    return unsubscribe;
  }, [runSync, state.hydrated, state.session]);

  useEffect(() => {
    if (!state.session || !state.hydrated) return;
    let previous = NativeAppState.currentState;
    const subscription = NativeAppState.addEventListener('change', (next) => {
      if (previous?.match(/inactive|background/) && next === 'active') {
        void runSync(false);
      }
      previous = next;
    });
    return () => subscription.remove();
  }, [runSync, state.hydrated, state.session]);

  const syncCatalog = useCallback(async () => {
    try {
      const payload = await fetchCatalog(
        state.catalogVersion?.includes('seed') ? null : state.catalogVersion,
      );
      if (payload) {
        dispatch({ type: 'setCatalog', foods: payload.foods, version: payload.version });
      }
    } catch {
      // The previous cached catalog remains the offline read model.
    }
  }, [state.catalogVersion]);

  const resetLocalData = useCallback(async () => {
    await clearAppData();
    dispatch({ type: 'reset' });
  }, []);

  const deleteCurrentAccount = useCallback(async () => {
    if (!state.session) {
      throw new ApiError('Sign in to delete your account.', 'UNAUTHENTICATED', 401);
    }
    await deleteRemoteAccount(state.session);
    await resetLocalData();
  }, [resetLocalData, state.session]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      startOnboarding,
      patchOnboarding,
      completeOnboarding,
      addDraftMeal,
      addResolvedMeal,
      deleteMeal,
      updateMeal,
      addWater,
      removeWater,
      addWeight,
      patchSettings,
      setSession,
      updateConsent: updatePrivacyConsent,
      signOut,
      syncNow,
      syncCatalog,
      deleteCurrentAccount,
      resetLocalData,
    }),
    [
      state,
      startOnboarding,
      patchOnboarding,
      completeOnboarding,
      addDraftMeal,
      addResolvedMeal,
      deleteMeal,
      updateMeal,
      addWater,
      removeWater,
      addWeight,
      patchSettings,
      setSession,
      updatePrivacyConsent,
      signOut,
      syncNow,
      syncCatalog,
      deleteCurrentAccount,
      resetLocalData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

export function useTodayTotals(): Nutrition {
  const { state } = useApp();
  return useMemo(() => {
    const dateKey = localDateKey();
    return state.meals
      .filter((meal) => meal.dateKey === dateKey)
      .flatMap((meal) => meal.items)
      .reduce<Nutrition>(
        (sum, item) => ({
          kcal: sum.kcal + item.nutrition.kcal,
          proteinG: sum.proteinG + item.nutrition.proteinG,
          carbsG: sum.carbsG + item.nutrition.carbsG,
          fatG: sum.fatG + item.nutrition.fatG,
          fiberG: (sum.fiberG ?? 0) + (item.nutrition.fiberG ?? 0),
          sodiumMg: (sum.sodiumMg ?? 0) + (item.nutrition.sodiumMg ?? 0),
        }),
        { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sodiumMg: 0 },
      );
  }, [state.meals]);
}

export function dayWater(state: AppState, dateKey = localDateKey()): number {
  return state.water
    .filter((log) => log.dateKey === dateKey)
    .reduce((sum, log) => sum + log.amountMl, 0);
}

export function dateWindow(center: string): string[] {
  return Array.from({ length: 5 }, (_, index) => addDays(center, index - 2));
}

export function foodFromCatalog(state: AppState, foodId: string): Food | undefined {
  return state.catalog.find((food) => food.id === foodId);
}

export function unitLabel(unit: string): string {
  return unit
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (character) => character.toUpperCase());
}

