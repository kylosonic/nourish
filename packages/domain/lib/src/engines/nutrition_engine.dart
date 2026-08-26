import '../models/nutrition.dart';

/// Computes a [NutritionSnapshot] for a specific weight (TGT-03).
///
/// `per100g * grams / 100`, with kcal and macro grams rounded to whole
/// numbers (half away from zero) and fiber/sodium kept at 1 decimal.
NutritionSnapshot nutritionFor(NutritionPer100g per100g, double grams) {
  final double factor = grams / 100;
  final double? fiberG =
      per100g.fiberG == null ? null : _roundTo1Decimal(per100g.fiberG! * factor);
  final double? sodiumMg = per100g.sodiumMg == null
      ? null
      : _roundTo1Decimal(per100g.sodiumMg! * factor);
  return NutritionSnapshot(
    kcal: (per100g.kcal * factor).roundToDouble(),
    proteinG: (per100g.proteinG * factor).roundToDouble(),
    carbsG: (per100g.carbsG * factor).roundToDouble(),
    fatG: (per100g.fatG * factor).roundToDouble(),
    fiberG: fiberG,
    sodiumMg: sodiumMg,
  );
}

/// Rounds half away from zero to one decimal place.
double _roundTo1Decimal(double value) => (value * 10).round() / 10;
