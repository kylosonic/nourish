/**
 * S3 accounts e2e: AUTH-01…AUTH-03 against the real modules, a real database
 * and a capturing SMS provider (no gateway is contacted).
 */
import { setTestEnv, truncateAll } from './db-utils';

setTestEnv();

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { EnvVars } from '../src/config/env';
import { PrismaService } from '../src/prisma/prisma.service';
import { SMS_PROVIDER } from '../src/auth/auth.tokens';
import { SmsMessage, SmsProvider, SmsUnavailableError } from '../src/auth/sms-provider';

/** Captures the message instead of sending it, so the test can read the code. */
class CapturingSmsProvider implements SmsProvider {
  readonly name = 'capturing';
  readonly sent: SmsMessage[] = [];
  unavailable = false;

  send(message: SmsMessage): Promise<void> {
    if (this.unavailable) return Promise.reject(new SmsUnavailableError());
    this.sent.push(message);
    return Promise.resolve();
  }

  /** The 6-digit code from the most recent message. */
  lastCode(): string {
    const last = this.sent[this.sent.length - 1];
    if (!last) throw new Error('no SMS was sent');
    const match = /(\d{6})/.exec(last.body);
    if (!match) throw new Error(`no code in message: ${last.body}`);
    return match[1];
  }
}

const PHONE = '0911 23 45 67';
const PHONE_E164 = '+251911234567';

