/**
 * SMS delivery seam (AUTH-02).
 *
 * The code is delivered by an operator-configured provider; there is no path in
 * which production pretends to have sent one. The three implementations mirror
 * the AI provider seam (ADR-0007 D-S2-1):
 *
 *   - `none`    — no provider configured: the API answers 503 honestly;
 *   - `console` — development only, logs the code; REFUSED in production;
 *   - `http`    — a generic operator gateway (POST url + bearer token).
 *
 * P-OTP-1 (which Ethiopian gateway, and therefore code length/TTL) is not
 * settled, so the contract here is the seam plus configuration, and the
 * provisional defaults are recorded in ADR-0008.
 */
export interface SmsMessage {
  toE164: string;
  body: string;
}

export interface SmsProvider {
  readonly name: string;
  /** Resolves when the gateway accepted the message for delivery. */
  send(message: SmsMessage): Promise<void>;
}

/** No provider is configured. The API answers 503 rather than faking a send. */
export class SmsUnavailableError extends Error {
  constructor(message = 'No SMS provider is configured') {
    super(message);
    this.name = 'SmsUnavailableError';
  }
}

/** The gateway rejected or could not be reached. Its body is never surfaced. */
export class SmsDeliveryError extends Error {
  constructor(message: string, readonly kind: 'transport' | 'status' | 'timeout') {
    super(message);
    this.name = 'SmsDeliveryError';
  }
}

export class NullSmsProvider implements SmsProvider {
  readonly name = 'none';

  send(): Promise<void> {
    return Promise.reject(new SmsUnavailableError());
  }
}
