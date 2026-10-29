import { Logger } from '@nestjs/common';
import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import {
  AiAnalysisPayload,
  AiProviderError,
  PhotoAnalysisInput,
  TextAnalysisInput,
  TextProvider,
  VisionProvider,
} from './ai-provider';
import { validateAiPayload } from './ai-response.validator';
import { PHOTO_SYSTEM_PROMPT, TEXT_SYSTEM_PROMPT } from './prompt';
import { stripCodeFence } from './openai-compatible.provider';

export interface GeminiProviderConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

/**
 * Google AI Studio's free-tier Gemini provider.
 *
 * Like every provider in this seam, Gemini only proposes food labels, rough
 * portions and confidence. The canonical catalog and deterministic nutrition
 * engines remain authoritative.
 */
export class GeminiProvider implements VisionProvider, TextProvider {
  private readonly logger = new Logger('ai');
  private readonly model: GenerativeModel;

  constructor(private readonly config: GeminiProviderConfig) {
    const client = new GoogleGenerativeAI(config.apiKey);
    this.model = client.getGenerativeModel({
      model: config.model,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });
  }

  get modelVersion(): string {
    return `gemini:${this.config.model}`;
  }

  async analyzePhoto(input: PhotoAnalysisInput): Promise<AiAnalysisPayload> {
    return this.generate(PHOTO_SYSTEM_PROMPT, [
      { text: 'Identify the foods in this meal photo.' },
      {
        inlineData: {
          data: input.bytes.toString('base64'),
          mimeType: input.mimeType,
        },
      },
    ]);
  }

  async analyzeText(input: TextAnalysisInput): Promise<AiAnalysisPayload> {
    return this.generate(TEXT_SYSTEM_PROMPT, [
      { text: `The user says they ate: ${input.text}` },
    ]);
  }

  private async generate(
    systemInstruction: string,
    parts: { text: string }[] | ({ text: string } | { inlineData: { data: string; mimeType: string } })[],
  ): Promise<AiAnalysisPayload> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        this.model.generateContent({
          systemInstruction,
          contents: [{ role: 'user', parts }],
        }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new AiProviderError('AI provider timed out', 'timeout')),
            this.config.timeoutMs,
          );
        }),
      ]);
      const content = response.response.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(stripCodeFence(content));
      } catch {
        throw new AiProviderError('AI provider content was not JSON', 'malformed');
      }
      return validateAiPayload(parsed);
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      this.logger.warn('Gemini request failed');
      throw new AiProviderError('AI provider is unavailable', 'transport');
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