describe('S3 accounts (AUTH-01…03, ADR-0008)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let sms: CapturingSmsProvider;

  beforeAll(async () => {
    sms = new CapturingSmsProvider();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SMS_PROVIDER)
      .useValue(sms)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, app.get(ConfigService<EnvVars, true>));
    await app.init();
    prisma = app.get(PrismaService);
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    sms.sent.length = 0;
    sms.unavailable = false;
  });

  /** Request a code and verify it, returning the session. */
  async function signIn(phone = PHONE): Promise<{
    tokens: { accessToken: string; refreshToken: string; expiresIn: number; tokenType: string };
    account: { id: string; phoneE164: string; plan: string; aiImprovementConsent: boolean };
    created: boolean;
  }> {
    await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone }).expect(202);
    const code = sms.lastCode();
    const res = await request(app.getHttpServer())
      .post('/v1/auth/otp/verify')
      .send({ phone, code })
      .expect(200);
    return res.body as {
      tokens: { accessToken: string; refreshToken: string; expiresIn: number; tokenType: string };
      account: { id: string; phoneE164: string; plan: string; aiImprovementConsent: boolean };
      created: boolean;
    };
  }

  describe('AUTH-01 normalization', () => {
    it('accepts the contract example and answers with the +251 form', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp')
        .send({ phone: PHONE })
        .expect(202);
      expect(res.body.phoneE164).toBe(PHONE_E164);
      expect(res.body.expiresIn).toBeGreaterThan(0);
      expect(res.body.resendAfter).toBeGreaterThan(0);
      // The code is never in the response: the body carries exactly these keys.
      expect(Object.keys(res.body).sort()).toEqual(['expiresIn', 'phoneE164', 'resendAfter']);
    });

    it('treats two spellings of one number as one account', async () => {
      const first = await signIn('0911234567');
      // Same person, different spelling. Backdate the outstanding challenge so
      // the resend gap does not apply (it is asserted separately).
      await prisma.otpChallenge.updateMany({
        where: { phoneE164: PHONE_E164 },
        data: { createdAt: new Date(Date.now() - 10 * 60 * 1000) },
      });
      await request(app.getHttpServer())
        .post('/v1/auth/otp')
        .send({ phone: '+251 911 234 567' })
        .expect(202);
      const second = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ phone: '+251911234567', code: sms.lastCode() })
        .expect(200);
      expect(second.body.account.id).toBe(first.account.id);
      expect(second.body.created).toBe(false);
      expect(await prisma.user.count()).toBe(1);
    });

    it('rejects a number that is not an Ethiopian mobile', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp')
        .send({ phone: '+254712345678' })
        .expect(400);
      expect(res.body.error.code).toBe('PHONE_INVALID');
      expect(sms.sent).toHaveLength(0);
    });
  });

  describe('AUTH-02 sign-in with OTP', () => {
    it('a correct code starts a session and creates the account', async () => {
      const session = await signIn();
      expect(session.created).toBe(true);
      expect(session.account.phoneE164).toBe(PHONE_E164);
      expect(session.tokens.tokenType).toBe('Bearer');
      expect(session.tokens.accessToken.split('.')).toHaveLength(3);
      expect(session.tokens.expiresIn).toBeGreaterThan(0);
      expect(await prisma.user.count()).toBe(1);
      expect(await prisma.refreshToken.count()).toBe(1);
    });

    it('a code is single-use', async () => {
      await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone: PHONE }).expect(202);
      const code = sms.lastCode();
      await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ phone: PHONE, code })
        .expect(200);
      const replay = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ phone: PHONE, code })
        .expect(400);
      expect(replay.body.error.code).toBe('OTP_INVALID');
    });

    it('a wrong code counts attempts and says how many are left', async () => {
      await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone: PHONE }).expect(202);
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ phone: PHONE, code: '000000' })
        .expect(400);
      expect(res.body.error.code).toBe('OTP_INVALID');
      expect(res.body.error.message).toMatch(/attempt/);
      // No session was created.
      expect(await prisma.refreshToken.count()).toBe(0);
    });

    it('stops accepting attempts once the limit is reached', async () => {
      await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone: PHONE }).expect(202);
      const challenge = await prisma.otpChallenge.findFirstOrThrow({ where: { phoneE164: PHONE_E164 } });
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: challenge.maxAttempts },
      });
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ phone: PHONE, code: sms.lastCode() })
        .expect(429);
      expect(res.body.error.code).toBe('OTP_TOO_MANY_ATTEMPTS');
    });

    it('an expired code is refused with a resend instruction', async () => {
      await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone: PHONE }).expect(202);
      const code = sms.lastCode();
      await prisma.otpChallenge.updateMany({
        where: { phoneE164: PHONE_E164 },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ phone: PHONE, code })
        .expect(400);
      expect(res.body.error.code).toBe('OTP_EXPIRED');
    });

    it('refuses a second request inside the resend cooldown', async () => {
      await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone: PHONE }).expect(202);
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp')
        .send({ phone: PHONE })
        .expect(429);
      expect(res.body.error.code).toBe('OTP_RESEND_TOO_SOON');
      expect(sms.sent).toHaveLength(1);
    });

    it('a resend after the cooldown invalidates the previous code', async () => {
      await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone: PHONE }).expect(202);
      const firstCode = sms.lastCode();

      // Backdate the challenge instead of waiting a minute.
      await prisma.otpChallenge.updateMany({
        where: { phoneE164: PHONE_E164 },
        data: { createdAt: new Date(Date.now() - 10 * 60 * 1000) },
      });

      await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone: PHONE }).expect(202);
      const secondCode = sms.lastCode();
      expect(secondCode).not.toBe(firstCode);

      // The superseded code no longer works…
      const stale = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ phone: PHONE, code: firstCode })
        .expect(400);
      expect(stale.body.error.code).toBe('OTP_INVALID');

      // …and the new one does.
      await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ phone: PHONE, code: secondCode })
        .expect(200);
    });

    it('answers 503 honestly when no SMS gateway is configured', async () => {
      sms.unavailable = true;
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp')
        .send({ phone: PHONE })
        .expect(503);
      expect(res.body.error.code).toBe('SMS_UNAVAILABLE');
      // Nothing is left outstanding for a code that was never delivered.
      const outstanding = await prisma.otpChallenge.count({
        where: { phoneE164: PHONE_E164, consumedAt: null, invalidatedAt: null },
      });
      expect(outstanding).toBe(0);
    });
  });

  describe('AUTH-03 session lifecycle', () => {
    it('GET /v1/me requires a bearer token', async () => {
      const res = await request(app.getHttpServer()).get('/v1/me').expect(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
      await request(app.getHttpServer()).get('/v1/me').set('Authorization', 'Bearer nope').expect(401);
    });

    it('GET /v1/me returns the server-owned plan and the consent default', async () => {
      const session = await signIn();
      const res = await request(app.getHttpServer())
        .get('/v1/me')
        .set('Authorization', `Bearer ${session.tokens.accessToken}`)
        .expect(200);
      expect(res.body.id).toBe(session.account.id);
      expect(res.body.phoneE164).toBe(PHONE_E164);
      expect(res.body.plan).toBe('FREE');
      // Off by default: absence of a grant is not consent (SAFE-06).
      expect(res.body.aiImprovementConsent).toBe(false);
      expect(res.body.activeSessions).toBe(1);
    });

    it('rotates the refresh credential and retires the old one', async () => {
      const session = await signIn();
      const refreshed = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: session.tokens.refreshToken })
        .expect(200);

      expect(refreshed.body.tokens.refreshToken).not.toBe(session.tokens.refreshToken);
      // The rotated-away token is now a replay…
      const reuse = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: session.tokens.refreshToken })
        .expect(401);
      expect(reuse.body.error.code).toBe('TOKEN_REUSED');

      // …and reuse revokes the whole chain, including the successor.
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: refreshed.body.tokens.refreshToken })
        .expect(401);
    });

    it('sign-out ends this device and leaves other devices alone', async () => {
      const first = await signIn();
      // A second device: another code, another session.
      await prisma.otpChallenge.updateMany({
        where: { phoneE164: PHONE_E164 },
        data: { createdAt: new Date(Date.now() - 10 * 60 * 1000) },
      });
      const second = await signIn();

      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({ refreshToken: first.tokens.refreshToken })
        .expect(204);

      // The signed-out device cannot refresh…
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: first.tokens.refreshToken })
        .expect(401);
      // …while the other device is unaffected (AUTH-03 edge case).
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: second.tokens.refreshToken })
        .expect(200);
    });

    it('sign-out is idempotent and an unknown token is accepted quietly', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({ refreshToken: 'a-token-that-never-existed-but-is-long-enough' })
        .expect(204);
    });

    it('an expired refresh credential is refused with a clear code', async () => {
      const session = await signIn();
      await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: session.tokens.refreshToken })
        .expect(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('never stores a code or a token in recoverable form', async () => {
      const session = await signIn();
      const challenges = await prisma.otpChallenge.findMany();
      const tokens = await prisma.refreshToken.findMany();
      const dump = JSON.stringify({ challenges, tokens });
      expect(dump).not.toContain(sms.lastCode());
      expect(dump).not.toContain(session.tokens.refreshToken);
      expect(dump).not.toContain(session.tokens.accessToken);
    });
  });
});
