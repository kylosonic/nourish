import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../config/env';
import { createAiProviders } from './ai-provider.factory';
import { TEXT_PROVIDER, VISION_PROVIDER } from './ai-provider';

/**
 * Binds the active AI provider (ADR-0007 D-S2-1). The factory is called once at
 * module construction, so a misconfigured provider fails the process at boot
 * rather than at the first user request — and `fixture` can never be selected in
 * production.
 */
@Module({
  providers: [
    {
      provide: VISION_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>) =>
        createAiProviders({
          kind: config.get('AI_PROVIDER', { infer: true }),
          baseUrl: config.get('AI_BASE_URL', { infer: true }),
          apiKey: config.get('AI_API_KEY', { infer: true }),
          visionModel: config.get('AI_VISION_MODEL', { infer: true }),
          textModel: config.get('AI_TEXT_MODEL', { infer: true }),
          timeoutMs: config.get('AI_TIMEOUT_MS', { infer: true }),
          nodeEnv: process.env.NODE_ENV ?? 'development',
        }).vision,
    },
    {
      provide: TEXT_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>) =>
        createAiProviders({
          kind: config.get('AI_PROVIDER', { infer: true }),
          baseUrl: config.get('AI_BASE_URL', { infer: true }),
          apiKey: config.get('AI_API_KEY', { infer: true }),
          visionModel: config.get('AI_VISION_MODEL', { infer: true }),
          textModel: config.get('AI_TEXT_MODEL', { infer: true }),
          timeoutMs: config.get('AI_TIMEOUT_MS', { infer: true }),
          nodeEnv: process.env.NODE_ENV ?? 'development',
        }).text,
    },
  ],
  exports: [VISION_PROVIDER, TEXT_PROVIDER],
})
export class AiModule {}
