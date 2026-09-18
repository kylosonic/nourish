/**
 * The AI provider seam (ADR-0007 D-S2-1).
 *
 * The model proposes candidate food labels, a rough portion and a confidence.
 * It NEVER supplies nutrition, portion gram weights or daily targets — those
 * come from the food layer and the deterministic engines. Everything a provider
 * returns is validated against `ai-response.validator.ts` before use.
 */

/** One food the model believes it saw. */
export interface AiFoodCandidate {
  /** Free-text label, e.g. "doro wet" or "ዶሮ ወጥ". */
  label: string;
  /** Portion the model suggests (optional; the food layer decides grams). */
  amount?: number;
  unit?: string;
  /** Model's own gram estimate — an estimate, flagged as such downstream. */
  grams?: number;
  /** Per-item confidence in [0,1]. */
  confidence: number;
}

export interface AiAnalysisPayload {
  foods: AiFoodCandidate[];
  /** Optional overall confidence; the pipeline computes its own if absent. */
  overallConfidence?: number;
  /** Optional short note, e.g. why the model is unsure. */
  note?: string;
}

export interface PhotoAnalysisInput {
  bytes: Buffer;
  mimeType: string;
}

export interface TextAnalysisInput {
  text: string;
}

export interface VisionProvider {
  /** Identifier stored on the run for correction analytics. */
  readonly modelVersion: string;
  analyzePhoto(input: PhotoAnalysisInput): Promise<AiAnalysisPayload>;
}

export interface TextProvider {
  readonly modelVersion: string;
  analyzeText(input: TextAnalysisInput): Promise<AiAnalysisPayload>;
}

/** Injection tokens (Nest resolves the active provider through the factory). */
export const VISION_PROVIDER = 'VISION_PROVIDER';
export const TEXT_PROVIDER = 'TEXT_PROVIDER';

/**
 * No provider is configured. The API answers honestly with 503 — it never
 * fabricates an analysis (master §61/§71).
 */
export class AiUnavailableError extends Error {
  constructor(message = 'No AI provider is configured') {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

/** The provider failed or timed out. The provider's body is never surfaced. */
export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly kind: 'timeout' | 'transport' | 'status' | 'malformed',
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}
