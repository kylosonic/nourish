import { Logger } from '@nestjs/common';
import { AiProviderKind } from '../config/env';
import { TextProvider, VisionProvider } from './ai-provider';
import { FixtureProvider } from './fixture.provider';
import { NullProvider, OpenAiCompatibleProvider } from './openai-compatible.provider';

export interface AiProviderSettings {
  kind: AiProviderKind;
  baseUrl?: string;
  apiKey?: string;
  visionModel: string;
  textModel: string;
  timeoutMs: number;
  nodeEnv: string;
}

export interface AiProviders {
  vision: VisionProvider;
  text: TextProvider;
  /** What the run records as its model version. */
  modelVersion: string;
}

/**
 * Selects the active provider from configuration (ADR-0007 D-S2-1).
 *
 * Hard rules enforced here rather than by convention:
 *  - `fixture` is refused when NODE_ENV=production, whatever the config says, so
 *    a canned analysis can never be served by a production process;
 *  - `openai-compatible` requires a key and a base URL, otherwise the app fails
 *    fast at boot instead of at the first user request;
 *  - anything else (including the default) yields the honest NullProvider.
 */
export function createAiProviders(settings: AiProviderSettings): AiProviders {
  const logger = new Logger('ai');

  if (settings.kind === 'fixture') {
    if (settings.nodeEnv === 'production') {
      throw new Error(
        'AI_PROVIDER=fixture is refused when NODE_ENV=production: a deterministic ' +
          'test provider must never serve real users',
      );
    }
    logger.warn('AI provider is the deterministic fixture provider (non-production only)');
    const fixture = new FixtureProvider();
    return { vision: fixture, text: fixture, modelVersion: fixture.modelVersion };
  }

  if (settings.kind === 'openai-compatible') {
    if (!settings.apiKey || !settings.baseUrl) {
      throw new Error(
        'AI_PROVIDER=openai-compatible requires AI_API_KEY and AI_BASE_URL',
      );
    }
    const provider = new OpenAiCompatibleProvider({
      baseUrl: settings.baseUrl.replace(/\/+$/, ''),
      apiKey: settings.apiKey,
      visionModel: settings.visionModel,
      textModel: settings.textModel,
      timeoutMs: settings.timeoutMs,
    });
    logger.log(`AI provider: openai-compatible (${settings.visionModel})`);
    return { vision: provider, text: provider, modelVersion: provider.modelVersion };
  }

  logger.log('AI provider: none — analyses will answer 503 AI_UNAVAILABLE');
  const none = new NullProvider();
  return { vision: none, text: none, modelVersion: none.modelVersion };
}
