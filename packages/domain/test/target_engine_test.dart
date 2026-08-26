import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

void main() {
  final TargetEngine engine = TargetEngine();
  final DateTime fixedNow = DateTime(2026, 8, 26, 12, 0, 0);

  const TargetEngineInput male30 = TargetEngineInput(
    sex: Sex.male,
    age: 30,
    heightCm: 180,
    weightKg: 80,
    goal: Goal.maintainWeight,
    activity: Activity.sedentary,
  );

  const TargetEngineInput female25 = TargetEngineInput(
    sex: Sex.female,
    age: 25,
    heightCm: 165,
    weightKg: 60,
    goal: Goal.maintainWeight,
    activity: Activity.moderate,
  );

  test('1: M 30y 180cm 80kg, sedentary, maintain -> 2140 kcal', () {
    final DailyTarget target = engine.compute(male30, now: fixedNow);
    expect(target.targetKcal, 2140);
    expect(target.bmrKcal, closeTo(1780.0, 1e-9));
    expect(target.tdeeKcal, closeTo(2136.0, 1e-9));
    expect(target.goalAdjustmentKcal, closeTo(0.0, 1e-9));
    expect(target.floorKcal, 1500);
  });

  test('2: F 25y 165cm 60kg, moderate, maintain -> 2090 kcal', () {
    final DailyTarget target = engine.compute(female25, now: fixedNow);
    expect(target.targetKcal, 2090);
    expect(target.bmrKcal, closeTo(1345.25, 1e-9));
    expect(target.tdeeKcal, closeTo(2085.1375, 1e-9));
    expect(target.goalAdjustmentKcal, closeTo(0.0, 1e-9));
    expect(target.floorKcal, 1200);
  });

  test('3: case 2 + lose weight, moderate pace -> 1590 kcal', () {
    const TargetEngineInput input = TargetEngineInput(
      sex: Sex.female,
      age: 25,
      heightCm: 165,
      weightKg: 60,
      goal: Goal.loseWeight,
      activity: Activity.moderate,
      pace: Pace.moderate,
    );
    final DailyTarget target = engine.compute(input, now: fixedNow);
    expect(target.targetKcal, 1590);
    expect(target.goalAdjustmentKcal, closeTo(-500.0, 1e-9));
    expect(target.pace, Pace.moderate);
    expect(target.floorKcal, 1200);
  });

  test('4: F 45y 150cm 45kg, sedentary, lose, aggressive -> clamped 1200', () {
    const TargetEngineInput input = TargetEngineInput(
      sex: Sex.female,
      age: 45,
      heightCm: 150,
      weightKg: 45,
      goal: Goal.loseWeight,
      activity: Activity.sedentary,
      pace: Pace.aggressive,
    );
    final DailyTarget target = engine.compute(input, now: fixedNow);
    expect(target.targetKcal, 1200);
    expect(target.bmrKcal, closeTo(1001.5, 1e-9));
    expect(target.tdeeKcal, closeTo(1201.8, 1e-9));
    expect(target.goalAdjustmentKcal, closeTo(-1000.0, 1e-9));
    expect(target.floorKcal, 1200);
  });

  test('5: M 60y 170cm 60kg, sedentary, lose, aggressive -> clamped 1500', () {
    const TargetEngineInput input = TargetEngineInput(
      sex: Sex.male,
      age: 60,
      heightCm: 170,
      weightKg: 60,
      goal: Goal.loseWeight,
      activity: Activity.sedentary,
      pace: Pace.aggressive,
    );
    final DailyTarget target = engine.compute(input, now: fixedNow);
    expect(target.targetKcal, 1500);
    expect(target.bmrKcal, closeTo(1367.5, 1e-9));
    expect(target.tdeeKcal, closeTo(1641.0, 1e-9));
    expect(target.goalAdjustmentKcal, closeTo(-1000.0, 1e-9));
    expect(target.floorKcal, 1500);
  });

  test('6: case 1 + build muscle -> 2350 kcal', () {
    const TargetEngineInput input = TargetEngineInput(
      sex: Sex.male,
      age: 30,
      heightCm: 180,
      weightKg: 80,
      goal: Goal.buildMuscle,
      activity: Activity.sedentary,
    );
    final DailyTarget target = engine.compute(input, now: fixedNow);
    expect(target.targetKcal, 2350);
    expect(target.goalAdjustmentKcal, closeTo(213.6, 1e-9));
  });

  test('7: case 1 + eat healthier -> 2140 kcal (equals maintain)', () {
    const TargetEngineInput input = TargetEngineInput(
      sex: Sex.male,
      age: 30,
      heightCm: 180,
      weightKg: 80,
      goal: Goal.eatHealthier,
      activity: Activity.sedentary,
    );
    final DailyTarget target = engine.compute(input, now: fixedNow);
    expect(target.targetKcal, 2140);
    expect(target.goalAdjustmentKcal, closeTo(0.0, 1e-9));
  });

  test('8: determinism - same inputs twice yields identical DailyTarget', () {
    final DailyTarget first = engine.compute(male30, now: fixedNow);
    final DailyTarget second = engine.compute(male30, now: fixedNow);

    expect(second.targetKcal, first.targetKcal);
    expect(second.proteinG, first.proteinG);
    expect(second.carbsG, first.carbsG);
    expect(second.fatG, first.fatG);
    expect(second.bmrKcal, first.bmrKcal);
    expect(second.tdeeKcal, first.tdeeKcal);
    expect(second.goalAdjustmentKcal, first.goalAdjustmentKcal);
    expect(second.activityFactor, first.activityFactor);
    expect(second.pace, first.pace);
    expect(second.formulaVersion, first.formulaVersion);
    expect(second.dateGenerated, first.dateGenerated);
    expect(second.floorKcal, first.floorKcal);
  });

  test('9: age 12 throws TargetEngineInputException', () {
    const TargetEngineInput input = TargetEngineInput(
      sex: Sex.male,
      age: 12,
      heightCm: 180,
      weightKg: 80,
      goal: Goal.maintainWeight,
      activity: Activity.sedentary,
    );
    expect(
      () => engine.compute(input),
      throwsA(isA<TargetEngineInputException>()),
    );
  });

  test('10: height 99 throws TargetEngineInputException', () {
    const TargetEngineInput input = TargetEngineInput(
      sex: Sex.male,
      age: 30,
      heightCm: 99,
      weightKg: 80,
      goal: Goal.maintainWeight,
      activity: Activity.sedentary,
    );
    expect(
      () => engine.compute(input),
      throwsA(isA<TargetEngineInputException>()),
    );
  });

  test('11: macros at target 2000 -> protein 125, carbs 225, fat 67', () {
    // M 30y 174cm 72kg, sedentary, maintain: BMR 1662.5 -> TDEE 1995
    // -> rounds to exactly 2000 kcal.
    const TargetEngineInput input = TargetEngineInput(
      sex: Sex.male,
      age: 30,
      heightCm: 174,
      weightKg: 72,
      goal: Goal.maintainWeight,
      activity: Activity.sedentary,
    );
    final DailyTarget target = engine.compute(input, now: fixedNow);
    expect(target.targetKcal, 2000);
    expect(target.proteinG, 125);
    expect(target.carbsG, 225);
    expect(target.fatG, 67);
  });

  test('12: lose weight with pace skipped defaults to moderate (500) path', () {
    const TargetEngineInput input = TargetEngineInput(
      sex: Sex.female,
      age: 25,
      heightCm: 165,
      weightKg: 60,
      goal: Goal.loseWeight,
      activity: Activity.moderate,
    );
    final DailyTarget target = engine.compute(input, now: fixedNow);
    expect(target.pace, isNull);
    // 0.15 * TDEE = 312.77 < 500, so the default moderate deficit wins.
    expect(target.goalAdjustmentKcal, closeTo(-500.0, 1e-9));
    expect(target.targetKcal, 1590);
  });
}
