import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { gcm } from '@noble/ciphers/aes.js';
import {
  bytesToHex,
  bytesToUtf8,
  hexToBytes,
  utf8ToBytes,
} from '@noble/ciphers/utils.js';
import type { AccountSession, AppData, AppState } from '../types';
import { seedFoods, provisionalCatalogVersion } from '../data/seed';

const DATA_KEY = '@nourish/app-data/v1';
const SESSION_KEY = 'nourish.session.v1';
const DATA_ENCRYPTION_KEY = 'nourish.data-encryption-key.v1';
const ENCRYPTED_PREFIX = 'enc:v1:';

export const initialData: AppData = {
  onboarding: {
    started: false,
    completed: false,
    step: 0,
    language: 'en',
    goal: null,
    sex: 'female',
    age: '',
    heightCm: '',
    currentWeightKg: '',
    targetWeightKg: '',
    activity: 'moderate',
    pace: 'moderate',
    foodPreference: 'ethiopian',
  },
  target: null,
  settings: {
    waterTargetMl: 3000,
    aiImprovementConsent: false,
    analyticsConsent: false,
    remindersEnabled: false,
  },
  meals: [],
  water: [],
  weights: [],
  catalog: seedFoods,
  catalogVersion: provisionalCatalogVersion,
  queue: [],
};

export const initialState: AppState = {
  ...initialData,
  hydrated: false,
  session: null,
  syncState: 'idle',
  syncMessage: null,
  lastSyncedAt: null,
};

export async function loadAppData(): Promise<AppData> {
  try {
    const value = await AsyncStorage.getItem(DATA_KEY);
    if (!value) return initialData;
    const plaintext = value.startsWith(ENCRYPTED_PREFIX)
      ? await decryptData(value)
      : value;
    const parsed = JSON.parse(plaintext) as Partial<AppData> & {
      permissionSetupCompleted?: boolean;
    };
    // Ignore the old onboarding permission gate when upgrading existing installs.
    delete parsed.permissionSetupCompleted;
    return {
      ...initialData,
      ...parsed,
      onboarding: { ...initialData.onboarding, ...parsed.onboarding },
      settings: { ...initialData.settings, ...parsed.settings },
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
      water: Array.isArray(parsed.water) ? parsed.water : [],
      weights: Array.isArray(parsed.weights) ? parsed.weights : [],
      catalog:
        Array.isArray(parsed.catalog) && parsed.catalog.length > 0
          ? parsed.catalog
          : seedFoods,
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
    };
  } catch {
    return initialData;
  }
}

export async function saveAppData(state: AppState): Promise<void> {
  const persisted: AppData = {
    onboarding: state.onboarding,
    target: state.target,
    settings: state.settings,
    meals: state.meals,
    water: state.water,
    weights: state.weights,
    catalog: state.catalog,
    catalogVersion: state.catalogVersion,
    queue: state.queue,
  };
  const plaintext = JSON.stringify(persisted);
  const value =
    Platform.OS === 'web' ? plaintext : await encryptData(plaintext);
  await AsyncStorage.setItem(DATA_KEY, value);
}

export async function clearAppData(): Promise<void> {
  await AsyncStorage.multiRemove([DATA_KEY]);
  await clearSession();
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(DATA_ENCRYPTION_KEY);
  }
}

export async function loadSession(): Promise<AccountSession | null> {
  try {
    if (Platform.OS === 'web') {
      // expo-secure-store is not available on web. Do not downgrade refresh
      // credentials to localStorage in the preview bundle.
      return null;
    }
    const available = await SecureStore.isAvailableAsync();
    if (!available) return null;
    const value = await SecureStore.getItemAsync(SESSION_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<AccountSession>;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    const phone = parsed.phone ?? null;
    const providers = Array.isArray(parsed.authProviders)
      ? parsed.authProviders.filter(
          (provider): provider is AccountSession['authProviders'][number] =>
            provider === 'phone' || provider === 'email' || provider === 'google',
        )
      : phone
        ? (['phone'] as AccountSession['authProviders'])
        : [];
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      phone,
      email: parsed.email ?? null,
      displayName: parsed.displayName ?? null,
      authProviders: providers,
      plan: parsed.plan ?? 'FREE',
      createdAt: parsed.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveSession(session: AccountSession | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Session persistence is native-only until the web app has a dedicated
      // httpOnly-cookie session design.
      return;
    }
    if (session) {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch {
    // A storage failure must not crash the app; the in-memory session remains.
  }
}

export async function clearSession(): Promise<void> {
  await saveSession(null);
}

async function dataEncryptionKey(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(DATA_ENCRYPTION_KEY);
  if (existing) return hexToBytes(existing);
  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = Uint8Array.from(bytes);
  await SecureStore.setItemAsync(DATA_ENCRYPTION_KEY, bytesToHex(key), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}

async function encryptData(plaintext: string): Promise<string> {
  const key = await dataEncryptionKey();
  const nonce = Uint8Array.from(await Crypto.getRandomBytesAsync(12));
  const ciphertext = gcm(key, nonce).encrypt(utf8ToBytes(plaintext));
  return `${ENCRYPTED_PREFIX}${bytesToHex(nonce)}:${bytesToHex(ciphertext)}`;
}

async function decryptData(payload: string): Promise<string> {
  const key = await dataEncryptionKey();
  const [nonceHex, ciphertextHex] = payload.slice(ENCRYPTED_PREFIX.length).split(':');
  if (!nonceHex || !ciphertextHex) {
    throw new Error('Encrypted local data is malformed.');
  }
  const plaintext = gcm(key, hexToBytes(nonceHex)).decrypt(
    hexToBytes(ciphertextHex),
  );
  return bytesToUtf8(plaintext);
}
