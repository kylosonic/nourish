/// Number formatting with the rounding rule pinned in the blueprint
/// (§9, TGT-03): round half away from zero.
///
/// Dart's `num.round()` already rounds half away from zero; the wrapper
/// makes the rule explicit and unit-testable rather than incidental.
library;

/// Rounds half away from zero (2.5 → 3, -2.5 → -3).
num roundHalfAwayFromZero(num value) => value.round();

/// Whole-kcal display, e.g. `225`.
String formatKcal(double kcal) => '${kcal.round()}';

/// Whole-kcal display from an int value.
String formatKcalInt(int kcal) => '$kcal';

/// Whole-gram display, e.g. `150`.
String formatGrams(double grams) => '${grams.round()}';

/// Liters with at most two decimals and at least one, e.g. 3000 → `3.0`,
/// 250 → `0.25`, 1250 → `1.25`.
String formatLiters(int ml) {
  final String fixed = (ml / 1000).toStringAsFixed(2);
  return fixed.endsWith('0') ? fixed.substring(0, fixed.length - 1) : fixed;
}

/// Liters from a double value (e.g. 3.0 → `3.0`).
String formatLitersFromDouble(double liters) =>
    formatLiters((liters * 1000).round());
