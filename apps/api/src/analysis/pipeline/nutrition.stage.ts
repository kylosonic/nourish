/**
 * Deterministic nutrition stage (ADR-0007 D-S2-2).
 *
 * `per100g × grams / 100`, exactly as the mobile domain engine does
 * (`packages/domain/lib/src/engines/nutrition_engine.dart`): kcal and the macro
 * grams are whole numbers rounded half away from zero, fiber and sodium keep one
 * decimal. Values come from the stored FCT row — never from the model.
 */

export interface Per100g {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sodiumMg: number | null;
}

export interface ComputedNutrition {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sodiumMg: number | null;
}

/** Round half away from zero (JS `Math.round` rounds half up, which differs for negatives). */
export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

function roundTo1Decimal(value: number): number {
  return roundHalfAwayFromZero(value * 10) / 10;
}

export function computeNutrition(per100g: Per100g, grams: number): ComputedNutrition {
  const factor = grams / 100;
  return {
    kcal: roundHalfAwayFromZero(per100g.kcal * factor),
    proteinG: roundHalfAwayFromZero(per100g.proteinG * factor),
    carbsG: roundHalfAwayFromZero(per100g.carbsG * factor),
    fatG: roundHalfAwayFromZero(per100g.fatG * factor),
    fiberG: per100g.fiberG == null ? null : roundTo1Decimal(per100g.fiberG * factor),
    sodiumMg: per100g.sodiumMg == null ? null : roundTo1Decimal(per100g.sodiumMg * factor),
  };
}

/** Sum item nutrition for the meal total (nulls are treated as "no data"). */
export function sumNutrition(items: ComputedNutrition[]): ComputedNutrition {
  const total: ComputedNutrition = {
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: null,
    sodiumMg: null,
  };
  for (const item of items) {
    total.kcal += item.kcal;
    total.proteinG += item.proteinG;
    total.carbsG += item.carbsG;
    total.fatG += item.fatG;
    if (item.fiberG != null) total.fiberG = (total.fiberG ?? 0) + item.fiberG;
    if (item.sodiumMg != null) total.sodiumMg = (total.sodiumMg ?? 0) + item.sodiumMg;
  }
  total.fiberG = total.fiberG == null ? null : roundTo1Decimal(total.fiberG);
  total.sodiumMg = total.sodiumMg == null ? null : roundTo1Decimal(total.sodiumMg);
  return total;
}
