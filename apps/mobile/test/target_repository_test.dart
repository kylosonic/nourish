import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/target_repository.dart';

import 'test_helpers.dart';

void main() {
  late AppDatabase db;
  late TargetRepository repository;

  /// Engine case 1 from the blueprint: M 30y 180cm 80kg, sedentary,
  /// maintain → 2140 kcal.
  const UserProfile completeProfile = UserProfile(
    language: AppLanguage.en,
    goal: Goal.maintainWeight,
    sex: Sex.male,
    age: 30,
    heightCm: 180,
    currentWeightKg: 80,
    activity: Activity.sedentary,
    onboardingComplete: true,
    currentOnboardingStep: 6,
  );

  const UserProfile incompleteProfile = UserProfile(
    language: AppLanguage.en,
    sex: Sex.male,
    age: 30,
    heightCm: 180,
    currentWeightKg: 80,
    activity: Activity.sedentary,
  );

  setUp(() async {
    db = await openSeededDb();
    repository = TargetRepository(db, TargetEngine());
  });

  tearDown(() async => db.close());

  group('TargetRepository derive + persist (TGT-01)', () {
    test('derives and stores the engine result', () async {
      final DailyTarget? saved = await repository.deriveAndSave(
        completeProfile,
      );
      expect(saved, isNotNull);
      expect(saved!.targetKcal, 2140);
      expect(saved.proteinG, 134); // 2140 × .25 / 4 = 133.75 → 134
      expect(saved.formulaVersion, TargetEngine.formulaVersion);

      final DailyTarget? latest = await repository.latest();
      expect(latest, isNotNull);
      expect(latest!.targetKcal, 2140);
    });

    test('incomplete profile derives nothing and stores nothing', () async {
      final DailyTarget? saved = await repository.deriveAndSave(
        incompleteProfile,
      );
      expect(saved, isNull, reason: 'engine must never guess');
      expect(await repository.history(), isEmpty);
    });

    test('re-derivation appends; history preserves the previous row', () async {
      await repository.deriveAndSave(completeProfile);
      final UserProfile heavier = completeProfile.copyWith(currentWeightKg: 85);
      final DailyTarget? second = await repository.deriveAndSave(heavier);
      expect(second, isNotNull);
      // 85 kg: BMR 1830 × 1.2 = 2196 → 2200.
      expect(second!.targetKcal, 2200);

      final List<DailyTarget> history = await repository.history();
      expect(history.length, 2, reason: 'append-only: two rows survive');
      expect(history.first.targetKcal, 2140, reason: 'old row untouched');
      expect(history.last.targetKcal, 2200);
      expect((await repository.latest())!.targetKcal, 2200);
    });

    test('loss goal with skipped pace defaults to the moderate path', () async {
      final UserProfile lossProfile = completeProfile.copyWith(
        goal: Goal.loseWeight,
        pace: null,
      );
      final DailyTarget? saved = await repository.deriveAndSave(lossProfile);
      expect(saved, isNotNull);
      // TDEE 2136; deficit max(0.15×2136, 500) = 500 → 1636 → 1640.
      expect(saved!.targetKcal, 1640);
    });
  });
}
