import { Platform } from 'react-native';
import type {
  AccountSession,
  AnalysisResult,
  Food,
  Meal,
  Nutrition,
  PortionUnit,
  SyncOperation,
} from '../types';

const developmentBase =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  (__DEV__ ? developmentBase : 'https://api.nourish.app');

export const RELEASE_METADATA_URL =
  process.env.EXPO_PUBLIC_RELEASE_URL ||
  'https://nourish-kylosonic.vercel.app/latest.json';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = 'REQUEST_FAILED', status = 0) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 30_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      let code = `HTTP_${response.status}`;
      let message = `Request failed (${response.status}).`;
      try {
        const payload = (await response.json()) as {
          error?: { code?: string; message?: string };
        };
        code = payload.error?.code || code;
        message = payload.error?.message || message;
      } catch {
        // The API sometimes has no JSON body (204/304). Do not leak raw text.
      }
      throw new ApiError(message, code, response.status);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The request took too long. Please try again.', 'TIMEOUT');
    }
    throw new ApiError(
      'Could not reach Nourish. Check your connection and try again.',
      'NETWORK',
    );
  } finally {
    clearTimeout(timer);
  }
}

interface CatalogWireFood {
  id?: string;
  canonicalName?: string;
  category?: string;
  defaultPortion?: { unit?: string; quantity?: number; grams?: number };
  portions?: { unit?: string; quantity?: number; grams?: number }[];
  per100g?: Partial<Nutrition>;
  aliases?: { alias?: string }[];
  source?: { name?: string; version?: string };
}

export interface CatalogPayload {
  version: string;
  generatedAt: string;
  sha256: string;
  foods: Food[];
}

