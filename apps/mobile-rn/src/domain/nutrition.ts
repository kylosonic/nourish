import type {
  DailyTarget,
  Food,
  Meal,
  MealDraftItem,
  Nutrition,
  OnboardingData,
} from '../types';
import { newId } from '../utils/date';

export const EMPTY_NUTRITION: Nutrition = {
  kcal: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  sodiumMg: 0,
};

const roundWhole = (value: number) =>
  Math.sign(value) * Math.round(Math.abs(value));

const roundOne = (value: number) =>
  (Math.sign(value) * Math.round(Math.abs(value) * 10)) / 10;

export function nutritionFor(per100g: Nutrition, grams: number): Nutrition {
  const factor = grams / 100;
  return {
    kcal: roundWhole(per100g.kcal * factor),
    proteinG: roundWhole(per100g.proteinG * factor),
    carbsG: roundWhole(per100g.carbsG * factor),
    fatG: roundWhole(per100g.fatG * factor),
    fiberG:
      typeof per100g.fiberG === 'number' ? roundOne(per100g.fiberG * factor) : undefined,
    sodiumMg:
      typeof per100g.sodiumMg === 'number' ? roundOne(per100g.sodiumMg * factor) : undefined,
  };
}

export function portionToGrams(food: Food, unit: string, quantity: number): number {
  if (quantity <= 0) {
    throw new Error(`No usable ${unit} portion for ${food.canonicalName}`);
  }
  if (unit === 'gram') return quantity;
  if (unit === 'kilogram') return quantity * 1000;
  const portion = food.portions.find((candidate) => candidate.unit === unit);
  if (!portion || portion.quantity <= 0) {
    throw new Error(`No usable ${unit} portion for ${food.canonicalName}`);
  }
  return (portion.grams * quantity) / portion.quantity;
}

export function clampPortionQuantity(unit: string, quantity: number): number {
  const max = unit === 'gram' || unit === 'milliliter' ? 2000 : unit === 'kilogram' ? 2 : 20;
  const min = unit === 'kilogram' ? 0.1 : unit === 'gram' || unit === 'milliliter' ? 1 : 0.5;
  return Math.max(min, Math.min(max, quantity));
}

export function portionStep(unit: string): number {
  if (unit === 'kilogram') return 0.1;
  if (unit === 'gram') return 10;
  if (unit === 'milliliter') return 50;
  return 0.5;
}

export function makeMealItem(draft: MealDraftItem) {
  const grams = portionToGrams(draft.food, draft.unit, draft.quantity);
  return {
    id: newId('item'),
    foodId: draft.food.id,
    foodName: draft.food.canonicalName,
    category: draft.food.category,
    portionUnit: draft.unit,
    portionQuantity: draft.quantity,
    grams,
    nutrition: nutritionFor(draft.food.per100g, grams),
  };
}

export function addNutrition(values: Nutrition[]): Nutrition {
  return values.reduce<Nutrition>(
    (sum, value) => ({
      kcal: sum.kcal + value.kcal,
      proteinG: sum.proteinG + value.proteinG,
      carbsG: sum.carbsG + value.carbsG,
      fatG: sum.fatG + value.fatG,
      fiberG: (sum.fiberG ?? 0) + (value.fiberG ?? 0),
      sodiumMg: (sum.sodiumMg ?? 0) + (value.sodiumMg ?? 0),
    }),
    { ...EMPTY_NUTRITION },
  );
}

export function totalsForMeals(meals: Meal[]): Nutrition {
  return addNutrition(meals.flatMap((meal) => meal.items.map((item) => item.nutrition)));
}

export function totalsForDate(meals: Meal[], dateKey: string): Nutrition {
  return totalsForMeals(meals.filter((meal) => meal.dateKey === dateKey));
}

export function percentOf(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  veryActive: 1.725,
  athlete: 1.9,
} as const;

const paceDeficits = {
  conservative: 250,
  moderate: 500,
  aggressive: 1000,
} as const;

export interface TargetInput {
  sex: OnboardingData['sex'];
  age: number;
  heightCm: number;
  currentWeightKg: number;
  goal: NonNullable<OnboardingData['goal']>;
  activity: OnboardingData['activity'];
  pace: OnboardingData['pace'];
}

export function computeTarget(input: TargetInput): DailyTarget {
  if (input.age < 18 || input.age > 100) {
    throw new Error('Age must be between 18 and 100.');
  }
  if (input.heightCm < 100 || input.heightCm > 250) {
    throw new Error('Height must be between 100 and 250 cm.');
  }
  if (input.currentWeightKg < 30 || input.currentWeightKg > 350) {
    throw new Error('Weight must be between 30 and 350 kg.');
  }

  const base =
    10 * input.currentWeightKg + 6.25 * input.heightCm - 5 * input.age;
  const bmr = input.sex === 'male' ? base + 5 : base - 161;
  const tdee = bmr * activityFactors[input.activity];
  let adjustment = 0;
  if (input.goal === 'lose') {
    const paceDeficit = paceDeficits[input.pace ?? 'moderate'];
    adjustment = -Math.max(tdee * 0.15, paceDeficit);
  } else if (input.goal === 'muscle') {
    adjustment = tdee * 0.1;
  }

  const floorKcal = input.sex === 'male' ? 1500 : 1200;
  const targetKcal = Math.max(floorKcal, Math.round((tdee + adjustment) / 10) * 10);
  return {
    targetKcal,
    proteinG: Math.round((targetKcal * 0.25) / 4),
    carbsG: Math.round((targetKcal * 0.45) / 4),
    fatG: Math.round((targetKcal * 0.3) / 9),
    floorKcal,
    formulaVersion: 'mifflin-2026-s0',
    generatedAt: new Date().toISOString(),
  };
}

export function targetFromOnboarding(data: OnboardingData): DailyTarget {
  if (!data.goal) throw new Error('Choose a goal before calculating a target.');
  return computeTarget({
    sex: data.sex,
    age: Number(data.age),
    heightCm: Number(data.heightCm),
    currentWeightKg: Number(data.currentWeightKg),
    goal: data.goal,
    activity: data.activity,
    pace: data.pace,
  });
}

export function remaining(consumed: number, target: number): number {
  return Math.round(target - consumed);
}
