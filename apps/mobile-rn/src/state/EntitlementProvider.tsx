import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  entitlementService,
  type EntitlementSnapshot,
  type PlanOption,
} from '../services/entitlements';

interface EntitlementContextValue {
  loading: boolean;
  plans: PlanOption[];
  entitlement: EntitlementSnapshot;
  mode: 'revenuecat' | 'mock' | 'disabled';
  purchase: (planId: string) => Promise<void>;
  restore: () => Promise<void>;
  error: string | null;
}

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [entitlement, setEntitlement] = useState<EntitlementSnapshot>({
    isPro: false,
    source: entitlementService.mode === 'mock' ? 'mock' : 'disabled',
  });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [snapshot, available] = await Promise.all([
        entitlementService.initialize(),
        entitlementService.plans(),
      ]);
      setEntitlement(snapshot);
      setPlans(available);
    } catch {
      setError('Subscriptions could not be loaded. You can try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const purchase = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);
    try {
      setEntitlement(await entitlementService.purchase(planId));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The purchase could not be completed.',
      );
      throw caught;
    } finally {
      setLoading(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntitlement(await entitlementService.restore());
    } catch {
      setError('Purchases could not be restored.');
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      plans,
      entitlement,
      mode: entitlementService.mode,
      purchase,
      restore,
      error,
    }),
    [entitlement, error, loading, plans, purchase, restore],
  );
  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements(): EntitlementContextValue {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlements must be used inside EntitlementProvider');
  }
  return context;
}