export async function fetchCatalog(etag?: string | null): Promise<CatalogPayload | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${API_BASE_URL}/v1/catalog`, {
      headers: {
        Accept: 'application/json',
        ...(etag ? { 'If-None-Match': etag } : {}),
      },
      signal: controller.signal,
    });
    if (response.status === 304) return null;
    if (!response.ok) {
      throw new ApiError(
        `The food catalog is unavailable (${response.status}).`,
        `HTTP_${response.status}`,
        response.status,
      );
    }
    const body = (await response.json()) as {
      version?: string;
      generatedAt?: string;
      sha256?: string;
      foods?: CatalogWireFood[];
    };
    if (!body.version || !Array.isArray(body.foods) || body.foods.length === 0) {
      throw new ApiError('The food catalog response was incomplete.', 'MALFORMED');
    }
    const foods = body.foods.map(mapFood).filter((food): food is Food => food !== null);
    if (foods.length === 0) {
      throw new ApiError('The food catalog contained no usable foods.', 'MALFORMED');
    }
    return {
      version: body.version,
      generatedAt: body.generatedAt || new Date().toISOString(),
      sha256: body.sha256 || '',
      foods,
    };
  } finally {
    clearTimeout(timer);
  }
}

function mapFood(wire: CatalogWireFood): Food | null {
  const id = wire.id?.trim();
  const name = wire.canonicalName?.trim();
  if (!id || !name || !wire.per100g) return null;
  const { kcal, proteinG, carbsG, fatG } = wire.per100g;
  if (
    ![kcal, proteinG, carbsG, fatG].every(
      (value) => typeof value === 'number' && Number.isFinite(value),
    )
  ) {
    return null;
  }

  const portions = (wire.portions || [])
    .map((portion) => ({
      unit: portion.unit as PortionUnit,
      quantity: portion.quantity ?? 1,
      grams: portion.grams ?? 0,
    }))
    .filter((portion) => portion.unit && portion.grams > 0);
  const defaultPortion = wire.defaultPortion?.unit
    ? {
        unit: wire.defaultPortion.unit as PortionUnit,
        quantity: wire.defaultPortion.quantity ?? 1,
        grams: wire.defaultPortion.grams ?? 0,
      }
    : portions[0];
  if (!defaultPortion || defaultPortion.grams <= 0) return null;

  return {
    id,
    canonicalName: name,
    category: wire.category || 'Ethiopian',
    defaultPortion,
    portions: portions.length > 0 ? portions : [defaultPortion],
    per100g: {
      kcal: kcal as number,
      proteinG: proteinG as number,
      carbsG: carbsG as number,
      fatG: fatG as number,
      fiberG: wire.per100g.fiberG,
      sodiumMg: wire.per100g.sodiumMg,
    },
    aliases:
      wire.aliases
        ?.map((alias) => alias.alias?.trim())
        .filter((alias): alias is string => Boolean(alias)) || [],
    sourceName: wire.source?.name || 'ethiopian-fct-2025',
    sourceVersion: wire.source?.version,
  };
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  return request<AnalysisResult>(
    '/v1/analyses',
    { method: 'POST', body: JSON.stringify({ text }) },
    45_000,
  );
}

export async function analyzeImage(imageBase64: string): Promise<AnalysisResult> {
  return request<AnalysisResult>(
    '/v1/analyses',
    { method: 'POST', body: JSON.stringify({ imageBase64 }) },
    60_000,
  );
}

export async function reportCorrections(
  analysisId: string,
  items: Record<string, unknown>[],
): Promise<void> {
  try {
    await request<void>(`/v1/analyses/${analysisId}/corrections`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  } catch {
    // Correction capture is explicitly best-effort and must never block saving.
  }
}

export async function requestOtp(
  phone: string,
): Promise<{ phoneE164: string; expiresIn: number; resendAfter: number }> {
  return request('/v1/auth/otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<{ session: AccountSession; created: boolean }> {
  const result = await request<AuthResponseWire>('/v1/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  return { session: mapAccountSession(result), created: result.created };
}

interface AuthResponseWire {
  tokens: { accessToken: string; refreshToken: string };
  account: {
    phoneE164: string | null;
    email: string | null;
    displayName: string | null;
    authProviders: ('phone' | 'email' | 'google')[];
    plan: string;
  };
  created: boolean;
}

function mapAccountSession(result: AuthResponseWire): AccountSession {
  return {
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    phone: result.account.phoneE164,
    email: result.account.email,
    displayName: result.account.displayName,
    authProviders: result.account.authProviders,
    plan: result.account.plan,
    createdAt: new Date().toISOString(),
  };
}

export async function registerEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ session: AccountSession; created: boolean }> {
  const result = await request<AuthResponseWire>('/v1/auth/email/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  return { session: mapAccountSession(result), created: result.created };
}

export async function loginEmail(
  email: string,
  password: string,
): Promise<{ session: AccountSession; created: boolean }> {
  const result = await request<AuthResponseWire>('/v1/auth/email/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return { session: mapAccountSession(result), created: result.created };
}

export async function signInWithGoogle(
  idToken: string,
): Promise<{ session: AccountSession; created: boolean }> {
  const result = await request<AuthResponseWire>('/v1/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  return { session: mapAccountSession(result), created: result.created };
}

export async function refreshSession(session: AccountSession): Promise<AccountSession> {
  const result = await request<{
    tokens: { accessToken: string; refreshToken: string };
  }>('/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  return {
    ...session,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
  };
}

export async function logout(session: AccountSession): Promise<void> {
  await request<void>('/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
}

export async function pushChanges(
  session: AccountSession,
  operations: SyncOperation[],
): Promise<{
  applied: { clientId: string; kind: string; op: string; outcome: string }[];
  rejected: { clientId: string | null; kind: string | null; reason: string }[];
  serverTime: string;
}> {
  return request(
    '/v1/sync',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({
        operations: operations.map((operation) => ({
          kind: operation.kind,
          op: operation.op,
          clientId: operation.clientId,
          clientSeq: operation.clientSeq,
          updatedAt: operation.updatedAt,
          loggedAt: operation.loggedAt,
          dateKey: operation.dateKey,
          slot: operation.slot,
          items: operation.items?.map((item) => ({
            clientId: item.id,
            foodId: item.foodId,
            foodName: item.foodName,
            portionUnit: item.portionUnit,
            portionQuantity: item.portionQuantity,
            grams: item.grams,
            kcal: item.nutrition.kcal,
            proteinG: item.nutrition.proteinG,
            carbsG: item.nutrition.carbsG,
            fatG: item.nutrition.fatG,
            fiberG: item.nutrition.fiberG,
            sodiumMg: item.nutrition.sodiumMg,
          })),
          amountMl: operation.amountMl,
          weightKg: operation.weightKg,
        })),
      }),
    },
    20_000,
  );
}

export interface ReleaseMetadata {
  version: string;
  release_date?: string;
  android?: {
    available?: boolean;
    apk?: string | null;
    universal_apk?: { url?: string } | null;
  };
  ios?: { available?: boolean; installable?: boolean; ipa?: string | null };
  github_release?: string;
}

export async function fetchReleaseMetadata(): Promise<ReleaseMetadata | null> {
  try {
    const response = await fetch(RELEASE_METADATA_URL);
    if (!response.ok) return null;
    return (await response.json()) as ReleaseMetadata;
  } catch {
    return null;
  }
}

export function mealToOperation(meal: Meal, sequence: number): SyncOperation {
  return {
    id: `queue_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    kind: 'meal',
    op: 'upsert',
    clientId: meal.id,
    clientSeq: sequence,
    updatedAt: meal.createdAt,
    loggedAt: meal.loggedAt,
    dateKey: meal.dateKey,
    slot: meal.slot,
    items: meal.items,
  };
}
