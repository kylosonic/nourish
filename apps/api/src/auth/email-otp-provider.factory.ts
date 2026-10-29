import { Logger } from '@nestjs/common';
import { EmailOtpProvider, NullEmailOtpProvider } from './email-otp-provider';
import {
  ConsoleEmailOtpProvider,
  ResendEmailOtpProvider,
  SmtpEmailOtpProvider,
} from './email-otp.providers';
import { EmailOtpProviderKind } from '../config/env';

export interface EmailOtpProviderSettings {
  kind: EmailOtpProviderKind;
  nodeEnv: string;
  timeoutMs: number;
  from?: string;
  resendApiKey?: string;
  resendApiUrl: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
}

export function createEmailOtpProvider(
  settings: EmailOtpProviderSettings,
): EmailOtpProvider {
  const logger = new Logger('email-otp');
  const from = settings.from || 'Nourish <no-reply@nourish.app>';

  if (settings.kind === 'console') {
    if (settings.nodeEnv === 'production') {
      throw new Error(
        'EMAIL_OTP_PROVIDER=console is refused when NODE_ENV=production',
      );
    }
    logger.warn('Email OTP provider is console-only (development)');
    return new ConsoleEmailOtpProvider();
  }

  if (settings.kind === 'resend') {
    if (!settings.resendApiKey || !settings.from) {
      throw new Error(
        'EMAIL_OTP_PROVIDER=resend requires RESEND_API_KEY and OTP_EMAIL_FROM',
      );
    }
    logger.log('Email OTP provider: Resend');
    return new ResendEmailOtpProvider({
      apiKey: settings.resendApiKey,
      endpoint: settings.resendApiUrl,
      from,
      timeoutMs: settings.timeoutMs,
    });
  }

  if (settings.kind === 'smtp') {
    if (!settings.smtpHost || !settings.from) {
      throw new Error(
        'EMAIL_OTP_PROVIDER=smtp requires SMTP_HOST and OTP_EMAIL_FROM',
      );
    }
    logger.log('Email OTP provider: SMTP');
    return new SmtpEmailOtpProvider({
      host: settings.smtpHost,
      port: settings.smtpPort ?? 587,
      secure: settings.smtpSecure ?? false,
      user: settings.smtpUser,
      pass: settings.smtpPass,
      from,
      timeoutMs: settings.timeoutMs,
    });
  }

  logger.log('Email OTP provider: none — passwordless email sign-in is unavailable');
  return new NullEmailOtpProvider();
}
