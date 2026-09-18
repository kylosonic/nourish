import { Logger } from '@nestjs/common';
import { SmsDeliveryError, SmsMessage, SmsProvider } from './sms-provider';

/**
 * Development provider: writes the code to the log so a developer can sign in
 * without a gateway. The factory refuses to construct it when
 * NODE_ENV=production, so a real user's code can never end up in a log.
 */
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';
  private readonly logger = new Logger('sms');

  send(message: SmsMessage): Promise<void> {
    this.logger.warn(`[dev] SMS to ${message.toE164}: ${message.body}`);
    return Promise.resolve();
  }
}

export interface HttpSmsConfig {
  url: string;
  apiKey?: string;
  sender: string;
  timeoutMs: number;
}

/**
 * Generic operator gateway: `POST {url}` with a bearer token and a JSON body
 * containing `to`, `from` and `text`. This is the shape most Ethiopian SMS
 * aggregators expose; a specific gateway (P-OTP-1) becomes a thin adapter over
 * this one rather than a new code path.
 */
export class HttpSmsProvider implements SmsProvider {
  readonly name = 'http';
  private readonly logger = new Logger('sms');

  constructor(
    private readonly config: HttpSmsConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(message: SmsMessage): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImpl(this.config.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.config.apiKey ? { authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          to: message.toE164,
          from: this.config.sender,
          text: message.body,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        // Status only: a gateway body can echo the code back, and must never
        // reach the logs.
        this.logger.warn(`SMS gateway returned HTTP ${response.status}`);
        throw new SmsDeliveryError(`SMS gateway returned HTTP ${response.status}`, 'status');
      }
    } catch (error) {
      if (error instanceof SmsDeliveryError) throw error;
      const aborted = (error as { name?: string }).name === 'AbortError';
      this.logger.warn(aborted ? 'SMS gateway timeout' : 'SMS gateway transport failure');
      throw new SmsDeliveryError(
        aborted ? 'SMS gateway timed out' : 'SMS gateway is unreachable',
        aborted ? 'timeout' : 'transport',
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
