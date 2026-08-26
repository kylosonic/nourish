import 'dart:math' as math;

import '../models/activity.dart';
import '../models/daily_target.dart';
import '../models/goal.dart';
import '../models/pace.dart';
import '../models/sex.dart';

/// Validated inputs for [TargetEngine.compute].
class TargetEngineInput {
  const TargetEngineInput({
    required this.sex,
    required this.age,
    required this.heightCm,
    required this.weightKg,
    required this.goal,
    required this.activity,
    this.pace,
  });

  final Sex sex;
  final int age;
  final double heightCm;
  final double weightKg;
  final Goal goal;
  final Activity activity;

  /// Weight-loss pace; defaults to the moderate (500 kcal) path when null
  /// for the lose-weight goal (ONB-06 Skip).
  final Pace? pace;
}

/// Thrown when inputs fall outside the validated safety ranges (PPA-3).
///
/// The engine never fabricates numbers: invalid input is refused.
class TargetEngineInputException implements Exception {
  const TargetEngineInputException(this.message);

  final String message;

  @override
  String toString() => 'TargetEngineInputException: $message';
}

/// Computes daily calorie and macro targets (TGT-01, blueprint section 8).
///
/// BMR uses Mifflin-St Jeor; TDEE is BMR times the activity factor;
/// goal adjustments and safety floors per the S0 spec.
class TargetEngine {
  /// Identifies the formula set (Mifflin-St Jeor + S0 macro split).
  static const String formulaVersion = 'mifflin-2026-s0';

  /// Safety floors (PPA-3): never below these, even on Aggressive pace.
  static const int femaleFloorKcal = 1200;
  static const int maleFloorKcal = 1500;

  /// Macro split of the final target: 25% protein / 45% carbs / 30% fat.
  static const double proteinFraction = 0.25;
  static const double carbsFraction = 0.45;
  static const double fatFraction = 0.30;

  /// Percent-of-TDEE minimum deficit for the lose-weight goal.
  static const double minDeficitFraction = 0.15;

  /// Surplus applied to TDEE for the build-muscle goal.
  static const double muscleSurplusFraction = 0.10;

  /// Calories per gram of each macronutrient.
  static const double kcalPerGramProtein = 4;
  static const double kcalPerGramCarbs = 4;
  static const double kcalPerGramFat = 9;

  /// Computes a [DailyTarget] for [input], throwing
  /// [TargetEngineInputException] on out-of-range inputs.
  ///
  /// [now] is injectable for deterministic tests; defaults to
  /// [DateTime.now].
  DailyTarget compute(TargetEngineInput input, {DateTime? now}) {
    _validate(input);

    final double bmr = _bmr(input);
    final double tdee = bmr * input.activity.factor;
    final int floorKcal =
        input.sex == Sex.male ? maleFloorKcal : femaleFloorKcal;
    final double goalAdjustment = _goalAdjustment(input.goal, tdee, input.pace);

    final double rawTarget = tdee + goalAdjustment;
    final double clamped = rawTarget < floorKcal ? floorKcal.toDouble() : rawTarget;
    final int targetKcal = _roundToNearest10(clamped);

    return DailyTarget(
      targetKcal: targetKcal,
      proteinG: _macroGrams(targetKcal, proteinFraction, kcalPerGramProtein),
      carbsG: _macroGrams(targetKcal, carbsFraction, kcalPerGramCarbs),
      fatG: _macroGrams(targetKcal, fatFraction, kcalPerGramFat),
      bmrKcal: bmr,
      tdeeKcal: tdee,
      goalAdjustmentKcal: goalAdjustment,
      activityFactor: input.activity.factor,
      pace: input.pace,
      formulaVersion: formulaVersion,
      dateGenerated: now ?? DateTime.now(),
      floorKcal: floorKcal,
    );
  }

  void _validate(TargetEngineInput input) {
    if (input.age < 18 || input.age > 100) {
      throw TargetEngineInputException('age must be in 18-100, got ${input.age}');
    }
    if (input.heightCm < 100 || input.heightCm > 250) {
      throw TargetEngineInputException(
          'heightCm must be in 100-250, got ${input.heightCm}');
    }
    if (input.weightKg < 30 || input.weightKg > 350) {
      throw TargetEngineInputException(
          'weightKg must be in 30-350, got ${input.weightKg}');
    }
  }

  /// Mifflin-St Jeor BMR: male `10w + 6.25h - 5a + 5`,
  /// female `10w + 6.25h - 5a - 161`.
  double _bmr(TargetEngineInput input) {
    final double base =
        10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
    return input.sex == Sex.male ? base + 5 : base - 161;
  }

  /// Goal adjustment relative to TDEE.
  ///
  /// Lose weight: deficit = max(0.15 * TDEE, pace kcal/day), defaulting
  /// to 500 when pace was skipped. Build muscle: +10%. Maintain and eat
  /// healthier: zero.
  double _goalAdjustment(Goal goal, double tdee, Pace? pace) {
    switch (goal) {
      case Goal.loseWeight:
        // Pace stores negative kcal values; compare magnitudes against
        // the 15%-of-TDEE floor, then apply the deficit as a subtraction.
        final double paceDeficit = (pace?.kcalPerDay ?? Pace.moderate.kcalPerDay)
            .abs()
            .toDouble();
        final double deficit = math.max(minDeficitFraction * tdee, paceDeficit);
        return -deficit;
      case Goal.buildMuscle:
        return muscleSurplusFraction * tdee;
      case Goal.maintainWeight:
      case Goal.eatHealthier:
        return 0;
    }
  }

  /// Rounds half away from zero to the nearest 10.
  int _roundToNearest10(double value) => (value / 10).round() * 10;

  /// Macro grams for the given fraction of target, rounded half away
  /// from zero to whole grams.
  int _macroGrams(int targetKcal, double fraction, double kcalPerGram) =>
      (targetKcal * fraction / kcalPerGram).round();
}
