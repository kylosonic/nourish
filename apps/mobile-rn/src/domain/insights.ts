import type {
  DailyTarget,
  Food,
  Meal,
  Nutrition,
  WeightLog,
  WeeklyInsights,
} from '../types';
import { addNutrition, EMPTY_NUTRITION, totalsForDate } from './nutrition';
import { addDays, localDateKey, weekdayShort } from '../utils/date';

const FIBER_REFERENCE = 25;
const SODIUM_REFERENCE = 2000;

export function buildWeeklyInsights(
  meals: Meal[],
  weights: WeightLog[],
  target: DailyTarget,
  catalog: Food[],
): WeeklyInsights {
  const todayKey = localDateKey();
  const days = Array.from({ length: 7 }, (_, index) => {
    const dateKey = addDays(todayKey, index - 6);
    const dayMeals = meals.filter((meal) => meal.dateKey === dateKey);
    const nutrition = totalsForDate(meals, dateKey);
    const ethiopianItems = dayMeals.flatMap((meal) => meal.items).filter((item) => {
      const food = catalog.find((candidate) => candidate.id === item.foodId);
      return food?.category.toLowerCase() === 'ethiopian';
    }).length;
    const totalItems = dayMeals.reduce((sum, meal) => sum + meal.items.length, 0);
    return {
      dateKey,
      weekday: weekdayShort(dateKey),
      logged: dayMeals.length > 0,
      nutrition,
      exceededTarget: dayMeals.length > 0 && nutrition.kcal > target.targetKcal,
      ethiopianItems,
      otherItems: totalItems - ethiopianItems,
    };
  });

  const loggedDays = days.filter((day) => day.logged);
  const average =
    loggedDays.length === 0
      ? { ...EMPTY_NUTRITION }
      : divideNutrition(
          addNutrition(loggedDays.map((day) => day.nutrition)),
          loggedDays.length,
        );

  const highlights: WeeklyInsights['highlights'] = [];
  if (loggedDays.length >= 3) {
    const fiberDays = loggedDays.filter(
      (day) => (day.nutrition.fiberG ?? 0) >= FIBER_REFERENCE,
    ).length;
    if (fiberDays >= 4) {
      highlights.push({
        kind: 'positive',
        title: 'Fiber goal met',
        detail: `You reached ${FIBER_REFERENCE} g of fiber on ${fiberDays} of your ${loggedDays.length} logged days.`,
      });
    } else if (fiberDays === 0) {
      highlights.push({
        kind: 'cautionary',
        title: 'Low fiber',
        detail: `None of your ${loggedDays.length} logged days reached ${FIBER_REFERENCE} g of fiber.`,
      });
    }
    highlights.push({
      kind: loggedDays.length >= 5 ? 'positive' : 'cautionary',
      title: 'Logging consistency',
      detail: `You logged on ${loggedDays.length} of the last 7 days.`,
    });
  }

  const saltiest = [...loggedDays].sort(
    (a, b) => (b.nutrition.sodiumMg ?? 0) - (a.nutrition.sodiumMg ?? 0),
  )[0];
  if (saltiest && (saltiest.nutrition.sodiumMg ?? 0) > SODIUM_REFERENCE) {
    const percent = Math.round(
      (((saltiest.nutrition.sodiumMg ?? 0) - SODIUM_REFERENCE) / SODIUM_REFERENCE) * 100,
    );
    highlights.push({
      kind: 'cautionary',
      title: 'Sodium intake',
      detail: `Sodium was ${percent}% above the ${SODIUM_REFERENCE} mg reference on ${saltiest.weekday}.`,
    });
  }

  const over = loggedDays.filter((day) => day.exceededTarget);
  if (over.length > 0) {
    highlights.push({
      kind: 'cautionary',
      title: 'Over your target',
      detail: `You went over your ${target.targetKcal} kcal target on ${over.length} ${
        over.length === 1 ? `day (${over[0].weekday})` : `days (${over.map((day) => day.weekday).join(', ')})`
      }.`,
    });
  }

  const weekWeights = weights
    .filter((log) => log.dateKey >= days[0].dateKey)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  if (weekWeights.length >= 2) {
    const change = weekWeights.at(-1)!.weightKg - weekWeights[0].weightKg;
    if (Math.abs(change) >= 0.5) {
      highlights.push({
        kind: 'informational',
        title: 'Weight trend',
        detail: `Your logged weight moved ${change < 0 ? 'down' : 'up'} ${Math.abs(change).toFixed(1)} kg over your ${weekWeights.length} weigh-ins this week.`,
      });
    }
  }

  const classified = days.reduce(
    (sum, day) => sum + day.ethiopianItems + day.otherItems,
    0,
  );
  const ethiopian = days.reduce((sum, day) => sum + day.ethiopianItems, 0);

  return {
    days,
    target,
    average,
    highlights,
    loggedDays: loggedDays.length,
    isEmpty: loggedDays.length === 0,
    ethiopianShare: classified > 0 ? ethiopian / classified : null,
  };
}

function divideNutrition(value: Nutrition, divisor: number): Nutrition {
  return {
    kcal: value.kcal / divisor,
    proteinG: value.proteinG / divisor,
    carbsG: value.carbsG / divisor,
    fatG: value.fatG / divisor,
    fiberG: (value.fiberG ?? 0) / divisor,
    sodiumMg: (value.sodiumMg ?? 0) / divisor,
  };
}
