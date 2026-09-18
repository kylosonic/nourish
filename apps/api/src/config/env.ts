import { plainToInstance, Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

/** Which AI provider implementation the process may use (ADR-0007 D-S2-1). */
export const AI_PROVIDER_KINDS = ['none', 'openai-compatible', 'fixture'] as const;
export type AiProviderKind = (typeof AI_PROVIDER_KINDS)[number];

/**
 * Environment schema (validated at boot). The app refuses to start when a
 * required variable is missing or malformed (fail-fast, master §60).
 */
export class EnvVars {
  @IsString()
  DATABASE_URL!: string;

  /** Provisioned for S3 queue parity only — NOT consumed by the API in S1. */
  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  CORS_ORIGINS!: string;

  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(100)
  RATE_LIMIT_TTL_MS: number = 60000;

  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  RATE_LIMIT_LIMIT: number = 60;

  /** Optional. When unset, Sentry is fully disabled (ADR-0006 / D4). */
  @IsOptional()
  @IsString()
  SENTRY_DSN?: string;

  // ── S2: analysis (ADR-0007) ───────────────────────────────────────────────

  /** `none` (default) | `openai-compatible` | `fixture` (refused in production). */
  @IsOptional()
  @IsIn(AI_PROVIDER_KINDS)
  AI_PROVIDER: AiProviderKind = 'none';

  @IsOptional()
  @IsString()
  AI_BASE_URL?: string;

  @IsOptional()
  @IsString()
  AI_API_KEY?: string;

  @IsOptional()
  @IsString()
  AI_VISION_MODEL: string = 'gpt-4o-mini';

  @IsOptional()
  @IsString()
  AI_TEXT_MODEL: string = 'gpt-4o-mini';

  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1000)
  @Max(120000)
  AI_TIMEOUT_MS: number = 20000;

  /** Hard cap on an uploaded image; larger requests are rejected with 413. */
  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1024)
  @Max(20 * 1024 * 1024)
  AI_MAX_IMAGE_BYTES: number = 4 * 1024 * 1024;

  /** Process-wide ceiling on analyses per UTC day; 0 disables the guard. */
  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  AI_DAILY_BUDGET: number = 2000;

  /** Analysis *metadata* retention; imagery is never stored at all (SAFE-05). */
  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  ANALYSIS_RETENTION_DAYS: number = 30;
}

/** Validate a raw config record; throws with a precise message on failure. */
export function validateEnv(config: Record<string, unknown>): EnvVars {
  const validated = plainToInstance(EnvVars, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validated, { whitelist: true, skipMissingProperties: false });
  if (errors.length) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('; ');
    throw new Error(`Invalid environment configuration — ${details}`);
  }
  return validated;
}

/** Parse CORS_ORIGINS ("a,b,c" or "scheme://host:*" port-wildcards) into matchers. */
export function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

/**
 * Origin allowlist check. Supports exact entries and `scheme://host:*` entries
 * where only the PORT is wildcarded.
 *
 * QA finding F-07 (S1 Gate C, deferred to S3 by the security record): the
 * previous implementation used `origin.startsWith(prefix)`, so an allowlist
 * entry of `http://localhost:*` also admitted `http://localhost.evil.com` —
 * defeating the exact-match entries as well. Origins are now parsed and
 * compared by protocol and hostname, with the port wildcarded only where the
 * entry says so. A lookalike host can no longer match.
 */
export function isOriginAllowed(origin: string, allowlist: string[]): boolean {
  if (!origin) return false;

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false; // an unparseable origin is never allowed
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  for (const entry of allowlist) {
    if (entry === '*') return false; // never wildcard (blueprint §13)

    const wildcardPort = entry.endsWith(':*');
    const candidate = wildcardPort ? entry.slice(0, -2) : entry;

    let expected: URL;
    try {
      expected = new URL(candidate);
    } catch {
      continue; // a malformed allowlist entry matches nothing
    }

    if (expected.protocol !== parsed.protocol) continue;
    if (expected.hostname !== parsed.hostname) continue;

    if (wildcardPort) return true;
    // An exact entry must also match the port: the default port when the entry
    // omits it, otherwise the port the entry names.
    const expectedPort = expected.port || (expected.protocol === 'https:' ? '443' : '80');
    const actualPort = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    if (expectedPort === actualPort) return true;
  }
  return false;
}
