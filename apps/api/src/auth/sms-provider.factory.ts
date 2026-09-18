import { Logger } from '@nestjs/common';
import { SmsProvider, NullSmsProvider } from './sms-provider';
import { ConsoleSmsProvider, HttpSmsProvider } from './sms.providers';

export const SMS_PROVIDER_KINDS = ['none', 'console', 'http'] as const;
export type SmsProviderKind = (typeof SMS_PROVIDER_KINDS)[number];

export interface SmsProviderSettings {
  kind: SmsProviderKind;
  url?: string;
  apiKey?: string;
  sender: string;
  timeoutMs: number;
  nodeEnv: string;
}

/**
 * Selects the SMS provider (mirrors the AI provider factory, ADR-0007 D-S2-1).
 *
 * Hard rules enforced here rather than by convention:
 *  - `console` is refused when NODE_ENV=production, so a live sign-in code can
 *    never be written to a production log;
 *  - `http` requires a URL, so a misconfiguration fails at boot rather than at
 *    the first user's sign-in;
 *  - anything else yields the honest NullSmsProvider (503 on request).
 */
export function createSmsProvider(settings: SmsProviderSettings): SmsProvider {
  const logger = new Logger('sms');

  if (settings.kind === 'console') {
    if (settings.nodeEnv === 'production') {
      throw new Error(
        'SMS_PROVIDER=console is refused when NODE_ENV=production: sign-in codes ' +
          'must never be written to a production log',
      );
    }
    logger.warn('SMS provider is the console provider (development only)');
    return new ConsoleSmsProvider();
  }

  if (settings.kind === 'http') {
    if (!settings.url) {
      throw new Error('SMS_PROVIDER=http requires SMS_API_URL');
    }
    logger.log('SMS provider: http gateway');
    return new HttpSmsProvider({
      url: settings.url,
      apiKey: settings.apiKey,
      sender: settings.sender,
      timeoutMs: settings.timeoutMs,
    });
  }

  logger.log('SMS provider: none — sign-in requests will answer 503 SMS_UNAVAILABLE');
  return new NullSmsProvider();
}
