/**
 * Unit tests: OTP and session-token primitives (AUTH-02 / AUTH-03) and the SMS
 * provider factory. Nothing here touches the database.
 */
import {
  createOtpSecret,
  generateOtpCode,
  hashOtp,
  hashRefreshToken,
  isExpired,
  isWellFormedOtp,
  issueRefreshToken,
  otpMatches,
} from '../src/auth/crypto';
import { createSmsProvider } from '../src/auth/sms-provider.factory';
import { NullSmsProvider, SmsUnavailableError } from '../src/auth/sms-provider';

describe('OTP primitives (AUTH-02)', () => {
  it('generates a 6-digit code, including leading zeros', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('never stores the code itself, and verifies by constant-time hash compare', () => {
    const code = '004242';
    const secret = createOtpSecret(code);
    expect(secret.hash).not.toContain(code);
    expect(secret.salt).toHaveLength(32);
    expect(secret.hash).toBe(hashOtp(code, secret.salt));
    expect(otpMatches(code, secret)).toBe(true);
    expect(otpMatches('004243', secret)).toBe(false);
    // The same code under a different salt hashes differently.
    expect(createOtpSecret(code).hash).not.toBe(secret.hash);
  });

  it('only accepts a well-formed 6-digit candidate', () => {
    expect(isWellFormedOtp('123456')).toBe(true);
    expect(isWellFormedOtp('12345')).toBe(false);
    expect(isWellFormedOtp('1234567')).toBe(false);
    expect(isWellFormedOtp('12345a')).toBe(false);
    expect(isWellFormedOtp('')).toBe(false);
    expect(isWellFormedOtp(null)).toBe(false);
  });

  it('compares a candidate of the wrong length without throwing', () => {
    const secret = createOtpSecret('123456');
    expect(otpMatches('1', secret)).toBe(false);
    expect(otpMatches('', secret)).toBe(false);
  });
});

describe('refresh tokens (AUTH-03)', () => {
  it('issues an opaque token and stores only its hash', () => {
    const issued = issueRefreshToken();
    expect(issued.token.length).toBeGreaterThanOrEqual(40);
    expect(issued.tokenHash).toBe(hashRefreshToken(issued.token));
    expect(issued.tokenHash).not.toContain(issued.token);
    expect(issued.familyId).toHaveLength(32);
  });

  it('keeps a rotated token inside its own family', () => {
    const first = issueRefreshToken();
    const successor = issueRefreshToken(first.familyId);
    expect(successor.familyId).toBe(first.familyId);
    expect(successor.token).not.toBe(first.token);
    expect(issueRefreshToken().familyId).not.toBe(first.familyId);
  });

  it('treats a past expiry as expired and a future one as live', () => {
    const now = new Date('2026-09-19T10:00:00Z');
    expect(isExpired(new Date('2026-09-19T09:59:59Z'), now)).toBe(true);
    expect(isExpired(new Date('2026-09-19T10:00:00Z'), now)).toBe(true);
    expect(isExpired(new Date('2026-09-19T10:00:01Z'), now)).toBe(false);
  });
});

describe('SMS provider factory', () => {
  const base = { sender: 'Nourish', timeoutMs: 1000 };

  it('refuses the console provider in production even when configured', () => {
    expect(() =>
      createSmsProvider({ ...base, kind: 'console', nodeEnv: 'production' }),
    ).toThrow(/refused when NODE_ENV=production/);
  });

  it('allows the console provider outside production', () => {
    expect(createSmsProvider({ ...base, kind: 'console', nodeEnv: 'test' }).name).toBe(
      'console',
    );
  });

  it('requires a URL for the http gateway', () => {
    expect(() =>
      createSmsProvider({ ...base, kind: 'http', nodeEnv: 'production' }),
    ).toThrow(/SMS_API_URL/);
  });

  it('defaults to the honest null provider', () => {
    const provider = createSmsProvider({ ...base, kind: 'none', nodeEnv: 'production' });
    expect(provider.name).toBe('none');
    expect(provider).toBeInstanceOf(NullSmsProvider);
    return expect(provider.send({ toE164: '+251911234567', body: 'x' })).rejects.toBeInstanceOf(
      SmsUnavailableError,
    );
  });
});
