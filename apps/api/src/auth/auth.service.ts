import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConsentKind, Plan, User } from '@prisma/client';
import { EnvVars } from '../config/env';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';
import { NourishLogger } from '../common/logger/nourish-logger';
import { AuthRepository } from './auth.repository';
import {
  createOtpSecret,
  generateOtpCode,
  hashRefreshToken,
  isExpired,
  isWellFormedOtp,
  issueRefreshToken,
  otpMatches,
  IssuedRefreshToken,
} from './crypto';
import { normalizeEthiopianPhone, phoneRejectionMessage } from './phone';
import { EMAIL_OTP_PROVIDER, SMS_PROVIDER } from './auth.tokens';
import {
  SmsDeliveryError,
  SmsProvider,
  SmsUnavailableError,
} from './sms-provider';
import {
  EmailOtpDeliveryError,
  EmailOtpProvider,
  EmailOtpUnavailableError,
} from './email-otp-provider';
import { GoogleTokenVerifier } from './google-verifier';
import { FirebasePhoneVerifier } from './firebase-verifier';
import { hashPassword, verifyPassword } from './password';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AccountView {
  id: string;
  phoneE164: string | null;
  email: string | null;
  displayName: string | null;
  authProviders: ('phone' | 'email' | 'google')[];
  onboarded: boolean;
  createdAt: string;
  plan: Plan;
  planValidUntil: string | null;
  aiImprovementConsent: boolean;
  analyticsConsent: boolean;
  activeSessions: number;
}

export interface ConsentSettingView {
  granted: boolean;
  updatedAt: string | null;
}

export interface AccountConsentView {
  version: string;
  healthDataProcessing: ConsentSettingView;
  aiImprovement: ConsentSettingView;
  analytics: ConsentSettingView;
}

export const CURRENT_CONSENT_VERSION = '2026-10-29';

export interface OtpRequestResult {
  phoneE164: string;
  /** Seconds until the code stops working. The code itself is never returned. */
  expiresIn: number;
  /** Seconds before another code may be requested. */
  resendAfter: number;
}

/**
 * Accounts, one-time codes and sessions (AUTH-01…03, ADR-0008).
 *
 * The service never returns or logs a code, and never stores one in a
 * recoverable form. Every failure path is explicit — there is no branch in
 * which a failed verification yields a session.
 */
@Injectable()
export class AuthService {
  private readonly logger = new NourishLogger('auth');
  private readonly dummyPasswordHash = hashPassword('invalid-account-password');

  constructor(
    // Explicit tokens throughout: the esbuild-based CLI runner (tsx) does not
    // emit decorator metadata, so a bare type reference would inject undefined.
    @Inject(AuthRepository) private readonly repo: AuthRepository,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService<EnvVars, true>,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(EMAIL_OTP_PROVIDER)
    private readonly emailOtp: EmailOtpProvider,
    @Inject(GoogleTokenVerifier) private readonly google: GoogleTokenVerifier,
    @Inject(FirebasePhoneVerifier)
    private readonly firebasePhone: FirebasePhoneVerifier,
  ) {}

  private get accessTtl(): number {
    return this.config.get('ACCESS_TOKEN_TTL_SECONDS', { infer: true });
  }

  private get refreshTtl(): number {
    return this.config.get('REFRESH_TOKEN_TTL_SECONDS', { infer: true });
  }

  private get otpTtl(): number {
    return this.config.get('OTP_TTL_SECONDS', { infer: true });
  }

  private get maxAttempts(): number {
    return this.config.get('OTP_MAX_ATTEMPTS', { infer: true });
  }

  private get resendCooldown(): number {
    return this.config.get('OTP_RESEND_COOLDOWN_SECONDS', { infer: true });
  }

  // ── AUTH-01 / AUTH-02: request a code ─────────────────────────────────────

  async requestOtp(rawPhone: string): Promise<OtpRequestResult> {
    const phone = normalizeEthiopianPhone(rawPhone);
    if (!phone.ok || !phone.e164) {
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.PHONE_INVALID,
        phoneRejectionMessage(phone.reason ?? 'not-a-number'),
      );
    }

    const now = new Date();

    // Resend gap: a second request inside the cooldown is refused rather than
    // silently burning SMS credit (AUTH-02 "undelivered SMS → resend remains
    // available" is honoured once the gap has passed).
    const latest = await this.repo.findLatestChallenge(phone.e164);
    if (latest) {
      const elapsed = (now.getTime() - latest.createdAt.getTime()) / 1000;
      if (elapsed < this.resendCooldown) {
        throw new NourishHttpException(
          HttpStatus.TOO_MANY_REQUESTS,
          ErrorCode.OTP_RESEND_TOO_SOON,
          `Please wait ${Math.ceil(this.resendCooldown - elapsed)}s before requesting another code`,
        );
      }
    }

