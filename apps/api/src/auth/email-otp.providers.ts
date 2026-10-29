import { Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import {
  EmailOtpDeliveryError,
  EmailOtpMessage,
  EmailOtpProvider,
} from './email-otp-provider';

export class ConsoleEmailOtpProvider implements EmailOtpProvider {
  readonly name = 'console';
  private readonly logger = new Logger('email-otp');

  send(message: EmailOtpMessage): Promise<void> {
    this.logger.warn(`[dev] Email OTP to ${message.to}: ${message.text}`);
    return Promise.resolve();
  }
}

export class ResendEmailOtpProvider implements EmailOtpProvider {
  readonly name = 'resend';
  private readonly logger = new Logger('email-otp');

  constructor(
    private readonly config: {
      apiKey: string;
      endpoint: string;
      from: string;
      timeoutMs: number;
    },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(message: EmailOtpMessage): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImpl(this.config.endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.config.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: this.config.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        this.logger.warn(`Resend returned HTTP ${response.status}`);
        throw new EmailOtpDeliveryError(
          `Email gateway returned HTTP ${response.status}`,
          'status',
        );
      }
    } catch (error) {
      if (error instanceof EmailOtpDeliveryError) throw error;
      const aborted = (error as { name?: string }).name === 'AbortError';
      this.logger.warn(aborted ? 'email timeout' : 'email transport failure');
      throw new EmailOtpDeliveryError(
        aborted ? 'Email gateway timed out' : 'Email gateway is unreachable',
        aborted ? 'timeout' : 'transport',
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

export class SmtpEmailOtpProvider implements EmailOtpProvider {
  readonly name = 'smtp';
  private readonly logger = new Logger('email-otp');
  private readonly transport: Transporter;

  constructor(
    private readonly config: {
      host: string;
      port: number;
      secure: boolean;
      user?: string;
      pass?: string;
      from: string;
      timeoutMs: number;
    },
  ) {
    this.transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth:
        config.user && config.pass
          ? { user: config.user, pass: config.pass }
          : undefined,
      connectionTimeout: config.timeoutMs,
      greetingTimeout: config.timeoutMs,
      socketTimeout: config.timeoutMs,
    });
  }

  async send(message: EmailOtpMessage): Promise<void> {
    try {
      await this.transport.sendMail({
        from: this.config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    } catch {
      this.logger.warn('SMTP delivery failed');
      throw new EmailOtpDeliveryError('Email could not be delivered', 'transport');
    }
  }
}
