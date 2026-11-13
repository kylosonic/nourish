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
import type {
  AccountSession,
  AppData,
  AppState,
  CoupleWellness,
} from '../types';
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
    reminderStartMinutes: 10 * 60,
    reminderEndMinutes: 18 * 60,
    reminderIntervalMinutes: 240,
  },
  meals: [],
  water: [],
  weights: [],
  coupleWellness: {
    trackingEnabled: false,
    cycleLengthDays: 28,
    periodLengthDays: 5,
    cycleEntries: [],
    checkIns: [],
    profileUpdatedAt: null,
    connection: null,
    invitation: null,
    lastFetchedAt: null,
  },
  catalog: seedFoods,
  catalogVersion: provisionalCatalogVersion,
  queue: [],
  syncCursor: null,
  pendingConsents: {},
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
      coupleWellness: normalizeCoupleWellness(parsed.coupleWellness),
      catalog:
        Array.isArray(parsed.catalog) && parsed.catalog.length > 0
          ? parsed.catalog
          : seedFoods,
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      syncCursor:
        typeof parsed.syncCursor === 'string' && parsed.syncCursor.length > 0
          ? parsed.syncCursor
          : null,
      pendingConsents:
        parsed.pendingConsents && typeof parsed.pendingConsents === 'object'
          ? parsed.pendingConsents
          : {},
    };
  } catch {
    return initialData;
  }
}

export async function saveAppData(state: AppData): Promise<void> {
  const persisted: AppData = {
    onboarding: state.onboarding,
    target: state.target,
    settings: state.settings,
    meals: state.meals,
    water: state.water,
    weights: state.weights,
    coupleWellness: state.coupleWellness,
    catalog: state.catalog,
    catalogVersion: state.catalogVersion,
    queue: state.queue,
    syncCursor: state.syncCursor,
    pendingConsents: state.pendingConsents,
  };
  const plaintext = JSON.stringify(persisted);
  const value =
    Platform.OS === 'web' ? plaintext : await encryptData(plaintext);
  await AsyncStorage.setItem(DATA_KEY, value);
}

function normalizeCoupleWellness(
  value:
    | (Partial<CoupleWellness> & {
        partnerName?: unknown;
        periodStarts?: unknown;
        symptoms?: unknown;
        checkInDates?: unknown;
        sharePeriodWithPartner?: unknown;
        shareCheckInWithPartner?: unknown;
      })
    | undefined,
): CoupleWellness {
  const defaults = initialData.coupleWellness;
  const legacySymptoms =
    value?.symptoms &&
    typeof value.symptoms === 'object' &&
    !Array.isArray(value.symptoms)
      ? (value.symptoms as Record<string, unknown>)
      : {};
  const legacyEntries = Array.isArray(value?.periodStarts)
    ? value.periodStarts
        .filter((dateKey): dateKey is string => typeof dateKey === 'string')
        .map((startDateKey) => ({
          id: `cycle_${startDateKey}`,
          startDateKey,
          endDateKey: null,
          symptoms: Array.isArray(legacySymptoms[startDateKey])
            ? legacySymptoms[startDateKey].filter(
                (symptom): symptom is CoupleWellness['cycleEntries'][number]['symptoms'][number] =>
                  typeof symptom === 'string',
              )
            : [],
          updatedAt: new Date(0).toISOString(),
          clientSeq: 0,
        }))
    : [];
  const entries =
    Array.isArray(value?.cycleEntries) && value.cycleEntries.length > 0
      ? value.cycleEntries.filter((entry) => {
          return (
            entry &&
            typeof entry.id === 'string' &&
            typeof entry.startDateKey === 'string'
          );
        })
      : legacyEntries;
  const checkIns =
    Array.isArray(value?.checkIns) && value.checkIns.length > 0
      ? value.checkIns.filter((entry) => {
          return (
            entry &&
            typeof entry.id === 'string' &&
            typeof entry.dateKey === 'string'
          );
        })
      : Array.isArray(value?.checkInDates)
        ? value.checkInDates
            .filter((dateKey): dateKey is string => typeof dateKey === 'string')
            .map((dateKey) => ({
              id: `checkin_${dateKey}`,
              dateKey,
              updatedAt: new Date(0).toISOString(),
              clientSeq: 0,
            }))
        : [];
  return {
    trackingEnabled:
      typeof value?.trackingEnabled === 'boolean'
        ? value.trackingEnabled
        : entries.length > 0,
    cycleLengthDays:
      typeof value?.cycleLengthDays === 'number'
        ? value.cycleLengthDays
        : defaults.cycleLengthDays,
    periodLengthDays:
      typeof value?.periodLengthDays === 'number'
        ? value.periodLengthDays
        : defaults.periodLengthDays,
    cycleEntries: entries,
    checkIns,
    profileUpdatedAt:
      typeof value?.profileUpdatedAt === 'string'
        ? value.profileUpdatedAt
        : null,
    connection: value?.connection ?? null,
    invitation: value?.invitation ?? null,
    lastFetchedAt:
      typeof value?.lastFetchedAt === 'string' ? value.lastFetchedAt : null,
  };
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
