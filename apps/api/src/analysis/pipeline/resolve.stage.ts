import { Inject, Injectable } from '@nestjs/common';
import { MatchKind } from '@prisma/client';
import { FoodsPrismaRepository, FoodWithRelations } from '../../foods/foods.prisma-repository';
import { AiFoodCandidate } from '../../ai/ai-provider';

/**
 * Retrieval, canonical normalization and portion stages (ADR-0007 D-S2-2).
 *
 * The model contributes a LABEL and at most a rough portion. Everything that
 * decides what the user is actually eating — the canonical food, the portion
 * gram weight, and therefore the nutrition — comes from the food layer:
 *
 *   label → search the canonical catalog → classify the match
 *         → portion table (nourish-standard grams) → grams
 *
 * A label the catalog cannot resolve stays unresolved. It is never mapped to an
 * approximate food and never given an invented gram weight, because both would
 * silently fabricate nutrition (ADR-0004's NULL-vs-0 rule, extended to analysis
 * output).
 */

export interface ResolvedItem {
  displayName: string;
  foodId: string | null;
  sourceFoodCode: string | null;
  canonicalName: string | null;
  matchKind: MatchKind;
  portionAmount: number;
  portionUnit: string;
  portionGrams: number;
  portionEstimated: boolean;
  portionSource: string;
  per100g: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
    sodiumMg: number | null;
  } | null;
  confidence: number;
  unresolved: boolean;
  /** Raw model confidence before the match factor is applied. */
  aiConfidence: number;
}

/** Confidence multiplier per match kind (ADR-0007 D-S2-9, provisional PPA-9). */
export const MATCH_FACTOR: Record<MatchKind, number> = {
  exact: 1.0,
  alias: 0.95,
  fuzzy: 0.8,
  none: 0.3,
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** How well does this label match this food? */
export function classifyMatch(label: string, food: FoodWithRelations): MatchKind {
  const wanted = normalize(label);
  if (normalize(food.canonicalName) === wanted) return 'exact';
  for (const alias of food.aliases) {
    if (alias.normalized === wanted) return 'alias';
  }
  // The catalog search matched on a substring — a real but weaker signal.
  return 'fuzzy';
}

const MATCH_RANK: Record<MatchKind, number> = { exact: 0, alias: 1, fuzzy: 2, none: 3 };

export interface PortionResolution {
  amount: number;
  unit: string;
  grams: number;
  estimated: boolean;
  source: string;
}

/**
 * Convert the model's portion into grams using the food's own portion table.
 * The model's gram guess is only a flagged fallback, and the default portion is
 * the last resort — both are marked `estimated` so the UI can say so.
 */
export function resolvePortion(
  food: FoodWithRelations,
  candidate: AiFoodCandidate,
): PortionResolution {
  const amount = candidate.amount != null && candidate.amount > 0 ? candidate.amount : 1;
  const unit = candidate.unit ?? food.defaultPortionUnit;

  const portion = food.portions.find((p) => p.unit === unit);
  if (portion && portion.quantity > 0) {
    return {
      amount,
      unit,
      grams: Math.round(((amount * portion.grams) / portion.quantity) * 10) / 10,
      estimated: false,
      source: portion.portionSource,
    };
  }

  if (candidate.grams != null && candidate.grams > 0) {
    return {
      amount,
      unit,
      grams: candidate.grams,
      estimated: true,
      source: 'model-estimate',
    };
  }

  return {
    amount,
    unit: food.defaultPortionUnit,
    grams: Math.round(food.defaultPortionGrams * amount * 10) / 10,
    estimated: true,
    source: 'nourish-standard-default',
  };
}

@Injectable()
export class ResolutionStage {
  // Explicit token: see the note in analysis.service.ts.
  constructor(@Inject(FoodsPrismaRepository) private readonly foods: FoodsPrismaRepository) {}

  /**
   * Resolve one model candidate. Returns an unresolved item (no food, no
   * nutrition) when the catalog has nothing to offer.
   */
  async resolve(candidate: AiFoodCandidate): Promise<ResolvedItem> {
    const matches = await this.foods.search({
      q: candidate.label,
      skip: 0,
      take: 5,
    });

    const classified = matches.rows
      .map((food) => ({ food, kind: classifyMatch(candidate.label, food) }))
      .sort((a, b) => MATCH_RANK[a.kind] - MATCH_RANK[b.kind]);

    const best = classified[0];
    if (!best) {
      return {
        displayName: candidate.label,
        foodId: null,
        sourceFoodCode: null,
        canonicalName: null,
        matchKind: 'none',
        portionAmount: candidate.amount ?? 1,
        portionUnit: candidate.unit ?? 'serving',
        portionGrams: candidate.grams ?? 0,
        portionEstimated: true,
        portionSource: 'unresolved',
        per100g: null,
        confidence: candidate.confidence * MATCH_FACTOR.none,
        unresolved: true,
        aiConfidence: candidate.confidence,
      };
    }

    const portion = resolvePortion(best.food, candidate);
    return {
      displayName: candidate.label,
      foodId: best.food.id,
      sourceFoodCode: best.food.sourceFoodCode,
      canonicalName: best.food.canonicalName,
      matchKind: best.kind,
      portionAmount: portion.amount,
      portionUnit: portion.unit,
      portionGrams: portion.grams,
      portionEstimated: portion.estimated,
      portionSource: portion.source,
      per100g: {
        kcal: best.food.per100gKcal,
        proteinG: best.food.per100gProtein,
        carbsG: best.food.per100gCarbs,
        fatG: best.food.per100gFat,
        fiberG: best.food.per100gFiber,
        sodiumMg: best.food.per100gSodiumMg,
      },
      confidence: candidate.confidence * MATCH_FACTOR[best.kind],
      unresolved: false,
      aiConfidence: candidate.confidence,
    };
  }

  /** Ranked alternatives for the low-confidence screen (SCAN-06). */
  async alternatives(label: string, limit = 3): Promise<{ foodId: string; displayName: string }[]> {
    const matches = await this.foods.search({ q: label, skip: 0, take: limit });
    return matches.rows.map((food) => ({
      foodId: food.id,
      displayName: food.canonicalName,
    }));
  }
}
