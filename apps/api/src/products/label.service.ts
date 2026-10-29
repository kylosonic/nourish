import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EnvVars } from '../config/env';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';

export interface ParsedNutritionLabel {
  name: string | null;
  servingSizeG: number;
  perServing: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  confidence: number;
}

const LABEL_PROMPT = `Read this packaged-food nutrition label.
Return JSON only with this exact shape:
{"name":string|null,"servingSizeG":number,"perServing":{"kcal":number,"proteinG":number,"carbsG":number,"fatG":number},"confidence":number}
Use grams for servingSizeG. Convert serving mass to grams only when the label
states a mass; never guess. Copy the printed nutrition values for one serving.
Use null for any value that is absent or unreadable. confidence is 0..1.
Do not estimate, infer ingredients, or compute missing nutrition.`;

@Injectable()
export class NutritionLabelService {
  private readonly logger = new Logger('label-ocr');

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<EnvVars, true>,
  ) {}

  async parse(base64: string, mimeType: string): Promise<ParsedNutritionLabel> {
    const apiKey = this.config.get('GEMINI_API_KEY', { infer: true });
    if (!apiKey) {
      throw new NourishHttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.AI_UNAVAILABLE,
        'Label recognition is not configured.',
      );
    }
    const timeoutMs = this.config.get('AI_TIMEOUT_MS', { infer: true });
    const model = this.config.get('GEMINI_MODEL', { infer: true });
    const client = new GoogleGenerativeAI(apiKey);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        client.getGenerativeModel({
          model,
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
          },
        }).generateContent([
          { text: LABEL_PROMPT },
          { inlineData: { data: base64, mimeType } },
        ]),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new NourishHttpException(
                  HttpStatus.GATEWAY_TIMEOUT,
                  ErrorCode.AI_TIMEOUT,
                  'Label recognition took too long.',
                ),
              ),
            timeoutMs,
          );
        }),
      ]);
      const raw = response.response.text().trim().replace(/^```json\s*|\s*```$/g, '');
      const parsed = JSON.parse(raw) as {
        name?: unknown;
        servingSizeG?: unknown;
        perServing?: Record<string, unknown>;
        confidence?: unknown;
      };
      const servingSizeG = finite(parsed.servingSizeG);
      const kcal = finite(parsed.perServing?.kcal);
      const proteinG = finite(parsed.perServing?.proteinG);
      const carbsG = finite(parsed.perServing?.carbsG);
      const fatG = finite(parsed.perServing?.fatG);
      if (
        servingSizeG == null ||
        servingSizeG <= 0 ||
        servingSizeG > 5000 ||
        kcal == null ||
        proteinG == null ||
        carbsG == null ||
        fatG == null
      ) {
        throw new Error('incomplete label');
      }
      return {
        name:
          typeof parsed.name === 'string' && parsed.name.trim()
            ? parsed.name.trim().slice(0, 200)
            : null,
        servingSizeG,
        perServing: { kcal, proteinG, carbsG, fatG },
        confidence: Math.max(0, Math.min(1, finite(parsed.confidence) ?? 0)),
      };
    } catch (error) {
      if (error instanceof NourishHttpException) throw error;
      this.logger.warn('nutrition label could not be parsed');
      throw new NourishHttpException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.LABEL_UNREADABLE,
        'The nutrition label could not be read. Try a clearer, straight-on photo.',
      );
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

function finite(value: unknown): number | null {
  const number =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : NaN;
  return Number.isFinite(number) && number >= 0 ? number : null;
}
