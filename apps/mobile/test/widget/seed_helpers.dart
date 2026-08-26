import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/target_repository.dart';

/// A complete onboarding-answer profile (engine-valid inputs) with
/// onboarding already marked complete — the standard fixture for
/// post-onboarding screens.
UserProfile answerProfile({Goal goal = Goal.maintainWeight}) {
  return UserProfile(
    language: AppLanguage.en,
    goal: goal,
    sex: Sex.female,
    age: 30,
    heightCm: 170,
    currentWeightKg: 70,
    targetWeightKg: 70,
    activity: Activity.moderate,
    pace: goal == Goal.loseWeight ? Pace.moderate : null,
    foodPreference: FoodPreference.ethiopian,
    onboardingComplete: true,
    currentOnboardingStep: 6,
  );
}

/// Derives and persists the daily target for [answers]; returns it.
Future<DailyTarget> seedTarget(AppDatabase db, UserProfile answers) async {
  final TargetRepository repository = TargetRepository(db, TargetEngine());
  final DailyTarget? target = await repository.deriveAndSave(answers);
  return target!;
}

/// A synthetic test food: 100g portion, [kcal] per 100g, so a default
/// portion of 1×100g snapshots exactly [kcal].
Food testFood({
  String id = 'test_food',
  String name = 'Test Food',
  double kcal = 760,
  double proteinG = 8,
  double carbsG = 65,
  double fatG = 14,
}) {
  return Food(
    id: id,
    canonicalName: name,
    category: 'Ethiopian',
    defaultPortion: const Portion(unit: PortionUnit.grams, grams: 100),
    portions: const <Portion>[Portion(unit: PortionUnit.grams, grams: 100)],
    per100g: NutritionPer100g(
      kcal: kcal,
      proteinG: proteinG,
      carbsG: carbsG,
      fatG: fatG,
    ),
    source: const FoodSource(name: 'test', version: '1'),
  );
}
