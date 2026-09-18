import { Logger } from '@nestjs/common';
import {
  AiAnalysisPayload,
  AiProviderError,
  AiUnavailableError,
  PhotoAnalysisInput,
  TextAnalysisInput,
  TextProvider,
  VisionProvider,
} from './ai-provider';
import { PHOTO_SYSTEM_PROMPT, TEXT_SYSTEM_PROMPT } from './prompt';
import { validateAiPayload } from './ai-response.validator';

export interface OpenAiCompatibleConfig {
  baseUrl: string;
  apiKey: string;
  visionModel: string;
  textModel: string;
  timeoutMs: number;
}

/**
 * Real provider: any OpenAI-compatible chat-completions endpoint (ADR-0007).
 *
 * Only the fields the pipeline needs are taken from the response — the model's
 * text is parsed as JSON and then validated by the shared validator, so an
 * off-schema answer becomes AI_INVALID_OUTPUT rather than a trusted object.
 * Provider response bodies are never logged or surfaced to clients.
 */
export class OpenAiCompatibleProvider implements VisionProvider, TextProvider {
  private readonly logger = new Logger('ai');

  constructor(
    private readonly config: OpenAiCompatibleConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  get modelVersion(): string {
    return `${this.config.visionModel}|${this.config.textModel}`;
  }

  async analyzePhoto(input: PhotoAnalysisInput): Promise<AiAnalysisPayload> {
    const dataUrl = `data:${input.mimeType};base64,${input.bytes.toString('base64')}`;
    return this.complete(this.config.visionModel, PHOTO_SYSTEM_PROMPT, [
      { type: 'text', text: 'Identify the foods in this meal photo.' },
      { type: 'image_url', image_url: { url: dataUrl } },
    ]);
  }

  async analyzeText(input: TextAnalysisInput): Promise<AiAnalysisPayload> {
    return this.complete(this.config.textModel, TEXT_SYSTEM_PROMPT, [
      { type: 'text', text: `The user says they ate: ${input.text}` },
    ]);
  }

  private async complete(
    model: string,
    systemPrompt: string,
    userContent: unknown[],
  ): Promise<AiAnalysisPayload> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = (error as { name?: string }).name === 'AbortError';
      this.logger.warn(aborted ? 'provider timeout' : 'provider transport failure');
      throw new AiProviderError(
        aborted ? 'AI provider timed out' : 'AI provider is unreachable',
        aborted ? 'timeout' : 'transport',
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      // Status only: the provider's body may echo the request or contain
      // account detail, and must never reach a client or the logs.
      this.logger.warn(`provider returned HTTP ${response.status}`);
      throw new AiProviderError(`AI provider returned HTTP ${response.status}`, 'status');
    }

    let content: unknown;
    try {
      const body = (await response.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      content = body.choices?.[0]?.message?.content;
    } catch {
      throw new AiProviderError('AI provider returned a non-JSON body', 'malformed');
    }
    if (typeof content !== 'string') {
      throw new AiProviderError('AI provider returned no message content', 'malformed');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripCodeFence(content));
    } catch {
      throw new AiProviderError('AI provider content was not JSON', 'malformed');
    }
    return validateAiPayload(parsed);
  }
}

/** Models sometimes wrap JSON in a ```json fence despite instructions. */
export function stripCodeFence(content: string): string {
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  return fenced ? fenced[1] : trimmed;
}

/**
 * No provider configured: every analysis fails honestly with 503. There is no
 * code path in which production returns a canned result (ADR-0007 D-S2-1).
 */
export class NullProvider implements VisionProvider, TextProvider {
  readonly modelVersion = 'none';

  analyzePhoto(): Promise<AiAnalysisPayload> {
    return Promise.reject(new AiUnavailableError());
  }

  analyzeText(): Promise<AiAnalysisPayload> {
    return Promise.reject(new AiUnavailableError());
  }
}
