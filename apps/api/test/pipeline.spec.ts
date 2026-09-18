/**
 * Unit tests: the deterministic stages of the analysis pipeline (ADR-0007).
 * These lock the arithmetic the user's numbers come from — the AI never
 * contributes any of it.
 */
import {
  computeConfidence,
  DEFAULT_CONFIDENCE_THRESHOLDS,
} from '../src/analysis/pipeline/confidence.stage';
import {
  computeNutrition,
  roundHalfAwayFromZero,
  sumNutrition,
} from '../src/analysis/pipeline/nutrition.stage';
import { resolvePortion, classifyMatch } from '../src/analysis/pipeline/resolve.stage';
import { FoodWithRelations } from '../src/foods/foods.prisma-repository';

describe('nutrition stage (deterministic)', () => {
  const per100g = {
    kcal: 219,
    proteinG: 6.8,
    carbsG: 5.1,
    fatG: 18.4,
    fiberG: 2.9,
    sodiumMg: 332,
  };

  it('computes per100g x grams / 100', () => {
    expect(computeNutrition(per100g, 240)).toEqual({
      kcal: 526, // 525.6 -> half away from zero
      proteinG: 16, // 16.32
      carbsG: 12, // 12.24
      fatG: 44, // 44.16
      fiberG: 7, // 6.96 -> 7.0
      sodiumMg: 796.8,
    });
  });

  it('matches the mobile domain engine rounding (half away from zero)', () => {
    // packages/domain/lib/src/engines/nutrition_engine.dart rounds kcal and
    // macros to whole numbers and fiber/sodium to one decimal.
    expect(roundHalfAwayFromZero(0.5)).toBe(1);
    expect(roundHalfAwayFromZero(-0.5)).toBe(-1);
    const half = computeNutrition({ ...per100g, kcal: 100.5, proteinG: 0 }, 100);
    expect(half.kcal).toBe(101);
  });

  it('keeps "no data" as null rather than zero (ADR-0004)', () => {
    const result = computeNutrition({ ...per100g, fiberG: null, sodiumMg: null }, 100);
    expect(result.fiberG).toBeNull();
    expect(result.sodiumMg).toBeNull();
  });

  it('sums a meal, treating absent nutrients as absent', () => {
    const a = computeNutrition(per100g, 100);
    const b = computeNutrition({ ...per100g, fiberG: null, sodiumMg: null }, 100);
    const total = sumNutrition([a, b]);
    expect(total.kcal).toBe(438);
    expect(total.fiberG).toBe(2.9);
    expect(total.sodiumMg).toBe(332);
  });
});

describe('confidence stage (provisional PPA-9)', () => {
  it('is conservative: the weakest item carries half the weight', () => {
    const { overallConfidence, confidenceState } = computeConfidence([1, 1, 1, 0.4], false);
    // 0.5 * 0.4 + 0.5 * 0.85 = 0.625
    expect(overallConfidence).toBe(0.63);
    expect(confidenceState).toBe('Medium');
  });

  it('routes a strong run to High and a weak run to Low', () => {
    expect(computeConfidence([0.95, 0.9], false).confidenceState).toBe('High');
    expect(computeConfidence([0.45, 0.4], false).confidenceState).toBe('Low');
  });

  it('forces Low whenever an item could not be resolved', () => {
    const outcome = computeConfidence([0.99, 0.99], true);
    expect(outcome.confidenceState).toBe('Low');
  });

  it('is Low with no items at all (nothing was identified)', () => {
    expect(computeConfidence([], false)).toEqual({
      overallConfidence: 0,
      confidenceState: 'Low',
    });
  });

  it('honours retuned thresholds without a code change', () => {
    const { confidenceState } = computeConfidence([0.7, 0.7], false, {
      highMin: 0.65,
      lowMax: 0.4,
    });
    expect(confidenceState).toBe('High');
    expect(DEFAULT_CONFIDENCE_THRESHOLDS.lowMax).toBe(0.5);
  });
});

