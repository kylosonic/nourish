import 'package:drift/drift.dart' show Value;
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/data/tables/tables.dart';
import 'package:nourish_mobile/features/history/widgets/date_strip.dart';
import 'package:nourish_mobile/features/history/widgets/meal_entry_tile.dart';
import 'package:nourish_mobile/l10n/strings.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

void main() {
  group('LOG-06 meal history', () {
    testWidgets(
        'date strip, snapshot-driven entries (BREAKFAST • 08:30 AM, kcal, '
        'P/C/F), future dates empty, LOG MEAL opens the scan sheet',
        (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final DateTime now = DateTime.now();
      await MealRepository(db).saveMeal(
        MealSlot.breakfast,
        <MealItemDraft>[
          MealItemDraft(
            food: testFood(
              id: 'breakfast_food',
              name: 'Chechebsa with Honey',
              kcal: 420,
              proteinG: 8,
              carbsG: 65,
              fatG: 14,
            ),
            unit: PortionUnit.grams,
            quantity: 1,
          ),
        ],
        createdAt: DateTime(now.year, now.month, now.day, 8, 30),
      );

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      // Home → SEE ALL → history (SEE ALL sits below the fold).
      await tester.ensureVisible(find.text(Strings.seeAll.toUpperCase()));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.seeAll.toUpperCase()));
      await tester.pumpAndSettle();
      expect(find.text(Strings.dailySummary), findsOneWidget);

      // Entry renders the immutable snapshot: time, title, kcal, chips.
      expect(find.text('BREAKFAST • 08:30 AM'), findsOneWidget);
      expect(find.text('Chechebsa with Honey'), findsOneWidget);
      expect(
        find.descendant(
          of: find.byType(MealEntryTile),
          matching: find.text('420'),
        ),
        findsOneWidget,
      );
      expect(find.text('P: 8g'), findsOneWidget);
      expect(find.text('C: 65g'), findsOneWidget);
      expect(find.text('F: 14g'), findsOneWidget);

      // Future date: allowed but empty (no fabricated entries).
      final DateTime future = now.add(const Duration(days: 1));
      await tester.tap(
        find.descendant(
          of: find.byType(DateStrip),
          matching: find.text('${future.day}'),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text(Strings.noMealsForDay), findsOneWidget);
      expect(find.text('BREAKFAST • 08:30 AM'), findsNothing);

      // Back to today → entry returns.
      await tester.tap(
        find.descendant(
          of: find.byType(DateStrip),
          matching: find.text('${now.day}'),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('BREAKFAST • 08:30 AM'), findsOneWidget);

      // LOG MEAL → scan menu sheet.
      await tester.ensureVisible(find.text(Strings.logMeal));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.logMeal));
      await tester.pumpAndSettle();
      expect(find.text(Strings.whatDidYouEat), findsOneWidget);
      await harness.teardown(tester);
    });

    testWidgets('history renders snapshots even after the catalog changes '
        '(TGT-04)', (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final DateTime now = DateTime.now();
      await MealRepository(db).saveMeal(
        MealSlot.lunch,
        <MealItemDraft>[
          MealItemDraft(
            food: testFood(id: 'lunch_food', name: 'Injera with Shiro Wot', kcal: 550),
            unit: PortionUnit.grams,
            quantity: 1,
          ),
        ],
        createdAt: DateTime(now.year, now.month, now.day, 12, 0),
      );

      // Catalog mutation after the save (simulates a later DB update).
      await (db.update(db.foods)..where((Foods f) => f.id.equals('injera')))
          .write(const FoodsCompanion(per100gKcal: Value(999)));

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      await tester.ensureVisible(find.text(Strings.seeAll.toUpperCase()));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.seeAll.toUpperCase()));
      await tester.pumpAndSettle();

      // The snapshot (550) renders — not the mutated catalog value.
      expect(find.text('Injera with Shiro Wot'), findsOneWidget);
      expect(
        find.descendant(
          of: find.byType(MealEntryTile),
          matching: find.text('550'),
        ),
        findsOneWidget,
      );
      expect(find.text('999'), findsNothing);
      await harness.teardown(tester);
    });
  });
}
