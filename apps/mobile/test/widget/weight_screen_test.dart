import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';
import 'package:nourish_mobile/core/date_utils.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/onboarding_repository.dart';
import 'package:nourish_mobile/data/repositories/weight_repository.dart';
import 'package:nourish_mobile/features/weight/weight_providers.dart';
import 'package:nourish_mobile/features/weight/weight_screen.dart';
import 'package:nourish_mobile/l10n/strings.dart';
import 'package:nourish_mobile/router/routes.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

/// WW-03 acceptance through the real UI: an entry is stored and shown, an
/// invalid value is rejected at the field without writing anything, the
/// weekly/monthly views really change the window, and nothing is shown as a
/// number the user did not enter.
void main() {
  /// Restricts a finder to the weight screen.
  ///
  /// The dashboard that pushed this route is still mounted underneath it, and
  /// it carries its own weight card, so an unscoped `find.text('Weight')` would
  /// match both trees.
  Finder onScreen(Finder finder) =>
      find.descendant(of: find.byType(WeightScreen), matching: finder);

  /// Pump until [finder] matches.
  ///
  /// The trend is a FutureProvider over the local database, and
  /// `pumpAndSettle` only pumps frames — it does not wait for a future that has
  /// not scheduled one. Waiting on the finder is what makes these deterministic.
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

  /// Scrolls the weight screen (not the dashboard beneath it) until [finder]
  /// is on screen. The screen is a lazy list, so lower sections are not built
  /// until they are scrolled into view.
  Future<void> scrollTo(WidgetTester tester, Finder finder) async {
    await tester.scrollUntilVisible(
      finder,
      200,
      scrollable: find
          .descendant(
            of: find.byType(WeightScreen),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await tester.pumpAndSettle();
  }

  /// Reach `/weight` the way a user does: from the Home dashboard card.
  Future<void> openWeightScreen(WidgetTester tester) async {
    await tester.scrollUntilVisible(
      find.text(Strings.weightTitle),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text(Strings.weightLogTitle.toUpperCase()));
    await pumpUntilFound(tester, onScreen(find.text(Strings.weightLogTitle)));
  }

  /// Pumps the app the way a finished install looks: the profile row really
  /// holds the onboarding answers, so the target weight on this screen comes
  /// from the database rather than from a test-only notifier.
  Future<AppHarness> pumpAnsweredInstall(WidgetTester tester) async {
    final AppDatabase db = await openSeededDb();
    final UserProfile profile = answerProfile();
    final OnboardingRepository onboarding = OnboardingRepository(db);
    await onboarding.getOrCreate();
    await onboarding.updateProfile(profile);
    return pumpApp(tester, db: db, profile: profile);
  }

  testWidgets('an empty history is stated, not filled with a default',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpAnsweredInstall(tester);

    await openWeightScreen(tester);

    expect(onScreen(find.text(Strings.weightTitle)), findsOneWidget);
    expect(onScreen(find.text(Strings.weightNoEntries)), findsOneWidget);
    expect(onScreen(find.text(Strings.weightTrendEmpty)), findsOneWidget);
    // The target comes from the onboarding profile (70 kg in this fixture).
    expect(onScreen(find.text('70.0 kg')), findsOneWidget);
    // No chart: an empty window has no bars to draw.
    expect(onScreen(find.byType(WeightTrendChart)), findsNothing);

    await scrollTo(tester, onScreen(find.text(Strings.weightHistoryEmpty)));
    expect(onScreen(find.text(Strings.weightHistoryEmpty)), findsOneWidget);

    await harness.teardown(tester);
  });

  testWidgets('a logged weight is stored, listed and summarised',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpAnsweredInstall(tester);

    await openWeightScreen(tester);

    await scrollTo(tester, onScreen(find.byType(TextField)));
    await tester.enterText(onScreen(find.byType(TextField)), '68.5');
    await tester.pump();
    await scrollTo(tester, onScreen(find.text(Strings.weightLogAction)));
    await tester.tap(onScreen(find.text(Strings.weightLogAction)));
    await tester.pumpAndSettle();

    // The row is in the table, not only on screen.
    final WeightRepository repository = WeightRepository(harness.db);
    expect((await repository.history()).single.weightKg, 68.5);
    expect((await repository.latest())!.dateKey, todayDateKey());

    // And the screen reads it back: one history row, and a chart for the day.
    await pumpUntilFound(tester, onScreen(find.text('68.5 kg')));
    expect(find.text(Strings.weightSaved), findsOneWidget);
    expect(onScreen(find.text('68.5 kg')), findsOneWidget);
    expect(onScreen(find.byType(WeightTrendChart)), findsOneWidget);
    expect(onScreen(find.text(Strings.weightHistoryEmpty)), findsNothing);

    await harness.teardown(tester);
  });

  testWidgets('input outside the SAFE-01 range is refused at the field',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpAnsweredInstall(tester);

    await openWeightScreen(tester);

    await scrollTo(tester, onScreen(find.byType(TextField)));
    await tester.enterText(onScreen(find.byType(TextField)), '500');
    await tester.pump();
    await scrollTo(tester, onScreen(find.text(Strings.weightLogAction)));
    await tester.tap(onScreen(find.text(Strings.weightLogAction)));
    await tester.pumpAndSettle();

    expect(
      onScreen(find.text('Enter a weight between 30 and 350 kg.')),
      findsOneWidget,
    );
    expect(
      await WeightRepository(harness.db).history(),
      isEmpty,
      reason: 'a rejected value never reaches the database',
    );
    expect(find.text(Strings.weightSaved), findsNothing);

    await harness.teardown(tester);
  });

  testWidgets('the monthly view widens the window the weekly view sets',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpAnsweredInstall(tester);

    // Twenty days back: inside MONTH, outside WEEK.
    final DateTime twentyDaysAgo = DateTime.now().subtract(
      const Duration(days: 20),
    );
    await WeightRepository(harness.db).log(
      weightKg: 74,
      dateKey: dateKeyFor(twentyDaysAgo),
      loggedAt: twentyDaysAgo,
    );

    await openWeightScreen(tester);

    Finder oldEntryBar() => onScreen(
      find.byTooltip(
        '${dateKeyFor(twentyDaysAgo)} · ${Strings.weightKgValue('74.0')}',
      ),
    );

    // WEEK is the default: the older entry is outside it.
    expect(onScreen(find.text('WEEK')), findsOneWidget);
    expect(
      oldEntryBar(),
      findsNothing,
      reason: 'a 20-day-old entry is outside the weekly window',
    );

    await tester.tap(onScreen(find.text('MONTH')));
    await pumpUntilFound(tester, oldEntryBar());

    expect(
      oldEntryBar(),
      findsOneWidget,
      reason: 'the monthly window includes it',
    );

    await harness.teardown(tester);
  });

  testWidgets('the window selection is held in the provider, not the widget',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpAnsweredInstall(tester);

    await openWeightScreen(tester);
    await tester.tap(onScreen(find.text('MONTH')));
    await tester.pumpAndSettle();

    expect(
      readProvider(tester, selectedWeightWindowProvider),
      WeightWindow.month,
    );

    await harness.teardown(tester);
  });

  testWidgets('the dashboard card follows an entry logged on the screen',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpAnsweredInstall(tester);

    // The card and the screen read the same provider, so the card must not
    // still be claiming "not logged yet" after an entry is saved.
    expect(find.text(Strings.weightNoEntries), findsOneWidget);

    await openWeightScreen(tester);
    await scrollTo(tester, onScreen(find.byType(TextField)));
    await tester.enterText(onScreen(find.byType(TextField)), '68.5');
    await tester.pump();
    await scrollTo(tester, onScreen(find.text(Strings.weightLogAction)));
    await tester.tap(onScreen(find.text(Strings.weightLogAction)));
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip(Strings.backTooltip));
    // Let the pop transition finish: the outgoing route is still in the tree
    // mid-animation, and its own "68.5 kg" row would satisfy a text finder.
    await tester.pumpAndSettle();

    expect(find.byType(WeightScreen), findsNothing);
    expect(find.text('68.5 kg'), findsOneWidget);
    expect(find.text(Strings.weightNoEntries), findsNothing);

    await harness.teardown(tester);
  });

  testWidgets('the weight screen is not reachable before onboarding finishes',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpApp(tester);

    harness.router.go(AppRoutes.weight);
    await tester.pumpAndSettle();

    expect(find.text(Strings.weightSubtitle), findsNothing);
    expect(harness.router.state.matchedLocation, isNot(AppRoutes.weight));

    await harness.teardown(tester);
  });
}
