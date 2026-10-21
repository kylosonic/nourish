import type { Food, FoodPreference, Meal, MealSlot, Nutrition } from '../types';
import { nutritionFor } from './nutrition';

export interface Suggestion {
  food: Food;
  nutrition: Nutrition;
  local: boolean;
  matchesSlot: boolean;
  recentlyLogged: boolean;
}

export function mealSlotForHour(hour = new Date().getHours()): MealSlot {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 22) return 'dinner';
  return 'snack';
}

export function recommendFoods({
  catalog,
  meals,
  remainingKcal,
  proteinNeedG,
  preference,
  slot,
  limit = 5,
}: {
  catalog: Food[];
  meals: Meal[];
  remainingKcal: number;
  proteinNeedG: number;
  preference: FoodPreference;
  slot: MealSlot;
  limit?: number;
}): Suggestion[] {
  if (remainingKcal <= 0) return [];
  const recent = new Set(
    meals
      .filter((meal) => Date.now() - new Date(meal.loggedAt).getTime() < 3 * 86400000)
      .flatMap((meal) => meal.items.map((item) => item.foodId)),
  );

  const candidates = catalog
    .map<Suggestion>((food) => ({
      food,
      nutrition: nutritionFor(food.per100g, food.defaultPortion.grams),
      local: food.category.toLowerCase() === 'ethiopian',
      matchesSlot: matchesSlot(food.category, slot),
      recentlyLogged: recent.has(food.id),
    }))
    .filter((candidate) => candidate.nutrition.kcal > 0)
    .sort((a, b) => score(b, preference) - score(a, preference));

  const picked: Suggestion[] = [];
  let used = 0;
  let protein = 0;
  for (const candidate of candidates) {
    if (picked.length >= limit) break;
    if (used + candidate.nutrition.kcal > remainingKcal) continue;
    picked.push(candidate);
    used += candidate.nutrition.kcal;
    protein += candidate.nutrition.proteinG;
    if (proteinNeedG > 0 && protein >= proteinNeedG) break;
  }
  return picked;
}

function matchesSlot(category: string, slot: MealSlot): boolean {
  const lower = category.toLowerCase();
  if (slot === 'breakfast') return lower === 'breakfast';
  if (slot === 'lunch') return lower === 'lunch' || lower === 'ethiopian';
  if (slot === 'dinner') return lower === 'dinner' || lower === 'ethiopian';
  if (slot === 'snack') return lower === 'snacks' || lower === 'snack';
  return false;
}

function score(candidate: Suggestion, preference: FoodPreference): number {
  const density = candidate.nutrition.proteinG / Math.max(1, candidate.nutrition.kcal);
  return (
    density * 10 +
    (candidate.local && preference !== 'international' ? 0.4 : 0) +
    (candidate.matchesSlot ? 0.3 : 0) -
    (candidate.recentlyLogged ? 0.5 : 0)
  );
}
