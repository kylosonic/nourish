import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { NourishConfigModule } from './config/config.module';
import { EnvVars } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { FoodsModule } from './foods/foods.module';
import { ImportsModule } from './imports/imports.module';
import { AnalysisModule } from './analysis/analysis.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    NourishConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>) => ({
        throttlers: [
          {
            ttl: config.get('RATE_LIMIT_TTL_MS', { infer: true }),
            limit: config.get('RATE_LIMIT_LIMIT', { infer: true }),
          },
        ],
      }),
    }),
    PrismaModule,
    HealthModule,
    FoodsModule,
    ImportsModule,
    AnalysisModule,
    AuthModule,
  ],
  providers: [
    // Throttler v6 does not auto-register the guard (unlike v4) — register
    // it globally so every route is rate-limited unless @SkipThrottle'd.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
