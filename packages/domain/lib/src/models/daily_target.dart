import 'pace.dart';

/// A computed daily calorie and macro target (TGT-01).
///
/// Targets are append-only history rows: re-derivation on any input
/// change writes a new row with a new [dateGenerated] (blueprint 8.7).
class DailyTarget {
  DailyTarget({
    required this.targetKcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.bmrKcal,
    required this.tdeeKcal,
    required this.goalAdjustmentKcal,
    required this.activityFactor,
    required this.pace,
    required this.formulaVersion,
    required this.dateGenerated,
    required this.floorKcal,
  });

  /// Final daily calorie target, clamped and rounded to the nearest
  /// 10 kcal.
  final int targetKcal;

  /// Protein grams (25% of target divided by 4).
  final int proteinG;

  /// Carbohydrate grams (45% of target divided by 4).
  final int carbsG;

  /// Fat grams (30% of target divided by 9).
  final int fatG;

  /// Raw Mifflin-St Jeor basal metabolic rate.
  final double bmrKcal;

  /// BMR times activity factor.
  final double tdeeKcal;

  /// Adjustment applied to TDEE (negative deficit, positive surplus,
  /// zero for maintenance).
  final double goalAdjustmentKcal;

  /// The activity multiplier used.
  final double activityFactor;

  /// The weight-loss pace used (null when the goal involved no pace).
  final Pace? pace;

  /// Identifies the formula set that produced this target.
  final String formulaVersion;

  /// When this target was generated.
  final DateTime dateGenerated;

  /// Minimum calorie floor applied for the user's sex (PPA-3).
  final int floorKcal;
}
