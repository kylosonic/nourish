import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';
import 'package:nourish_mobile/core/date_utils.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/data/repositories/onboarding_repository.dart';
import 'package:nourish_mobile/features/recommendations/recommendation_providers.dart';
import 'package:nourish_mobile/features/recommendations/what_can_i_eat_screen.dart';
import 'package:nourish_mobile/l10n/strings.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

/// INS-03 acceptance through the real UI over the real seeded catalog: the
/// budget comes from the user's own target and logs, every suggestion fits it,
/// and both dead ends (no budget, nothing fits) are stated instead of filled
/// with invented food.
void main() {
  Finder onScreen(Finder finder) => find.descendant(
    of: find.byType(WhatCanIEatScreen),
    matching: finder,
  );

  Future<void> pumpUntilFound(
    WidgetTester tester,
    Finder finder, {
    int attempts = 60,
  }) async {
    for (int i = 0; i < attempts; i++) {
      await tester.pump(const Duration(milliseconds: 25));
      if (finder.evaluate().isNotEmpty) return;
    }
    await tester.pumpAndSettle();
  }

  Future<void> scrollTo(WidgetTester tester, Finder finder) async {
    await tester.scrollUntilVisible(
      finder,
      200,
      scrollable: find
          .descendant(
            of: find.byType(WhatCanIEatScreen),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await tester.pumpAndSettle();
  }

  /// An install with onboarding answers really persisted, so the target and the
  /// food preference come from the profile row.
  Future<AppHarness> pumpAnsweredInstall(
    WidgetTester tester, {
    UserProfile? profile,
  }) async {
    final AppDatabase db = await openSeededDb();
    final UserProfile answers = profile ?? answerProfile();
    final OnboardingRepository onboarding = OnboardingRepository(db);
    await onboarding.getOrCreate();
    await onboarding.updateProfile(answers);
    await seedTarget(db, answers);
    return pumpApp(tester, db: db, profile: answers);
  }

  /// Open the screen the way a user does: from the Home dashboard card.
  Future<void> openScreen(WidgetTester tester) async {
    await tester.scrollUntilVisible(
      find.text(Strings.whatCanIEatEntryAction),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text(Strings.whatCanIEatEntryAction));
    await pumpUntilFound(tester, onScreen(find.text(Strings.whatCanIEatSubtitle)));
  }

  /// Log one meal of [kcal] today, so the remaining budget moves.
  Future<void> logMeal(AppDatabase db, double kcal) async {
    await MealRepository(db).saveMeal(
      MealSlot.lunch,
      <MealItemDraft>[
        MealItemDraft(
          food: testFood(id: 'ins03_food', name: 'Test Food', kcal: kcal),
          unit: PortionUnit.grams,
          quantity: 1,
        ),
      ],
      dateKey: todayDateKey(),
    );
  }

  testWidgets('suggestions come from the catalog and fit the remaining budget',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpAnsweredInstall(tester);

    await openScreen(tester);

    // The fields are prefilled with the user's own remaining budget.
    final RemainingBudget budget = readProvider(tester, remainingBudgetProvider);
    expect(onScreen(find.text('${budget.remainingKcal}')), findsOneWidget);

    await scrollTo(tester, onScreen(find.text(Strings.whatCanIEatRankedTitle)));
    expect(onScreen(find.text(Strings.whatCanIEatRankedTitle)), findsOneWidget);

    // Every listed suggestion states its own calories and protein, and none of
    // them exceeds the budget it was chosen against.
    final Iterable<Element> lines = onScreen(
      find.textContaining('kcal ·'),
    ).evaluate();
    expect(
      lines,
      isNotEmpty,
      reason: 'the seeded catalog has foods that fit a normal daily budget',
    );
    for (final Element element in lines) {
      final String text = (element.widget as Text).data!;
      final int kcal = int.parse(text.split(' ').first);
      expect(kcal, lessThanOrEqualTo(budget.remainingKcal));
    }

    await harness.teardown(tester);
  });

  testWidgets('a budget that nothing fits states the gap, not a fake food',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpAnsweredInstall(tester);

    await openScreen(tester);

    // The field's label is rendered uppercased by NourishInputField, so scroll
    // to the field itself.
    await scrollTo(tester, onScreen(find.byType(TextField)).first);
    await tester.enterText(onScreen(find.byType(TextField)).first, '1');
    await scrollTo(tester, onScreen(find.text(Strings.whatCanIEatSuggest)));
    await tester.tap(onScreen(find.text(Strings.whatCanIEatSuggest)));
    await tester.pumpAndSettle();

    await scrollTo(tester, onScreen(find.text(Strings.whatCanIEatNothingFits)));
    expect(onScreen(find.text(Strings.whatCanIEatNothingFits)), findsOneWidget);
    expect(onScreen(find.text(Strings.whatCanIEatClosestTitle)), findsOneWidget);
    // The closest options explain how far over they are.
    expect(onScreen(find.textContaining('kcal over')), findsWidgets);

    await harness.teardown(tester);
  });

  testWidgets('a spent budget is stated instead of suggesting more food',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpAnsweredInstall(tester);
    // Log well past the target, so nothing is left today.
    await logMeal(harness.db, 5000);

    await openScreen(tester);

    await scrollTo(tester, onScreen(find.text(Strings.whatCanIEatNoBudget)));
    expect(onScreen(find.text(Strings.whatCanIEatNoBudget)), findsOneWidget);
    expect(onScreen(find.text(Strings.whatCanIEatRankedTitle)), findsNothing);

    await harness.teardown(tester);
  });

  testWidgets('a target at the safe floor says so rather than suggesting less',
      (WidgetTester tester) async {
    // Lose weight on an aggressive pace at a small body size: the engine clamps
    // the target to the SAFE-01 floor.
    final UserProfile answers = UserProfile(
      language: AppLanguage.en,
      goal: Goal.loseWeight,
      sex: Sex.female,
      age: 60,
      heightCm: 150,
      currentWeightKg: 45,
      targetWeightKg: 42,
      activity: Activity.sedentary,
      pace: Pace.aggressive,
      foodPreference: FoodPreference.ethiopian,
      onboardingComplete: true,
      currentOnboardingStep: 6,
    );
    final AppHarness harness = await pumpAnsweredInstall(
      tester,
      profile: answers,
    );
    final DailyTarget target = await seedTarget(harness.db, answers);
    expect(
      target.targetKcal,
      target.floorKcal,
      reason: 'the fixture must actually be clamped for this test to mean '
          'anything',
    );
    await logMeal(harness.db, target.targetKcal.toDouble());

    await openScreen(tester);

    await scrollTo(
      tester,
      onScreen(find.text(Strings.whatCanIEatNoBudgetAtFloor)),
    );
    expect(
      onScreen(find.text(Strings.whatCanIEatNoBudgetAtFloor)),
      findsOneWidget,
    );

    await harness.teardown(tester);
  });
}
