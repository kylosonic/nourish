import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import type {
  AccountSession,
  AppData,
  AppState,
  Food,
  Meal,
  MealDraftItem,
  MealItem,
  MealSlot,
  Nutrition,
  OnboardingData,
  PortionUnit,
  Settings,
  SyncOperation,
} from '../types';
import {
  fetchCatalog,
  logout as remoteLogout,
  ApiError,
  pushChanges,
  refreshSession,
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

type Action =
  | { type: 'hydrate'; data: AppData; session: AccountSession | null }
  | { type: 'patchOnboarding'; patch: Partial<OnboardingData> }
  | { type: 'startOnboarding' }
  | { type: 'completeOnboarding'; target: AppState['target'] }
  | { type: 'addMeal'; meal: Meal }
  | { type: 'deleteMeal'; id: string }
  | { type: 'addWater'; amountMl: number; dateKey: string }
  | { type: 'removeWater'; amountMl: number; dateKey: string }
  | { type: 'addWeight'; weightKg: number; dateKey: string }
  | { type: 'patchSettings'; patch: Partial<Settings> }
  | { type: 'setCatalog'; foods: Food[]; version: string }
  | { type: 'setSession'; session: AccountSession | null }
  | { type: 'setSync'; state: AppState['syncState']; message?: string | null }
  | { type: 'acknowledgeSync'; appliedClientIds: string[] }
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
      const operation: SyncOperation = {
        id: newId('queue'),
        kind: 'meal',
        op: 'upsert',
        clientId: action.meal.id,
        clientSeq: sequence,
        updatedAt: action.meal.createdAt,
        loggedAt: action.meal.loggedAt,
        dateKey: action.meal.dateKey,
        slot: action.meal.slot,
        items: action.meal.items,
      };
      return {
        ...state,
        meals: [action.meal, ...state.meals],
        queue: [...state.queue, operation],
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
      return {
        ...state,
        water: [
          ...state.water,
          { id: logId, dateKey: action.dateKey, amountMl: action.amountMl, loggedAt },
        ],
        queue: [
          ...state.queue,
          {
            id: newId('queue'),
            kind: 'water',
            op: 'upsert',
            clientId: logId,
            clientSeq: state.queue.length + 1,
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
      return {
        ...state,
        weights: [...state.weights, { id, dateKey: action.dateKey, weightKg: action.weightKg, loggedAt }],
        queue: [
          ...state.queue,
          {
            id: newId('queue'),
            kind: 'weight',
            op: 'upsert',
            clientId: id,
            clientSeq: state.queue.length + 1,
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
  addWater: (amountMl?: number, dateKey?: string) => void;
  removeWater: (amountMl?: number, dateKey?: string) => void;
  addWeight: (weightKg: number, dateKey?: string) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  setSession: (session: AccountSession | null) => void;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  syncCatalog: () => Promise<void>;
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

  const syncNow = useCallback(async () => {
    if (!state.session) {
      dispatch({
        type: 'setSync',
        state: 'error',
        message: 'Sign in to back up your logged meals.',
      });
      return;
    }
    if (state.queue.length === 0) {
      dispatch({ type: 'setSync', state: 'idle', message: 'Everything is backed up.' });
      return;
    }
    dispatch({ type: 'setSync', state: 'syncing', message: 'Backing up your changes…' });
    try {
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        throw new ApiError('You are offline. Your changes remain queued.', 'OFFLINE');
      }
      let session = state.session;
      let result;
      try {
        result = await pushChanges(session, state.queue);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          session = await refreshSession(session);
          dispatch({ type: 'setSession', session });
          result = await pushChanges(session, state.queue);
        } else {
          throw error;
        }
      }
      dispatch({
        type: 'acknowledgeSync',
        appliedClientIds: result.applied.map((entry) => entry.clientId),
      });
      dispatch({
        type: 'setSync',
        state: result.rejected.length > 0 ? 'error' : 'idle',
        message:
          result.rejected.length > 0
            ? `${result.rejected.length} change${result.rejected.length === 1 ? '' : 's'} need review: ${result.rejected[0].reason}`
            : 'All changes are backed up.',
      });
    } catch (error) {
      dispatch({
        type: 'setSync',
        state: 'error',
        message: error instanceof Error ? error.message : 'Backup failed. Please try again.',
      });
    }
  }, [state.queue, state.session]);

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

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      startOnboarding,
      patchOnboarding,
      completeOnboarding,
      addDraftMeal,
      addResolvedMeal,
      deleteMeal,
      addWater,
      removeWater,
      addWeight,
      patchSettings,
      setSession,
      signOut,
      syncNow,
      syncCatalog,
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
      addWater,
      removeWater,
      addWeight,
      patchSettings,
      setSession,
      signOut,
      syncNow,
      syncCatalog,
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

export type { PortionUnit };
