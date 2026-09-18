/**
 * Ethiopian mobile number normalization (AUTH-01).
 *
 * The rule is fixed for this release: a number either normalizes to a valid
 * `+251` mobile number or it is rejected with a message the user can act on.
 * Two spellings of the same number must produce the same account, so this
 * function is the single place that decides what "the same number" means.
 */

export type PhoneRejection =
  | 'empty'
  | 'not-ethiopian'
  | 'not-mobile'
  | 'wrong-length'
  | 'not-a-number';

export interface PhoneResult {
  ok: boolean;
  /** Present when ok: the E.164 form, always `+251` followed by 9 digits. */
  e164?: string;
  /** Present when not ok: a stable code for the client to translate. */
  reason?: PhoneRejection;
}

/** Ethiopian mobile prefixes after the leading 0 / country code is removed. */
const MOBILE_PREFIXES = ['9', '7'];

/**
 * Normalize any accepted spelling of an Ethiopian mobile number.
 *
 * Accepted: `0911 23 45 67`, `0911-23-45-67`, `(0911) 234567`, `+251911234567`,
 * `251911234567`, `911234567`.
 * Rejected: other countries, landlines, and anything that is not 9 national
 * digits after the country code.
 */
export function normalizeEthiopianPhone(input: string | null | undefined): PhoneResult {
  if (input == null) return { ok: false, reason: 'empty' };

  const raw = String(input).trim();
  if (raw === '') return { ok: false, reason: 'empty' };

  // Strip the punctuation people actually type.
  let cleaned = raw.replace(/[\s()\-.]/g, '');

  if (cleaned.startsWith('+')) {
    if (!cleaned.startsWith('+251')) {
      // A different country: not accepted in this release (AUTH-01 edge case).
      return { ok: false, reason: 'not-ethiopian' };
    }
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('00251')) {
    cleaned = cleaned.slice(5);
  } else if (cleaned.startsWith('251') && cleaned.length > 9) {
    cleaned = cleaned.slice(3);
  }

  if (!/^\d+$/.test(cleaned)) return { ok: false, reason: 'not-a-number' };

  // Strip the national trunk prefix ("0").
  while (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length !== 9) return { ok: false, reason: 'wrong-length' };
  if (!MOBILE_PREFIXES.some((prefix) => cleaned.startsWith(prefix))) {
    return { ok: false, reason: 'not-mobile' };
  }

  return { ok: true, e164: `+251${cleaned}` };
}

/** Human-readable rejection copy (the client shows this next to the field). */
export function phoneRejectionMessage(reason: PhoneRejection): string {
  switch (reason) {
    case 'empty':
      return 'Enter your phone number.';
    case 'not-ethiopian':
      return 'Nourish currently supports Ethiopian numbers only (+251).';
    case 'not-mobile':
      return 'That looks like a landline. Enter an Ethiopian mobile number starting 09 or 07.';
    case 'wrong-length':
      return 'That number is not the right length. Ethiopian mobiles have 9 digits after +251.';
    case 'not-a-number':
    default:
      return 'That does not look like a phone number.';
  }
}
