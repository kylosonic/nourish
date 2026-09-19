import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';
import 'package:nourish_mobile/core/date_utils.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/l10n/strings.dart';

import '../pump_app.dart';
import 'seed_helpers.dart';

/// INS-01 acceptance: the dashboard is built from the user's own logged meals,
/// a day over target is visibly flagged, and an empty week shows an empty state
/// rather than a zeroed dashboard.
void main() {
  /// Pump until [finder] matches.
  ///
  /// The dashboard is a FutureProvider over the local database, and
  /// `pumpAndSettle` only pumps frames — it does not wait for a future that has
  /// not scheduled one. Waiting on the finder is what makes these tests
  /// deterministic instead of racing the database.
  Future<void> pumpUntilFound(
    WidgetTester tester,
    Finder finder, {
    int attempts = 40,
  }) async {
    for (int i = 0; i < attempts; i++) {
      await tester.pump(const Duration(milliseconds: 25));
      if (finder.evaluate().isNotEmpty) return;
    }
    await tester.pumpAndSettle();
  }

  /// Select the Insights tab the way a user does.
  ///
  /// The shell mounts every page in an IndexedStack, so a tree assertion without
  /// selecting the tab would read whatever the provider computed at startup.
  /// Selecting the tab is also what makes the screen recompute (see
  /// _HomeShellState._selectTab).
  Future<void> openInsightsTab(WidgetTester tester) async {
    await tester.tap(find.text(Strings.insightsTab));
    await tester.pumpAndSettle();
  }

  /// Log one meal on [dateKey] carrying [kcal] in its snapshot.
  Future<void> log(WidgetTester tester, AppDatabase db, String dateKey, double kcal) async {
    final MealRepository meals = MealRepository(db);
    await meals.saveMeal(
      MealSlot.lunch,
      <MealItemDraft>[
        MealItemDraft(
          food: testFood(id: 'insight_food', name: 'Insight Food', kcal: kcal),
          unit: PortionUnit.grams,
          quantity: 1,
        ),
      ],
      dateKey: dateKey,
    );
  }

  testWidgets('an empty week shows the empty state, not a zeroed dashboard',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpApp(tester, profile: answerProfile());
    await seedTarget(harness.db, answerProfile());

    await openInsightsTab(tester);
    await pumpUntilFound(tester, find.text(Strings.insightsTitle));

    expect(find.text(Strings.insightsEmptyTitle), findsOneWidget);
    expect(find.text(Strings.insightsTitle), findsNothing);
    await harness.teardown(tester);
  });

  testWidgets('a logged day is charted and an over-target day is flagged',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpApp(tester, profile: answerProfile());
    final DailyTarget target = await seedTarget(harness.db, answerProfile());

    final String today = todayDateKey();
    final String yesterday = dateKeyFor(
      DateTime.now().subtract(const Duration(days: 1)),
    );
    await log(tester, harness.db, yesterday, target.targetKcal * 0.5);
    await log(tester, harness.db, today, target.targetKcal * 1.2); // over target

    await openInsightsTab(tester);
    await pumpUntilFound(tester, find.text(Strings.insightsTitle));

    // The dashboard, not the void.
    expect(find.text(Strings.insightsTitle), findsOneWidget);
    expect(find.text(Strings.insightsCaloricBalance), findsOneWidget);
    expect(find.text(Strings.insightsMacroAverages), findsOneWidget);
    expect(find.text(Strings.insightsEmptyTitle), findsNothing);

    // Assert on the specific bars rather than counting colours anywhere in the
    // tree: the shell keeps Home mounted and its ring reacts to the same target.
    // Each logged day's bar carries a "<kcal> kcal · <weekday>" tooltip; matched
    // by prefix/suffix so the separator glyph is not part of the contract.
    Color? barColourFor(WidgetTester tester, int kcal, String weekday) {
      for (final Element element in find.byType(Tooltip).evaluate()) {
        final Tooltip tooltip = element.widget as Tooltip;
        final String? message = tooltip.message;
        if (message == null) continue;
        if (!message.startsWith('$kcal ') || !message.endsWith(weekday)) continue;
        final Finder container = find.descendant(
          of: find.byWidget(tooltip),
          matching: find.byType(Container),
        );
        if (container.evaluate().isEmpty) continue;
        final Container bar = tester.widget<Container>(container.first);
        return (bar.decoration! as BoxDecoration).color;
      }
      return null;
    }

    final int todayKcal = (target.targetKcal * 1.2).round();
    final int yesterdayKcal = (target.targetKcal * 0.5).round();
    final String todayLabel = weekdayLabelFor(today);
    final String yesterdayLabel = weekdayLabelFor(yesterday);

    expect(
      barColourFor(tester, todayKcal, todayLabel),
      NourishColors.error,
      reason: 'the day over target is drawn in the warning colour',
    );
    expect(
      barColourFor(tester, yesterdayKcal, yesterdayLabel),
      NourishColors.primaryContainer,
      reason: 'a day under target keeps the standard colour',
    );

    // An un-logged day inside the window is labelled as un-logged, not as zero.
    expect(
      find.byTooltip(Strings.insightsUnloggedDay(weekdayLabelFor(yesterday))),
      findsNothing,
      reason: 'yesterday has a meal, so its bar carries the kcal tooltip instead',
    );

    // The lower cards are below the fold in a lazy ListView, so scroll to them.
    await tester.scrollUntilVisible(
      find.text(Strings.insightsDietaryDiversity),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(find.text(Strings.insightsHighlights), findsOneWidget);
    expect(find.text(Strings.insightsDietaryDiversity), findsOneWidget);

    // The over-target highlight cites the specific day (INS-02).
    expect(find.text('Over your target'), findsOneWidget);
    expect(find.textContaining('kcal target on'), findsOneWidget);

    await harness.teardown(tester);
  });

  testWidgets('an un-logged day is drawn as un-logged', (WidgetTester tester) async {
    final AppHarness harness = await pumpApp(tester, profile: answerProfile());
    await seedTarget(harness.db, answerProfile());
    await log(tester, harness.db, todayDateKey(), 800);

    await openInsightsTab(tester);
    await pumpUntilFound(tester, find.text(Strings.insightsTitle));

    // A day with no entries inside the window says so explicitly (P-INS-1).
    final String threeDaysAgo = dateKeyFor(
      DateTime.now().subtract(const Duration(days: 3)),
    );
    expect(
      find.byTooltip(
        Strings.insightsUnloggedDay(weekdayLabelFor(threeDaysAgo)),
      ),
      findsOneWidget,
    );
    await harness.teardown(tester);
  });
}