/** Minimal food-layer row for the portion/match tests. */
function food(overrides: Partial<FoodWithRelations> = {}): FoodWithRelations {
  return {
    id: 'shiro_wot',
    canonicalName: 'Pea, chickpea and broad bean spiced flours, stew',
    categoryCode: 'ethiopian',
    description: null,
    region: null,
    per100gKcal: 146,
    per100gProtein: 3.2,
    per100gCarbs: 6.7,
    per100gFat: 11.4,
    per100gFiber: 1.8,
    per100gSodiumMg: 672,
    extraNutrients: {},
    defaultPortionUnit: 'cup',
    defaultPortionQty: 1,
    defaultPortionGrams: 240,
    sourceName: 'ethiopian-fct-2025',
    sourceVersion: '2025',
    sourceFoodCode: '030088',
    sourceReference: 'EPHI & FAO 2025',
    importDate: new Date('2026-08-27T00:00:00Z'),
    status: 'Active',
    importId: 'imp_1',
    aliases: [
      {
        id: 'al_1',
        foodId: 'shiro_wot',
        alias: 'shiro',
        language: 'en',
        kind: 'alternate',
        normalized: 'shiro',
      },
    ],
    portions: [
      {
        id: 'po_1',
        foodId: 'shiro_wot',
        unit: 'cup',
        quantity: 1,
        grams: 240,
        portionSource: 'nourish-standard',
      },
      {
        id: 'po_2',
        foodId: 'shiro_wot',
        unit: 'ladle',
        quantity: 1,
        grams: 100,
        portionSource: 'nourish-standard',
      },
    ],
    category: { code: 'ethiopian', label: 'Ethiopian' },
    import: undefined as never,
    ...overrides,
  } as unknown as FoodWithRelations;
}

describe('retrieval and portion stages', () => {
  it('classifies exact, alias and fuzzy matches', () => {
    const row = food();
    expect(classifyMatch('Pea, chickpea and broad bean spiced flours, stew', row)).toBe('exact');
    expect(classifyMatch('shiro', row)).toBe('alias');
    expect(classifyMatch('Shiro', row)).toBe('alias'); // case-insensitive
    expect(classifyMatch('shiro wot with salad', row)).toBe('fuzzy');
  });

  it('converts the model portion through the food portion table', () => {
    const resolution = resolvePortion(food(), { label: 'shiro', amount: 2, unit: 'ladle', confidence: 0.9 });
    expect(resolution).toEqual({
      amount: 2,
      unit: 'ladle',
      grams: 200,
      estimated: false,
      source: 'nourish-standard',
    });
  });

  it('flags a model gram guess as an estimate when the unit is unknown', () => {
    const resolution = resolvePortion(food(), {
      label: 'shiro',
      amount: 1,
      unit: 'bucket',
      grams: 321,
      confidence: 0.9,
    });
    expect(resolution.grams).toBe(321);
    expect(resolution.estimated).toBe(true);
    expect(resolution.source).toBe('model-estimate');
  });

  it('uses the food default portion when the model names no unit', () => {
    const resolution = resolvePortion(food(), { label: 'shiro', confidence: 0.9 });
    expect(resolution.unit).toBe('cup');
    expect(resolution.grams).toBe(240);
    // The default portion is part of the food's own table, so it is not an
    // estimate — the number still comes from the food layer.
    expect(resolution.estimated).toBe(false);
    expect(resolution.source).toBe('nourish-standard');
  });

  it('flags the fallback as estimated when even the default unit is missing', () => {
    const row = food({
      defaultPortionUnit: 'serving',
      portions: [],
    });
    const resolution = resolvePortion(row, { label: 'shiro', confidence: 0.9 });
    expect(resolution.grams).toBe(240);
    expect(resolution.estimated).toBe(true);
    expect(resolution.source).toBe('nourish-standard-default');
  });
});
