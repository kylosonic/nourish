import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { EnvVars } from '../config/env';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';

export interface VerifiedGoogleIdentity {
  subject: string;
  email: string;
  displayName: string | null;
}

@Injectable()
export class GoogleTokenVerifier {
  private readonly client = new OAuth2Client();

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<EnvVars, true>,
  ) {}

  async verify(idToken: string): Promise<VerifiedGoogleIdentity> {
    const audience = [
      this.config.get('GOOGLE_CLIENT_IDS', { infer: true }),
      this.config.get('GOOGLE_CLIENT_ID_IOS', { infer: true }),
      this.config.get('GOOGLE_CLIENT_ID_ANDROID', { infer: true }),
      this.config.get('GOOGLE_CLIENT_ID_WEB', { infer: true }),
    ]
      .flatMap((value) => (value ?? '').split(','))
      .map((value) => value.trim())
      .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);
    if (audience.length === 0) {
      throw new NourishHttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.GOOGLE_UNAVAILABLE,
        'Google sign-in is not configured.',
      );
    }

    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();
      if (
        !payload?.sub ||
        !payload.email ||
        payload.email_verified !== true
      ) {
        throw new Error('Google identity is incomplete');
      }
      return {
        subject: payload.sub,
        email: payload.email.trim().toLowerCase(),
        displayName: payload.name?.trim() || null,
      };
    } catch {
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.GOOGLE_TOKEN_INVALID,
        'Google sign-in could not be verified.',
      );
    }
  }
}
