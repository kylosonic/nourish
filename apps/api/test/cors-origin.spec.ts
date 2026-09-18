/**
 * Unit tests: the CORS origin allowlist (QA finding F-07, deferred to S3 by the
 * S1 security record, fixed here).
 *
 * The defect: `origin.startsWith(prefix)` admitted `http://localhost.evil.com`
 * whenever the allowlist contained `http://localhost:*`, and also defeated the
 * exact-match entries.
 */
import { isOriginAllowed, parseCorsOrigins } from '../src/config/env';

const ALLOWLIST = parseCorsOrigins(
  'http://localhost:3000,http://localhost:5173,https://app.nourish.app,http://localhost:*',
);

describe('isOriginAllowed', () => {
  it('allows the exact origins in the allowlist', () => {
    expect(isOriginAllowed('http://localhost:3000', ALLOWLIST)).toBe(true);
    expect(isOriginAllowed('http://localhost:5173', ALLOWLIST)).toBe(true);
    expect(isOriginAllowed('https://app.nourish.app', ALLOWLIST)).toBe(true);
  });

  it('allows an arbitrary port only where the entry says so', () => {
    expect(isOriginAllowed('http://localhost:8080', ALLOWLIST)).toBe(true);
    expect(isOriginAllowed('http://localhost:65535', ALLOWLIST)).toBe(true);
  });

  it('rejects lookalike hosts that merely share a prefix (F-07)', () => {
    expect(isOriginAllowed('http://localhost.evil.com', ALLOWLIST)).toBe(false);
    expect(isOriginAllowed('http://localhost:5173.evil.com', ALLOWLIST)).toBe(false);
    expect(isOriginAllowed('http://localhost@evil.com', ALLOWLIST)).toBe(false);
    expect(isOriginAllowed('http://localhost:3000.evil.com', ALLOWLIST)).toBe(false);
  });

  it('rejects a matching host on the wrong scheme or port', () => {
    expect(isOriginAllowed('https://localhost:3000', ALLOWLIST)).toBe(false);
    expect(isOriginAllowed('http://app.nourish.app', ALLOWLIST)).toBe(false);
    const exactOnly = parseCorsOrigins('http://localhost:3000');
    expect(isOriginAllowed('http://localhost:3001', exactOnly)).toBe(false);
    expect(isOriginAllowed('http://localhost', exactOnly)).toBe(false);
  });

  it('handles default ports on exact entries', () => {
    expect(isOriginAllowed('https://nourish.app', parseCorsOrigins('https://nourish.app'))).toBe(
      true,
    );
    expect(
      isOriginAllowed('https://nourish.app:8443', parseCorsOrigins('https://nourish.app')),
    ).toBe(false);
  });

  it('never allows a wildcard entry (blueprint §13)', () => {
    expect(isOriginAllowed('http://anything.example', ['*'])).toBe(false);
  });

  it('rejects empty, malformed and non-http(s) origins', () => {
    expect(isOriginAllowed('', ALLOWLIST)).toBe(false);
    expect(isOriginAllowed('not an origin', ALLOWLIST)).toBe(false);
    expect(isOriginAllowed('file:///tmp/x', ALLOWLIST)).toBe(false);
    expect(isOriginAllowed('null', ALLOWLIST)).toBe(false);
  });

  it('ignores malformed allowlist entries instead of throwing', () => {
    const messy = parseCorsOrigins('nonsense, http://localhost:3000,');
    expect(isOriginAllowed('http://localhost:3000', messy)).toBe(true);
    expect(isOriginAllowed('http://localhost:3001', messy)).toBe(false);
  });
});