    // A new code supersedes any outstanding one.
    await this.repo.invalidateOutstanding(phone.e164, now);

    const code = generateOtpCode();
    const secret = createOtpSecret(code);
    const challenge = await this.repo.createChallenge({
      phoneE164: phone.e164,
      codeHash: secret.hash,
      codeSalt: secret.salt,
      maxAttempts: this.maxAttempts,
      expiresAt: new Date(now.getTime() + this.otpTtl * 1000),
    });

    try {
      await this.sms.send({
        toE164: phone.e164,
        body: `Your Nourish sign-in code is ${code}. It expires in ${Math.round(
          this.otpTtl / 60,
        )} minutes. Never share it.`,
      });
    } catch (error) {
      // No gateway: the code must not stay outstanding, and the caller is told
      // the truth rather than being left waiting for an SMS that never comes.
      await this.repo.invalidateOutstanding(phone.e164, new Date());
      if (error instanceof SmsUnavailableError) {
        throw new NourishHttpException(
          HttpStatus.SERVICE_UNAVAILABLE,
          ErrorCode.SMS_UNAVAILABLE,
          'Sign-in codes cannot be sent right now: no SMS gateway is configured',
        );
      }
      if (error instanceof SmsDeliveryError) {
        throw new NourishHttpException(
          HttpStatus.BAD_GATEWAY,
          ErrorCode.SMS_UNAVAILABLE,
          'The sign-in code could not be sent. Please try again.',
        );
      }
      throw error;
    }

