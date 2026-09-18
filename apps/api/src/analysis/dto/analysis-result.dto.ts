import { ConfidenceState, MatchKind } from '@prisma/client';

/** One detected food in an analysis result (S2 blueprint §5). */
export class AnalysisItemDto {
  id!: string;
  displayName!: string;
  /** Canonical application id — the same namespace `/v1/foods/:id` uses. */
  foodId!: string | null;
  /** Bridge to the mobile cache, which keys FCT foods by source food code. */
  sourceFoodCode!: string | null;
  canonicalName!: string | null;
  matchKind!: MatchKind;
  portion!: {
    amount: number;
    unit: string;
    grams: number;
    /** True when the gram weight is an estimate rather than the food's table. */
    estimated: boolean;
    portionSource: string;
  };
  /** Deterministic `per100g × grams / 100`; null when the item is unresolved. */
  nutrition!: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
    sodiumMg: number | null;
  } | null;
  confidence!: number;
  unresolved!: boolean;
}

export class AnalysisCandidateDto {
  displayName!: string;
  foodId!: string | null;
  confidence!: number;
}

export class AnalysisResultDto {
  id!: string;
  status!: 'Completed' | 'Failed';
  inputKind!: 'Photo' | 'Text';
  confidenceState!: ConfidenceState;
  overallConfidence!: number;
  items!: AnalysisItemDto[];
  totals!: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
    sodiumMg: number | null;
  };
  candidates!: AnalysisCandidateDto[];
  modelVersion!: string;
  promptVersion!: string;
  notes!: string[];
}
