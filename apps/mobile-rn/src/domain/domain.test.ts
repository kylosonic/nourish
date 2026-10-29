import { describe, expect, it } from 'vitest';
import type { Meal, WeightLog } from '../types';
import { buildWeeklyInsights } from './insights';
import {
  computeTarget,
  clampPortionQuantity,
  makeMealItem,
  nutritionFor,
  portionStep,
  portionToGrams,
} from './nutrition';
import { recommendFoods } from './recommendations';
import { seedFoods } from '../data/seed';
import { addDays, localDateKey } from '../utils/date';
import { isNewerVersion } from '../utils/version';

describe('deterministic nutrition engine', () => {
  it('converts a food-specific portion and computes the exact anchor', () => {
    const injera = seedFoods.find((food) => food.id === 'injera')!;
    expect(portionToGrams(injera, 'injera', 1)).toBe(150);
    expect(nutritionFor(injera.per100g, 150).kcal).toBe(225);
  });

  it('keeps nutrition snapshots attached to a logged item', () => {
    const injera = seedFoods.find((food) => food.id === 'injera')!;
    const item = makeMealItem({ food: injera, unit: 'injera', quantity: 2 });
    expect(item.grams).toBe(300);
    expect(item.nutrition.kcal).toBe(450);
    expect(item.nutrition.proteinG).toBe(15);
  });

  it('rejects unsupported portions instead of guessing grams', () => {
    const injera = seedFoods.find((food) => food.id === 'injera')!;
    expect(() => portionToGrams(injera, 'bowl', 1)).toThrow(/No usable bowl portion/);
  });

  it('accepts exact gram and kilogram portions from scanner results', () => {
    const shiro = seedFoods.find((food) => food.id === 'shiro_wot')!;
    expect(portionToGrams(shiro, 'gram', 180)).toBe(180);
    expect(portionToGrams(shiro, 'kilogram', 0.25)).toBe(250);
    expect(clampPortionQuantity('gram', 2500)).toBe(2000);
    expect(clampPortionQuantity('kilogram', 0.01)).toBe(0.1);
    expect(portionStep('gram')).toBe(10);
  });
});

describe('target engine', () => {
  it('computes the reviewed Mifflin-St Jeor target', () => {
    const target = computeTarget({
      sex: 'female',
      age: 28,
      heightCm: 165,
      currentWeightKg: 68,
      goal: 'lose',
      activity: 'moderate',
      pace: 'moderate',
    });
    expect(target.targetKcal).toBe(1690);
    expect(target.proteinG).toBe(106);
    expect(target.carbsG).toBe(190);
    expect(target.fatG).toBe(56);
  });

  it('refuses an under-age profile', () => {
    expect(() =>
      computeTarget({
        sex: 'female',
        age: 17,
        heightCm: 165,
        currentWeightKg: 60,
        goal: 'healthy',
        activity: 'moderate',
        pace: null,
      }),
    ).toThrow(/Age must be between 18 and 100/);
  });
});

describe('weekly insights', () => {
  const today = localDateKey();
  const item = makeMealItem({
    food: seedFoods.find((food) => food.id === 'injera')!,
    unit: 'injera',
    quantity: 1,
  });
  const meal: Meal = {
    id: 'meal_1',
    dateKey: today,
    slot: 'dinner',
    loggedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    items: [item],
    source: 'search',
  };
  const target = computeTarget({
    sex: 'female',
    age: 28,
    heightCm: 165,
    currentWeightKg: 68,
    goal: 'maintain',
    activity: 'moderate',
    pace: null,
  });

  it('uses a real gap for unlogged days and reports only logged data', () => {
    const insights = buildWeeklyInsights([meal], [], target, seedFoods);
    expect(insights.loggedDays).toBe(1);
    expect(insights.isEmpty).toBe(false);
    expect(insights.days.filter((day) => day.logged)).toHaveLength(1);
    expect(insights.days.filter((day) => !day.logged).every((day) => day.nutrition.kcal === 0)).toBe(
      true,
    );
    expect(insights.average.kcal).toBe(225);
  });

  it('produces an honest empty state with no meals', () => {
    const insights = buildWeeklyInsights([], [], target, seedFoods);
    expect(insights.isEmpty).toBe(true);
    expect(insights.highlights).toEqual([]);
  });

  it('states a weight trend only after at least two weigh-ins', () => {
    const weights: WeightLog[] = [
      {
        id: 'w1',
        dateKey: addDays(today, -3),
        weightKg: 68,
        loggedAt: new Date().toISOString(),
      },
      {
        id: 'w2',
        dateKey: today,
        weightKg: 67.2,
        loggedAt: new Date().toISOString(),
      },
    ];
    const insights = buildWeeklyInsights([], weights, target, seedFoods);
    expect(insights.highlights.some((highlight) => highlight.title === 'Weight trend')).toBe(true);
  });
});

describe('budget-constrained recommendations', () => {
  it('only returns foods whose default portions fit the remaining budget', () => {
    const suggestions = recommendFoods({
      catalog: seedFoods,
      meals: [],
      remainingKcal: 300,
      proteinNeedG: 20,
      preference: 'ethiopian',
      slot: 'dinner',
    });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((suggestion) => suggestion.nutrition.kcal <= 300)).toBe(true);
    expect(suggestions.some((suggestion) => suggestion.local)).toBe(true);
  });

  it('returns nothing when the budget is spent instead of inventing a fit', () => {
    expect(
      recommendFoods({
        catalog: seedFoods,
        meals: [],
        remainingKcal: 0,
        proteinNeedG: 20,
        preference: 'ethiopian',
        slot: 'dinner',
      }),
    ).toEqual([]);
  });
});

describe('release update comparison', () => {
  it('accepts only a semver upgrade', () => {
    expect(isNewerVersion('v1.1.0', '1.0.0')).toBe(true);
    expect(isNewerVersion('1.0.10', '1.0.9')).toBe(true);
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('0.9.9', '1.0.0')).toBe(false);
  });
});