    this.logger.log('otp requested', { challengeId: challenge.id, created: true });
    return {
      phoneE164: phone.e164,
      expiresIn: this.otpTtl,
      resendAfter: this.resendCooldown,
    };
  }

  // ── AUTH-02: verify a code and start a session ────────────────────────────

  async verifyOtp(
    rawPhone: string,
    code: string,
    userAgent?: string,
  ): Promise<{ tokens: SessionTokens; account: AccountView; created: boolean }> {
    const phone = normalizeEthiopianPhone(rawPhone);
    if (!phone.ok || !phone.e164) {
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.PHONE_INVALID,
        phoneRejectionMessage(phone.reason ?? 'not-a-number'),
      );
    }

    const challenge = await this.repo.findActiveChallenge(phone.e164);
    if (!challenge) {
      // Deliberately the same message as a wrong code: whether a code exists
      // for a number is not something an unauthenticated caller should learn.
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        'That code is not valid. Request a new one.',
      );
    }

    const now = new Date();
    if (isExpired(challenge.expiresAt, now)) {
      await this.repo.invalidateOutstanding(phone.e164, now);
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_EXPIRED,
        'That code has expired. Request a new one.',
      );
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      throw new NourishHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.OTP_TOO_MANY_ATTEMPTS,
        'Too many attempts. Request a new code.',
      );
    }

    if (!isWellFormedOtp(code) || !otpMatches(code, { hash: challenge.codeHash, salt: challenge.codeSalt })) {
      const attempts = await this.repo.registerFailedAttempt(challenge.id);
      const remaining = Math.max(0, challenge.maxAttempts - attempts);
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        remaining > 0
          ? `That code is not valid. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
          : 'That code is not valid. Request a new one.',
      );
    }

    // Consume first: a code is single-use even if issuing the session fails.
    await this.repo.consumeChallenge(challenge.id, now);
    const { user, created } = await this.repo.upsertUserForPhone(phone.e164);
    const tokens = await this.issueSession(user, userAgent);
    this.logger.log('session started', { userId: user.id, created });

    return { tokens, account: await this.accountView(user), created };
  }

  // ── Zero-cost passwordless email OTP fallback ─────────────────────────────

  async requestEmailOtp(rawEmail: string): Promise<{
    email: string;
    expiresIn: number;
    resendAfter: number;
  }> {
    const email = normalizeEmail(rawEmail);
    const now = new Date();
    const latest = await this.repo.findLatestEmailChallenge(email);
    if (latest) {
      const elapsed = (now.getTime() - latest.createdAt.getTime()) / 1000;
      if (elapsed < this.resendCooldown) {
        throw new NourishHttpException(
          HttpStatus.TOO_MANY_REQUESTS,
          ErrorCode.OTP_RESEND_TOO_SOON,
          `Please wait ${Math.ceil(this.resendCooldown - elapsed)}s before requesting another code`,
        );
      }
    }
    await this.repo.invalidateOutstandingEmail(email, now);
    const code = generateOtpCode();
    const secret = createOtpSecret(code);
    await this.repo.createEmailChallenge({
      email,
      codeHash: secret.hash,
      codeSalt: secret.salt,
      maxAttempts: this.maxAttempts,
      expiresAt: new Date(now.getTime() + this.otpTtl * 1000),
    });
    try {
      await this.emailOtp.send({
        to: email,
        subject: 'Your Nourish sign-in code',
        text: `Your Nourish sign-in code is ${code}. It expires in ${Math.round(
          this.otpTtl / 60,
        )} minutes. Never share it.`,
      });
    } catch (error) {
      await this.repo.invalidateOutstandingEmail(email, new Date());
      if (error instanceof EmailOtpUnavailableError) {
        throw new NourishHttpException(
          HttpStatus.SERVICE_UNAVAILABLE,
          ErrorCode.EMAIL_OTP_UNAVAILABLE,
          'Email sign-in is not configured. Use another sign-in method.',
        );
      }
      if (error instanceof EmailOtpDeliveryError) {
        throw new NourishHttpException(
          HttpStatus.BAD_GATEWAY,
          ErrorCode.EMAIL_OTP_UNAVAILABLE,
          'The email sign-in code could not be sent. Please try again.',
        );
      }
      throw error;
    }
    this.logger.log('email otp requested', { created: true });
    return {
      email,
      expiresIn: this.otpTtl,
      resendAfter: this.resendCooldown,
    };
  }

  async verifyEmailOtp(
    rawEmail: string,
    code: string,
    userAgent?: string,
  ): Promise<{ tokens: SessionTokens; account: AccountView; created: boolean }> {
    const email = normalizeEmail(rawEmail);
    const challenge = await this.repo.findActiveEmailChallenge(email);
    if (!challenge) {
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        'That code is not valid. Request a new one.',
      );
    }
    const now = new Date();
    if (isExpired(challenge.expiresAt, now)) {
      await this.repo.invalidateOutstandingEmail(email, now);
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_EXPIRED,
        'That code has expired. Request a new one.',
      );
    }
    if (challenge.attempts >= challenge.maxAttempts) {
      throw new NourishHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.OTP_TOO_MANY_ATTEMPTS,
        'Too many attempts. Request a new code.',
      );
    }
    if (
      !isWellFormedOtp(code) ||
      !otpMatches(code, {
        hash: challenge.codeHash,
        salt: challenge.codeSalt,
      })
    ) {
      const attempts = await this.repo.registerFailedEmailAttempt(challenge.id);
      const remaining = Math.max(0, challenge.maxAttempts - attempts);
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        remaining > 0
          ? `That code is not valid. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
          : 'That code is not valid. Request a new one.',
      );
    }
    await this.repo.consumeEmailChallenge(challenge.id, now);
    const { user, created } = await this.repo.upsertUserForEmail(email);
    const tokens = await this.issueSession(user, userAgent);
    this.logger.log('email otp session started', { userId: user.id, created });
    return { tokens, account: await this.accountView(user), created };
  }

  async registerEmail(
    rawEmail: string,
    password: string,
    displayName?: string,
    userAgent?: string,
  ): Promise<{ tokens: SessionTokens; account: AccountView; created: boolean }> {
    const email = normalizeEmail(rawEmail);
    if (await this.repo.findUserByEmail(email)) {
      throw new NourishHttpException(
        HttpStatus.CONFLICT,
        ErrorCode.EMAIL_IN_USE,
        'An account with that email already exists.',
      );
    }
    const user = await this.repo.createEmailUser({
      email,
      passwordHash: await hashPassword(password),
      displayName: displayName?.trim() || null,
    });
    const tokens = await this.issueSession(user, userAgent);
    this.logger.log('email account created', { userId: user.id });
    return {
      tokens,
      account: await this.accountView(user),
      created: true,
    };
  }

  async loginEmail(
    rawEmail: string,
    password: string,
    userAgent?: string,
  ): Promise<{ tokens: SessionTokens; account: AccountView; created: boolean }> {
    const email = normalizeEmail(rawEmail);
    const user = await this.repo.findUserByEmail(email);
    const encoded = user?.passwordHash ?? (await this.dummyPasswordHash);
    const passwordMatches = await verifyPassword(password, encoded);
    const valid = Boolean(user?.status === 'Active' && passwordMatches);
    if (!user || !valid) {
      // Do not reveal whether the email exists or has a password provider.
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.EMAIL_CREDENTIALS_INVALID,
        'Email or password is incorrect.',
      );
    }
    const activeUser = await this.repo.touchUser(user.id);
    const tokens = await this.issueSession(activeUser, userAgent);
    this.logger.log('email session started', { userId: user.id });
    return {
      tokens,
      account: await this.accountView(activeUser),
      created: false,
    };
  }

  async signInWithGoogle(
    idToken: string,
    userAgent?: string,
  ): Promise<{ tokens: SessionTokens; account: AccountView; created: boolean }> {
    const identity = await this.google.verify(idToken);
    const { user, created } = await this.repo.upsertGoogleUser(identity);
    const tokens = await this.issueSession(user, userAgent);
    this.logger.log('google session started', { userId: user.id, created });
    return {
      tokens,
      account: await this.accountView(user),
      created,
    };
  }

  async signInWithFirebasePhone(
    idToken: string,
    userAgent?: string,
  ): Promise<{ tokens: SessionTokens; account: AccountView; created: boolean }> {
    const identity = await this.firebasePhone.verify(idToken);
    const phone = normalizeEthiopianPhone(identity.phone);
    if (!phone.ok || !phone.e164) {
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.PHONE_INVALID,
        phoneRejectionMessage(phone.reason ?? 'not-a-number'),
      );
    }
    const { user, created } = await this.repo.upsertUserForPhone(phone.e164);
    const tokens = await this.issueSession(user, userAgent);
    this.logger.log('firebase phone session started', { userId: user.id, created });
    return { tokens, account: await this.accountView(user), created };
  }

  // ── AUTH-03: rotate, revoke, read ─────────────────────────────────────────

  async refresh(presentedToken: string, userAgent?: string): Promise<SessionTokens> {
    const existing = await this.repo.findRefreshTokenByHash(hashRefreshToken(presentedToken));
    const now = new Date();

    if (!existing) {
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHENTICATED,
        'Your session has ended. Please sign in again.',
      );
    }

    if (existing.revokedAt != null) {
      // The token was already rotated away, so this presentation means the
      // credential leaked or was replayed. Revoke the whole device chain.
      const revoked = await this.repo.revokeFamily(existing.familyId, now);
      this.logger.warn('refresh token reuse detected', {
        familyId: existing.familyId,
        revoked,
      });
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.TOKEN_REUSED,
        'Your session was ended for security. Please sign in again.',
      );
    }

    if (isExpired(existing.expiresAt, now)) {
      await this.repo.revokeFamily(existing.familyId, now);
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.TOKEN_EXPIRED,
        'Your session has expired. Please sign in again.',
      );
    }

    const user = await this.repo.findUserById(existing.userId);
    if (!user || user.status !== 'Active') {
      await this.repo.revokeFamily(existing.familyId, now);
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.ACCOUNT_DISABLED,
        'This account is no longer active.',
      );
    }

    const successor: IssuedRefreshToken = issueRefreshToken(existing.familyId);
    const created = await this.repo.createRefreshToken({
      userId: user.id,
      familyId: existing.familyId,
      tokenHash: successor.tokenHash,
      expiresAt: new Date(now.getTime() + this.refreshTtl * 1000),
      userAgent,
    });
    await this.repo.rotateRefreshToken(existing.id, created.id, now);

    return {
      accessToken: await this.signAccessToken(user.id, created.id),
      refreshToken: successor.token,
      expiresIn: this.accessTtl,
      tokenType: 'Bearer',
    };
  }

  /** Sign-out revokes this device's chain; other devices keep working. */
  async logout(presentedToken: string): Promise<void> {
    const existing = await this.repo.findRefreshTokenByHash(hashRefreshToken(presentedToken));
    if (!existing) return; // already gone: sign-out is idempotent
    const revoked = await this.repo.revokeFamily(existing.familyId, new Date());
    this.logger.log('session ended', { userId: existing.userId, revoked });
  }

  async accountView(user: User): Promise<AccountView> {
    const entitlement = await this.repo.ensureEntitlement(user.id);
    const consent = await this.repo.consentFor(user.id, ConsentKind.aiImprovement);
    const analytics = await this.repo.consentFor(user.id, ConsentKind.analytics);
    return {
      id: user.id,
      phoneE164: user.phoneE164,
      email: user.email,
      displayName: user.displayName,
      authProviders: [
        ...(user.phoneE164 ? (['phone'] as const) : []),
        ...(user.email ? (['email'] as const) : []),
        ...(user.googleSubject ? (['google'] as const) : []),
      ],
      onboarded: user.onboardedAt != null,
      createdAt: user.createdAt.toISOString(),
      plan: entitlement.plan,
      planValidUntil: entitlement.validUntil?.toISOString() ?? null,
      // Default off: absence of a grant is not consent (SAFE-06).
      aiImprovementConsent: consent.granted,
      analyticsConsent: analytics.granted,
      activeSessions: await this.repo.countActiveSessions(user.id),
    };
  }

  async consentView(userId: string): Promise<AccountConsentView> {
    const consents = await this.repo.consentsFor(userId);
    const setting = (kind: ConsentKind): ConsentSettingView => {
      const value = consents.get(kind);
      return {
        granted: value?.granted ?? false,
        updatedAt: value?.updatedAt.toISOString() ?? null,
      };
    };
    return {
      version: CURRENT_CONSENT_VERSION,
      healthDataProcessing: setting(ConsentKind.healthDataProcessing),
      aiImprovement: setting(ConsentKind.aiImprovement),
      analytics: setting(ConsentKind.analytics),
    };
  }

  async updateConsents(
    userId: string,
    patch: {
      healthDataProcessing?: boolean;
      aiImprovement?: boolean;
      analytics?: boolean;
    },
  ): Promise<AccountConsentView> {
    const updates = [
      patch.healthDataProcessing == null
        ? null
        : { kind: ConsentKind.healthDataProcessing, granted: patch.healthDataProcessing },
      patch.aiImprovement == null
        ? null
        : { kind: ConsentKind.aiImprovement, granted: patch.aiImprovement },
      patch.analytics == null
        ? null
        : { kind: ConsentKind.analytics, granted: patch.analytics },
    ].filter((value): value is { kind: ConsentKind; granted: boolean } => value != null);
    if (updates.length === 0) {
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.CONSENT_UPDATE_EMPTY,
        'Provide at least one consent setting.',
      );
    }
    await this.repo.updateConsents(userId, updates, CURRENT_CONSENT_VERSION);
    return this.consentView(userId);
  }

  async deleteAccount(userId: string): Promise<void> {
    const deleted = await this.repo.deleteAccount(userId);
    if (!deleted) {
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHENTICATED,
        'Sign in to continue.',
      );
    }
    this.logger.log('account permanently deleted', { deleted: true });
  }

  async requestWebDeletion(input: {
    email?: string;
    phone?: string;
    note?: string;
  }): Promise<{ requestId: string; receivedAt: string }> {
    const email = input.email?.trim().toLowerCase() || undefined;
    const normalizedPhone = input.phone
      ? normalizeEthiopianPhone(input.phone)
      : null;
    const phone =
      normalizedPhone?.ok && normalizedPhone.e164
        ? normalizedPhone.e164
        : undefined;
    if (!email && !phone) {
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        'Provide the email address or phone number used for the account.',
      );
    }
    const created = await this.repo.createDeletionRequest({
      email,
      phoneE164: phone,
      note: input.note?.trim() || undefined,
    });
    this.logger.log('web deletion request received', {
      requestId: created.id,
    });
    return {
      requestId: created.id,
      receivedAt: created.createdAt.toISOString(),
    };
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; sessionId: string }> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; sid: string }>(token);
      const session = await this.repo.findSessionById(payload.sid);
      const user = await this.repo.findUserById(payload.sub);
      if (
        !session ||
        session.userId !== payload.sub ||
        session.revokedAt != null ||
        isExpired(session.expiresAt, new Date()) ||
        !user ||
        user.status !== 'Active'
      ) {
        throw new Error('inactive session');
      }
      return { userId: payload.sub, sessionId: payload.sid };
    } catch (error) {
      const expired = (error as { name?: string }).name === 'TokenExpiredError';
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        expired ? ErrorCode.TOKEN_EXPIRED : ErrorCode.UNAUTHENTICATED,
        expired ? 'Your session has expired.' : 'Sign in to continue.',
      );
    }
  }

  /** Housekeeping: expired codes are removed, since their hashes are useless. */
  async purgeExpiredCodes(): Promise<number> {
    return this.repo.purgeExpiredChallenges(new Date());
  }

  private async issueSession(user: User, userAgent?: string): Promise<SessionTokens> {
    const issued = issueRefreshToken();
    const created = await this.repo.createRefreshToken({
      userId: user.id,
      familyId: issued.familyId,
      tokenHash: issued.tokenHash,
      expiresAt: new Date(Date.now() + this.refreshTtl * 1000),
      userAgent,
    });
    return {
      accessToken: await this.signAccessToken(user.id, created.id),
      refreshToken: issued.token,
      expiresIn: this.accessTtl,
      tokenType: 'Bearer',
    };
  }

  private signAccessToken(userId: string, sessionId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, sid: sessionId },
      { expiresIn: this.accessTtl },
    );
  }
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
