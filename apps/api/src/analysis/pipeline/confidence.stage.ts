import { ConfidenceState } from '@prisma/client';

/**
 * Confidence stage (ADR-0007 D-S2-9, provisional product assumption PPA-9).
 *
 * The blend is deliberately conservative and explainable: half of the overall
 * score is the WEAKEST item, so one bad ingredient cannot be averaged away by
 * five confident ones. A run containing an unresolved item is always Low,
 * because the user must resolve it before anything can be saved.
 *
 * Thresholds are configuration (CONFIDENCE_HIGH_MIN / CONFIDENCE_LOW_MAX), so
 * product can retune them without a code change.
 */
export interface ConfidenceThresholds {
  highMin: number;
  lowMax: number;
}

export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  highMin: 0.8,
  lowMax: 0.5,
};

export interface ConfidenceOutcome {
  overallConfidence: number;
  confidenceState: ConfidenceState;
}

export function computeConfidence(
  itemConfidences: number[],
  hasUnresolved: boolean,
  thresholds: ConfidenceThresholds = DEFAULT_CONFIDENCE_THRESHOLDS,
): ConfidenceOutcome {
  if (itemConfidences.length === 0) {
    return { overallConfidence: 0, confidenceState: ConfidenceState.Low };
  }
  const min = Math.min(...itemConfidences);
  const mean = itemConfidences.reduce((a, b) => a + b, 0) / itemConfidences.length;
  const blended = 0.5 * min + 0.5 * mean;
  const overall = Math.round(Math.min(1, Math.max(0, blended)) * 100) / 100;

  if (hasUnresolved || overall < thresholds.lowMax) {
    return { overallConfidence: overall, confidenceState: ConfidenceState.Low };
  }
  if (overall >= thresholds.highMin) {
    return { overallConfidence: overall, confidenceState: ConfidenceState.High };
  }
  return { overallConfidence: overall, confidenceState: ConfidenceState.Medium };
}
