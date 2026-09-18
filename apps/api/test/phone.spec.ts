/**
 * Unit tests: AUTH-01 phone normalization.
 *
 * "Two spellings of the same number are the same account" is a data-integrity
 * rule, not a formatting preference, so it is pinned here.
 */
import { normalizeEthiopianPhone, phoneRejectionMessage } from '../src/auth/phone';

describe('normalizeEthiopianPhone (AUTH-01)', () => {
  it('accepts the local spelling and produces +251 E.164', () => {
    // The acceptance example from the behavior contract, verbatim.
    expect(normalizeEthiopianPhone('0911 23 45 67')).toEqual({
      ok: true,
      e164: '+251911234567',
    });
  });

  it('treats every spelling of one number as the same account', () => {
    const spellings = [
      '0911234567',
      '0911 23 45 67',
      '0911-23-45-67',
      '(0911) 234567',
      '+251911234567',
      '+251 911 234 567',
      '251911234567',
      '00251911234567',
      '911234567',
    ];
    const normalized = spellings.map((s) => normalizeEthiopianPhone(s));
    for (const result of normalized) {
      expect(result.ok).toBe(true);
      expect(result.e164).toBe('+251911234567');
    }
  });

  it('accepts the Safaricom 07 prefix as well as 09', () => {
    expect(normalizeEthiopianPhone('0712345678').e164).toBe('+251712345678');
    expect(normalizeEthiopianPhone('+251712345678').e164).toBe('+251712345678');
  });

  it('rejects numbers from other countries', () => {
    expect(normalizeEthiopianPhone('+254712345678')).toEqual({
      ok: false,
      reason: 'not-ethiopian',
    });
    expect(phoneRejectionMessage('not-ethiopian')).toMatch(/Ethiopian numbers only/);
  });

  it('rejects landlines and implausible lengths', () => {
    expect(normalizeEthiopianPhone('0111234567')).toEqual({ ok: false, reason: 'not-mobile' });
    expect(normalizeEthiopianPhone('09112345')).toEqual({ ok: false, reason: 'wrong-length' });
    expect(normalizeEthiopianPhone('09112345678')).toEqual({ ok: false, reason: 'wrong-length' });
    expect(phoneRejectionMessage('not-mobile')).toMatch(/landline/);
  });

  it('rejects empty and non-numeric input', () => {
    expect(normalizeEthiopianPhone('')).toEqual({ ok: false, reason: 'empty' });
    expect(normalizeEthiopianPhone(null)).toEqual({ ok: false, reason: 'empty' });
    expect(normalizeEthiopianPhone(undefined)).toEqual({ ok: false, reason: 'empty' });
    expect(normalizeEthiopianPhone('not a phone')).toEqual({
      ok: false,
      reason: 'not-a-number',
    });
  });

  it('does not silently accept a number padded with junk', () => {
    expect(normalizeEthiopianPhone('0911234567x').ok).toBe(false);
    expect(normalizeEthiopianPhone('09-11-23-45-67 ').e164).toBe('+251911234567');
  });

  it('every rejection reason has user-facing copy', () => {
    for (const reason of [
      'empty',
      'not-ethiopian',
      'not-mobile',
      'wrong-length',
      'not-a-number',
    ] as const) {
      expect(phoneRejectionMessage(reason).length).toBeGreaterThan(10);
    }
  });
});
