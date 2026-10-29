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
import { EMAIL_OTP_PROVIDER } from '../src/auth/auth.tokens';
import {
  EmailOtpMessage,
  EmailOtpProvider,
} from '../src/auth/email-otp-provider';

class CapturingEmailProvider implements EmailOtpProvider {
  readonly name = 'capturing';
  readonly sent: EmailOtpMessage[] = [];

  send(message: EmailOtpMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }

  lastCode(): string {
    const message = this.sent.at(-1);
    const match = message ? /(\d{6})/.exec(message.text) : null;
    if (!match) throw new Error('no email OTP was sent');
    return match[1];
  }
}

describe('passwordless email OTP fallback', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const emailProvider = new CapturingEmailProvider();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EMAIL_OTP_PROVIDER)
      .useValue(emailProvider)
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
    emailProvider.sent.length = 0;
  });

  it('creates a passwordless account without returning the code', async () => {
    const requested = await request(app.getHttpServer())
      .post('/v1/auth/email-otp/request')
      .send({ email: 'otp@example.com' })
      .expect(202);
    expect(Object.keys(requested.body).sort()).toEqual([
      'email',
      'expiresIn',
      'resendAfter',
    ]);
    expect(emailProvider.sent).toHaveLength(1);

    const verified = await request(app.getHttpServer())
      .post('/v1/auth/email-otp/verify')
      .send({
        email: 'OTP@example.com',
        code: emailProvider.lastCode(),
      })
      .expect(200);
    expect(verified.body.created).toBe(true);
    expect(verified.body.account.email).toBe('otp@example.com');
    expect(verified.body.account.authProviders).toContain('email');
    expect(verified.body.tokens.accessToken.split('.')).toHaveLength(3);
    expect(await prisma.user.count()).toBe(1);
  });

  it('returns an honest unavailable error when Firebase is not configured', async () => {
    const result = await request(app.getHttpServer())
      .post('/v1/auth/firebase')
      .send({ idToken: 'x'.repeat(120) })
      .expect(503);
    expect(result.body.error.code).toBe('FIREBASE_UNAVAILABLE');
  });
});
