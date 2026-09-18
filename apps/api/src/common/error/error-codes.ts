/** Error codes exposed in the v1 error envelope (S1 blueprint §8, S2 §5). */
export enum ErrorCode {
  FOOD_NOT_FOUND = 'FOOD_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL = 'INTERNAL',

  // ── S2 analysis (ADR-0007) ────────────────────────────────────────────────
  /** No AI provider is configured. The honest answer; never a fake result. */
  AI_UNAVAILABLE = 'AI_UNAVAILABLE',
  /** The provider's answer failed schema validation and was discarded. */
  AI_INVALID_OUTPUT = 'AI_INVALID_OUTPUT',
  AI_TIMEOUT = 'AI_TIMEOUT',
  /** The provider identified nothing edible in the input. */
  NO_FOOD_DETECTED = 'NO_FOOD_DETECTED',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
  IMAGE_UNREADABLE = 'IMAGE_UNREADABLE',
  UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE',
  /** The process-wide daily analysis budget is exhausted. */
  AI_BUDGET_EXHAUSTED = 'AI_BUDGET_EXHAUSTED',
  ANALYSIS_NOT_FOUND = 'ANALYSIS_NOT_FOUND',
}
