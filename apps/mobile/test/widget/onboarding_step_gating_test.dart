import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/core/formatters.dart';
import 'package:nourish_mobile/features/onboarding/onboarding_controller.dart';
import 'package:nourish_mobile/l10n/strings.dart';
import 'package:nourish_mobile/providers.dart';

import '../pump_app.dart';

Future<void> tapButton(WidgetTester tester, String label) async {
  await tester.tap(find.widgetWithText(NourishButton, label));
  await tester.pumpAndSettle();
}

Future<void> enterBodyField(
  WidgetTester tester,
  String label,
  String value,
) async {
  final Finder field = find.descendant(
    of: find.ancestor(
      of: find.text(label),
      matching: find.byType(NourishInputField),
    ),
    matching: find.byType(TextField),
  );
  await tester.enterText(field, value);
  await tester.pump();
}

/// Walks welcome → language → goal → body → activity for the given goal.
/// The app must already be pumped (at welcome).
Future<void> walkToActivity(
  WidgetTester tester, {
  Goal goal = Goal.loseWeight,
}) async {
  await tapButton(tester, Strings.getStarted); // welcome
  await tapButton(tester, Strings.continueLabel); // language
  await tester.tap(find.text(_goalLabel(goal)));
  await tester.pumpAndSettle();
  await tapButton(tester, Strings.nextLabel); // goal
  await enterBodyField(tester, 'AGE', '30');
  await enterBodyField(tester, 'HEIGHT', '170');
  await enterBodyField(tester, 'CURRENT WEIGHT', '70');
  await enterBodyField(tester, 'TARGET WEIGHT', '65');
  await tapButton(tester, Strings.continueLabel); // body
}

String _goalLabel(Goal goal) {
  switch (goal) {
    case Goal.loseWeight:
      return Strings.goalLoseWeight;
    case Goal.buildMuscle:
      return Strings.goalBuildMuscle;
    case Goal.maintainWeight:
      return Strings.goalMaintainWeight;
    case Goal.eatHealthier:
      return Strings.goalEatHealthier;
  }
}

