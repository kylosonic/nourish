export interface EmailOtpMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailOtpProvider {
  readonly name: string;
  send(message: EmailOtpMessage): Promise<void>;
}

export class EmailOtpUnavailableError extends Error {
  constructor(message = 'No email OTP provider is configured') {
    super(message);
    this.name = 'EmailOtpUnavailableError';
  }
}

export class EmailOtpDeliveryError extends Error {
  constructor(
    message: string,
    readonly kind: 'transport' | 'status' | 'timeout',
  ) {
    super(message);
    this.name = 'EmailOtpDeliveryError';
  }
}

export class NullEmailOtpProvider implements EmailOtpProvider {
  readonly name = 'none';

  send(): Promise<void> {
    return Promise.reject(new EmailOtpUnavailableError());
  }
}
