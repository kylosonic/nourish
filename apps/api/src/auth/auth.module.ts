import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EnvVars } from '../config/env';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountController } from './account.controller';
import { AccountDeletionRequestController } from './account-deletion-request.controller';
import { AuthController, MeController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { EMAIL_OTP_PROVIDER, SMS_PROVIDER } from './auth.tokens';
import { createSmsProvider } from './sms-provider.factory';
import { GoogleTokenVerifier } from './google-verifier';
import { FirebasePhoneVerifier } from './firebase-verifier';
import { createEmailOtpProvider } from './email-otp-provider.factory';

/**
 * Accounts, sessions and consent (S3, ADR-0008).
 *
 * The JWT secret is read once at construction; a missing or too-short secret
 * fails the process at boot (the env schema enforces the length).
 */
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { algorithm: 'HS256' },
      }),
    }),
  ],
  controllers: [
    AuthController,
    MeController,
    AccountController,
    AccountDeletionRequestController,
  ],
  providers: [
    AuthRepository,
    AuthService,
    AuthGuard,
    GoogleTokenVerifier,
    FirebasePhoneVerifier,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>) =>
        createSmsProvider({
          kind: config.get('SMS_PROVIDER', { infer: true }),
          url: config.get('SMS_API_URL', { infer: true }),
          apiKey: config.get('SMS_API_KEY', { infer: true }),
          sender: config.get('SMS_SENDER', { infer: true }),
          timeoutMs: config.get('SMS_TIMEOUT_MS', { infer: true }),
          nodeEnv: process.env.NODE_ENV ?? 'development',
        }),
    },
    {
      provide: EMAIL_OTP_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>) =>
        createEmailOtpProvider({
          kind: config.get('EMAIL_OTP_PROVIDER', { infer: true }),
          nodeEnv: process.env.NODE_ENV ?? 'development',
          timeoutMs: config.get('SMS_TIMEOUT_MS', { infer: true }),
          from: config.get('OTP_EMAIL_FROM', { infer: true }),
          resendApiKey: config.get('RESEND_API_KEY', { infer: true }),
          resendApiUrl: config.get('RESEND_API_URL', { infer: true }),
          smtpHost: config.get('SMTP_HOST', { infer: true }),
          smtpPort: config.get('SMTP_PORT', { infer: true }),
          smtpUser: config.get('SMTP_USER', { infer: true }),
          smtpPass: config.get('SMTP_PASS', { infer: true }),
          smtpSecure: config.get('SMTP_SECURE', { infer: true }),
        }),
    },
  ],
  exports: [AuthService, AuthRepository, AuthGuard],
})
export class AuthModule {}