void main() {
  group('ONB-01 welcome', () {
    testWidgets('shows both buttons; GET STARTED opens language',
        (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      expect(find.text(Strings.welcomeTitle), findsOneWidget);
      expect(find.text(Strings.welcomeSubtitle), findsOneWidget);
      expect(find.text(Strings.getStarted), findsOneWidget);
      expect(find.text(Strings.alreadyHaveAccount), findsOneWidget);

      await tapButton(tester, Strings.getStarted);
      expect(find.text(Strings.languageTitle), findsOneWidget);
      await harness.teardown(tester);
    });

    testWidgets('I ALREADY HAVE AN ACCOUNT opens the honest void (sign-in)',
        (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await tapButton(tester, Strings.alreadyHaveAccount);
      expect(find.text(Strings.honestVoidTitle('sign-in')), findsWidgets);
      expect(find.text(Strings.honestVoidBody('sign-in')), findsOneWidget);
      expect(find.text(Strings.continueWithoutAccount), findsOneWidget);
      await harness.teardown(tester);
    });
  });

  group('ONB-02 language', () {
    testWidgets(
        'English pre-selected; Amharic renders via the Ethiopic fallback; '
        'selection persists; back exits to welcome', (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await tapButton(tester, Strings.getStarted);

      // English pre-selected.
      final OnboardingState state = readProvider<OnboardingState>(
        tester,
        onboardingControllerProvider,
      );
      expect(state.profile?.language, AppLanguage.en);

      // Amharic renders (fallback chain keeps it from tofu; glyph-level
      // rendering is covered by the design-system theme smoke test).
      expect(find.text(Strings.languageAmharic), findsOneWidget);

      // Back from language → welcome (ONB-09 edge case).
      await tester.tap(find.byTooltip(Strings.backTooltip));
      await tester.pumpAndSettle();
      expect(find.text(Strings.welcomeTitle), findsOneWidget);

      // Re-enter, select Amharic, continue → selection persists.
      await tapButton(tester, Strings.getStarted);
      await tester.tap(find.text(Strings.languageAmharic));
      await tester.pumpAndSettle();
      await tapButton(tester, Strings.continueLabel);
      expect(find.text(Strings.goalTitle), findsOneWidget);
      final OnboardingState after = readProvider<OnboardingState>(
        tester,
        onboardingControllerProvider,
      );
      expect(after.profile?.language, AppLanguage.am);
      await harness.teardown(tester);
    });
  });

  group('ONB-03 goal', () {
    Future<void> openGoal(WidgetTester tester) async {
      await tapButton(tester, Strings.getStarted);
      await tapButton(tester, Strings.continueLabel);
    }

    testWidgets('Next disabled until selection; single selection; re-tap '
        'never deselects', (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await openGoal(tester);

      NourishButton next() => tester.widget<NourishButton>(
        find.widgetWithText(NourishButton, Strings.nextLabel),
      );
      expect(next().onPressed, isNull);

      await tester.tap(find.text(Strings.goalLoseWeight));
      await tester.pumpAndSettle();
      expect(next().onPressed, isNotNull);

      // Re-tap the selected card → still selected (no deselect-to-none).
      await tester.tap(find.text(Strings.goalLoseWeight));
      await tester.pumpAndSettle();
      expect(next().onPressed, isNotNull);

      // Switching selection keeps exactly one selected.
      await tester.tap(find.text(Strings.goalBuildMuscle));
      await tester.pumpAndSettle();
      final OnboardingState state = readProvider<OnboardingState>(
        tester,
        onboardingControllerProvider,
      );
      expect(state.profile?.goal, Goal.buildMuscle);
      await harness.teardown(tester);
    });

    testWidgets('Next advances to body', (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await openGoal(tester);
      await tester.tap(find.text(Strings.goalLoseWeight));
      await tester.pumpAndSettle();
      await tapButton(tester, Strings.nextLabel);
      expect(find.text(Strings.bodyTitle), findsOneWidget);
      await harness.teardown(tester);
    });
  });

  group('ONB-04 body', () {
    Future<void> openBody(WidgetTester tester) async {
      await tapButton(tester, Strings.getStarted);
      await tapButton(tester, Strings.continueLabel);
      await tester.tap(find.text(Strings.goalLoseWeight));
      await tester.pumpAndSettle();
      await tapButton(tester, Strings.nextLabel);
    }

    testWidgets('out-of-range values show field errors and block advancing',
        (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await openBody(tester);

      await enterBodyField(tester, 'AGE', '12');
      await enterBodyField(tester, 'HEIGHT', '99');
      await enterBodyField(tester, 'CURRENT WEIGHT', '70');
      await enterBodyField(tester, 'TARGET WEIGHT', '65');
      await tapButton(tester, Strings.continueLabel);

      expect(find.text(Strings.errorAgeRange), findsOneWidget);
      expect(find.text(Strings.errorHeightRange), findsOneWidget);
      // Still on the body step — cannot advance on invalid input.
      expect(find.text(Strings.bodyTitle), findsOneWidget);

      // Correct the values → advances.
      await enterBodyField(tester, 'AGE', '30');
      await enterBodyField(tester, 'HEIGHT', '170');
      await tapButton(tester, Strings.continueLabel);
      expect(find.text(Strings.activityTitle), findsOneWidget);
      await harness.teardown(tester);
    });

    testWidgets('weight out of range is blocked too', (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await openBody(tester);

      await enterBodyField(tester, 'AGE', '30');
      await enterBodyField(tester, 'HEIGHT', '170');
      await enterBodyField(tester, 'CURRENT WEIGHT', '10');
      await enterBodyField(tester, 'TARGET WEIGHT', '400');
      await tapButton(tester, Strings.continueLabel);

      expect(find.text(Strings.errorWeightRange), findsNWidgets(2));
      expect(find.text(Strings.bodyTitle), findsOneWidget);
      await harness.teardown(tester);
    });
  });

  group('ONB-05 activity', () {
    testWidgets('Moderate pre-selected; Athlete → pace (loss goal)',
        (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await walkToActivity(tester);

      final OnboardingState state = readProvider<OnboardingState>(
        tester,
        onboardingControllerProvider,
      );
      expect(state.profile?.activity, Activity.moderate);

      await tester.ensureVisible(find.text(Strings.activityAthlete));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.activityAthlete));
      await tester.pumpAndSettle();
      await tapButton(tester, Strings.continueLabel);
      expect(find.text(Strings.paceTitle), findsOneWidget);
      await harness.teardown(tester);
    });
  });

  group('ONB-06 pace', () {
    Future<void> openPace(WidgetTester tester) async {
      await walkToActivity(tester);
      await tapButton(tester, Strings.continueLabel); // activity → pace
    }

    testWidgets('Moderate pre-selected; Recommended + Requires discipline '
        'tags; Aggressive never pre-selected', (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await openPace(tester);

      final OnboardingState state = readProvider<OnboardingState>(
        tester,
        onboardingControllerProvider,
      );
      expect(state.profile?.pace, Pace.moderate);

      expect(
        find.text(Strings.paceRecommended.toUpperCase()),
        findsOneWidget,
      );
      expect(
        find.text(Strings.paceRequiresDiscipline.toUpperCase()),
        findsOneWidget,
      );

      await tester.ensureVisible(find.text(Strings.paceAggressive));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.paceAggressive));
      await tester.pumpAndSettle();
      await tapButton(tester, Strings.continueLabel);
      expect(find.text(Strings.foodPrefTitle), findsOneWidget);
      final OnboardingState after = readProvider<OnboardingState>(
        tester,
        onboardingControllerProvider,
      );
      expect(after.profile?.pace, Pace.aggressive);
      await harness.teardown(tester);
    });

    testWidgets('Skip advances without recording a pace', (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await openPace(tester);
      await tester.tap(find.text(Strings.skipLabel));
      await tester.pumpAndSettle();
      expect(find.text(Strings.foodPrefTitle), findsOneWidget);
      final OnboardingState state = readProvider<OnboardingState>(
        tester,
        onboardingControllerProvider,
      );
      expect(state.profile?.pace, isNull);
      await harness.teardown(tester);
    });

    testWidgets('pace is hidden for non-loss goals', (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await walkToActivity(tester, goal: Goal.maintainWeight);
      await tapButton(tester, Strings.continueLabel); // activity →
      expect(find.text(Strings.foodPrefTitle), findsOneWidget);
      expect(find.text(Strings.paceTitle), findsNothing);
      await harness.teardown(tester);
    });
  });

  group('ONB-07 food preference', () {
    testWidgets('Ethiopian pre-selected; Mixed → daily target',
        (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await walkToActivity(tester);
      await tapButton(tester, Strings.continueLabel); // pace (moderate)
      await tapButton(tester, Strings.continueLabel); // pace → food pref

      final OnboardingState state = readProvider<OnboardingState>(
        tester,
        onboardingControllerProvider,
      );
      expect(state.profile?.foodPreference, FoodPreference.ethiopian);

      await tester.ensureVisible(find.text(Strings.prefMixed));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.prefMixed));
      await tester.pumpAndSettle();
      await tapButton(tester, Strings.continueLabel);
      expect(find.text(Strings.yourDailyTarget), findsOneWidget);
      await harness.teardown(tester);
    });
  });

  group('ONB-08 daily target', () {
    testWidgets('rendered kcal equals engine output; START TRACKING → Home',
        (WidgetTester tester) async {
      final AppHarness harness = await pumpApp(tester);
      await walkToActivity(tester);
      await tester.ensureVisible(find.text(Strings.activityAthlete));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.activityAthlete));
      await tester.pumpAndSettle();
      await tapButton(tester, Strings.continueLabel); // activity → pace
      await tester.ensureVisible(find.text(Strings.paceAggressive));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.paceAggressive));
      await tester.pumpAndSettle();
      await tapButton(tester, Strings.continueLabel); // pace → food pref
      await tapButton(tester, Strings.continueLabel); // food pref → target

      final DailyTarget expected = TargetEngine().compute(
        const TargetEngineInput(
          sex: Sex.female,
          age: 30,
          heightCm: 170,
          weightKg: 70,
          goal: Goal.loseWeight,
          activity: Activity.athlete,
          pace: Pace.aggressive,
        ),
      );
      expect(find.text(formatKcalInt(expected.targetKcal)), findsOneWidget);
      expect(find.text('${expected.proteinG}g'), findsOneWidget);
      expect(find.text('${expected.carbsG}g'), findsOneWidget);
      expect(find.text('${expected.fatG}g'), findsOneWidget);

      await tapButton(tester, Strings.startTracking);
      // Home dashboard with the real engine target.
      expect(find.text('CALORIES LEFT'), findsOneWidget);
      await harness.teardown(tester);
    });
  });
}
