import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/providers.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

void main() {
  group('HOME-01/02 calorie ring math', () {
    testWidgets('Calories Left = target − consumed; ring fraction correct',
        (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      final DailyTarget target = await seedTarget(db, answers);
      await MealRepository(db).saveMeal(
        MealSlot.lunch,
        <MealItemDraft>[
          MealItemDraft(
            food: testFood(kcal: 760),
            unit: PortionUnit.grams,
            quantity: 1,
          ),
        ],
      );

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      expect(find.text('CALORIES LEFT'), findsOneWidget);
      expect(find.text('${target.targetKcal - 760}'), findsOneWidget);
      expect(
        find.textContaining('/ ${target.targetKcal} kcal'),
        findsOneWidget,
      );
      // Macro pills reflect leftovers from the target.
      expect(
        find.textContaining('${target.proteinG - 8}g left'),
        findsOneWidget,
      );
      await harness.teardown(tester);
    });

    testWidgets('over-target day: negative left + OVER TARGET treatment',
        (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      final DailyTarget target = await seedTarget(db, answers);
      await MealRepository(db).saveMeal(
        MealSlot.dinner,
        <MealItemDraft>[
          MealItemDraft(
            food: testFood(kcal: (target.targetKcal + 500).toDouble()),
            unit: PortionUnit.grams,
            quantity: 1,
          ),
        ],
      );

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      expect(find.text('OVER TARGET'), findsOneWidget);
      expect(find.text('-500'), findsOneWidget);
      await harness.teardown(tester);
    });

    testWidgets('missing target → setup prompt, never invented zeroes',
        (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final AppHarness harness = await pumpApp(
        tester,
        profile: answerProfile(),
        db: db,
      );

      expect(find.text('Your daily target isn\'t set up yet'), findsOneWidget);
      expect(find.text('CALORIES LEFT'), findsNothing);
      await harness.teardown(tester);
    });
  });

  group('HomeDashboardData ring fraction (HOME-02 clamp)', () {
    test('clamped to 1.0 when over target (no >100% wrap)', () {
      const HomeDashboardData over = HomeDashboardData(
        targetKcal: 2000,
        consumedKcal: 2500,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        waterMl: 0,
      );
      expect(over.ringFraction, 1.0);
      expect(over.isOverTarget, isTrue);
      expect(over.caloriesLeft, -500);
    });

    test('zero when the target is missing', () {
      const HomeDashboardData missing = HomeDashboardData(
        targetKcal: null,
        consumedKcal: 0,
        proteinG: null,
        carbsG: null,
        fatG: null,
        waterMl: 0,
      );
      expect(missing.ringFraction, 0);
      expect(missing.caloriesLeft, isNull);
    });

    test('proportional when under target', () {
      const HomeDashboardData mid = HomeDashboardData(
        targetKcal: 2000,
        consumedKcal: 500,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        waterMl: 0,
      );
      expect(mid.ringFraction, 0.25);
      expect(mid.caloriesLeft, 1500);
    });
  });
}
