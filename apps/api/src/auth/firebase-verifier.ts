import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { EnvVars } from '../config/env';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';

interface FirebasePayload {
  sub?: string;
  phone_number?: string;
  firebase?: { sign_in_provider?: string };
}

/**
 * Verifies Firebase phone-auth ID tokens with Google's public certificates.
 * This avoids a paid SMS gateway when the mobile client uses Firebase's free
 * phone-auth tier.
 */
@Injectable()
export class FirebasePhoneVerifier {
  private readonly client = new OAuth2Client();

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<EnvVars, true>,
  ) {}

  async verify(idToken: string): Promise<{ subject: string; phone: string }> {
    const projectId = this.config.get('FIREBASE_PROJECT_ID', { infer: true });
    if (!projectId) {
      throw new NourishHttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.FIREBASE_UNAVAILABLE,
        'Firebase phone verification is not configured.',
      );
    }
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: projectId,
      });
      const payload = ticket.getPayload() as FirebasePayload | undefined;
      if (
        !payload?.sub ||
        !payload.phone_number ||
        payload.firebase?.sign_in_provider !== 'phone'
      ) {
        throw new Error('not a phone identity');
      }
      return { subject: payload.sub, phone: payload.phone_number };
    } catch {
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.FIREBASE_TOKEN_INVALID,
        'Phone sign-in could not be verified.',
      );
    }
  }
}
