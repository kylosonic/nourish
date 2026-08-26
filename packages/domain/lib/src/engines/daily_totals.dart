import '../models/meal.dart';
import '../models/nutrition_totals.dart';

/// Sums every meal's item snapshots into a single day total.
NutritionTotals totalsFor(List<Meal> meals) {
  return meals.fold<NutritionTotals>(
    NutritionTotals.zero,
    (NutritionTotals acc, Meal meal) => acc + meal.totals,
  );
}
