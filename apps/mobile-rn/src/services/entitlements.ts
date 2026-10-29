import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MOCK_PRO_KEY = '@nourish/mock-pro-v1';
const ENTITLEMENT_ID = 'pro';

export interface PlanOption {
  id: string;
  title: string;
  price: string;
  period: 'monthly' | 'annual';
}

export interface EntitlementSnapshot {
  isPro: boolean;
  source: 'revenuecat' | 'mock' | 'disabled';
}

const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();
const mockFlag = process.env.EXPO_PUBLIC_REVENUECAT_MOCK === 'true';

class EntitlementService {
  private configured = false;
  private options = new Map<string, unknown>();

  get mode(): 'revenuecat' | 'mock' | 'disabled' {
    if (mockFlag || (!iosKey && !androidKey && __DEV__)) return 'mock';
    if (
      (Platform.OS === 'ios' && iosKey) ||
      (Platform.OS === 'android' && androidKey)
    ) {
      return 'revenuecat';
    }
    return 'disabled';
  }

  async initialize(): Promise<EntitlementSnapshot> {
    if (this.mode === 'mock') {
      const purchased = await AsyncStorage.getItem(MOCK_PRO_KEY);
      return { isPro: purchased === 'true', source: 'mock' };
    }
    if (this.mode === 'disabled') return { isPro: false, source: 'disabled' };
    const Purchases = await this.module();
    Purchases.configure({
      apiKey: (Platform.OS === 'ios' ? iosKey : androidKey)!,
    });
    this.configured = true;
    return this.snapshot(await Purchases.getCustomerInfo());
  }

  async plans(): Promise<PlanOption[]> {
    if (this.mode === 'mock') {
      return [
        { id: 'monthly', title: 'Monthly', price: '$3.99', period: 'monthly' },
        { id: 'annual', title: 'Annual', price: '$29.99', period: 'annual' },
      ];
    }
    if (!this.configured) return [];
    const Purchases = await this.module();
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    const result: PlanOption[] = [];
    for (const item of current.availablePackages) {
      const period = item.packageType === 'ANNUAL' ? 'annual' : 'monthly';
      if (item.packageType !== 'ANNUAL' && item.packageType !== 'MONTHLY') {
        continue;
      }
      this.options.set(item.identifier, item);
      result.push({
        id: item.identifier,
        title: period === 'annual' ? 'Annual' : 'Monthly',
        price: item.product.priceString,
        period,
      });
    }
    return result;
  }

  async purchase(planId: string): Promise<EntitlementSnapshot> {
    if (this.mode === 'mock') {
      await AsyncStorage.setItem(MOCK_PRO_KEY, 'true');
      return { isPro: true, source: 'mock' };
    }
    const item = this.options.get(planId);
    if (!item) throw new Error('That subscription option is no longer available.');
    const Purchases = await this.module();
    const result = await Purchases.purchasePackage(item as never);
    return this.snapshot(result.customerInfo);
  }

  async restore(): Promise<EntitlementSnapshot> {
    if (this.mode === 'mock') {
      return { isPro: true, source: 'mock' };
    }
    if (!this.configured) return { isPro: false, source: 'disabled' };
    const Purchases = await this.module();
    return this.snapshot(await Purchases.restorePurchases());
  }

  private snapshot(info: {
    entitlements: { active: Record<string, { isActive: boolean }> };
  }): EntitlementSnapshot {
    return {
      isPro: Boolean(info.entitlements.active[ENTITLEMENT_ID]?.isActive),
      source: 'revenuecat',
    };
  }

  private async module() {
    const module = await import('react-native-purchases');
    return module.default;
  }
}

export const entitlementService = new EntitlementService();
