import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * OTP and token primitives (AUTH-02 / AUTH-03).
 *
 * Nothing secret is ever stored in a recoverable form:
 *   - the sign-in code is stored as a salted SHA-256 hash for its validity
 *     window only, and the plaintext exists solely in the SMS we send;
 *   - a refresh token is stored as a SHA-256 hash, and the token itself is
 *     returned exactly once, at issue time.
 *
 * These are pure functions with no database access, so the rules are unit
 * testable in isolation from the HTTP layer.
 */

export interface HashedSecret {
  hash: string;
  salt: string;
}

const OTP_DIGITS = 6;

/** A uniformly random numeric code, zero-padded (no modulo bias). */
export function generateOtpCode(): string {
  const value = randomInt(0, 10 ** OTP_DIGITS);
  return String(value).padStart(OTP_DIGITS, '0');
}

export function hashOtp(code: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

export function createOtpSecret(code: string): HashedSecret {
  const salt = randomBytes(16).toString('hex');
  return { hash: hashOtp(code, salt), salt };
}

/** Constant-time comparison, so a wrong code cannot be discovered by timing. */
export function otpMatches(candidate: string, secret: HashedSecret): boolean {
  const candidateHash = Buffer.from(hashOtp(candidate, secret.salt), 'hex');
  const storedHash = Buffer.from(secret.hash, 'hex');
  if (candidateHash.length !== storedHash.length) return false;
  return timingSafeEqual(candidateHash, storedHash);
}

/** Only 6-digit numeric codes are ever worth hashing against a challenge. */
export function isWellFormedOtp(candidate: string | null | undefined): boolean {
  return typeof candidate === 'string' && new RegExp(`^\\d{${OTP_DIGITS}}$`).test(candidate);
}

export interface IssuedRefreshToken {
  /** Returned to the client exactly once; never persisted. */
  token: string;
  /** Persisted instead of the token. */
  tokenHash: string;
  familyId: string;
}

export function issueRefreshToken(familyId?: string): IssuedRefreshToken {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashRefreshToken(token),
    familyId: familyId ?? randomBytes(16).toString('hex'),
  };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Access-token claims. Deliberately small: no profile data belongs in a JWT. */
export interface AccessTokenClaims {
  sub: string;
  sid: string;
  iat: number;
  exp: number;
}

export function secondsFromNow(seconds: number, now = Date.now()): number {
  return Math.floor(now / 1000) + seconds;
}

export function isExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
