import { plainToInstance, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

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

/** Origin allowlist check. Supports exact entries and "scheme://host:*" entries. */
export function isOriginAllowed(origin: string, allowlist: string[]): boolean {
  if (!origin) return false;
  for (const entry of allowlist) {
    if (entry === '*') return false; // never wildcard (blueprint §13)
    if (entry.endsWith(':*')) {
      const prefix = entry.slice(0, -2);
      if (origin.startsWith(prefix)) return true;
    } else if (origin === entry) {
      return true;
    }
  }
  return false;
}
