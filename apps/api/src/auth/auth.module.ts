import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EnvVars } from '../config/env';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController, MeController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { SMS_PROVIDER } from './auth.tokens';
import { createSmsProvider } from './sms-provider.factory';

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
  controllers: [AuthController, MeController],
  providers: [
    AuthRepository,
    AuthService,
    AuthGuard,
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
  ],
  exports: [AuthService, AuthRepository, AuthGuard],
})
export class AuthModule {}
