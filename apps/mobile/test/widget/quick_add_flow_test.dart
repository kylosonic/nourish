import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/core/date_utils.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/l10n/strings.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

void main() {
  group('LOG-05 food search & quick add', () {
    testWidgets(
        'alias search ("doro wet"/"ዶሮ ወጥ") → Doro Wot; quick-add lands in '
        'the pre-scoped slot at the default portion', (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      // Home → "Not logged" Dinner row (slot rows: Breakfast/Lunch/
      // Dinner/Snack → index 2) → scan sheet pre-scoped to Dinner.
      await tester.ensureVisible(find.text(Strings.notLogged).at(2));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.notLogged).at(2));
      await tester.pumpAndSettle();
      expect(find.text(Strings.whatDidYouEat), findsOneWidget);

      await tester.ensureVisible(find.text(Strings.scanSearchFood.toUpperCase()));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.scanSearchFood.toUpperCase()));
      await tester.pumpAndSettle();
      expect(find.text(Strings.searchFoodsTitle), findsOneWidget);
      expect(find.text(Strings.seedDisclaimer), findsOneWidget);

      // Alias search resolves to the canonical food with the default
      // portion + computed kcal.
      await tester.enterText(find.byType(TextField), 'doro wet');
      await tester.pumpAndSettle();
      expect(find.text('Doro Wot'), findsOneWidget);
      expect(find.textContaining('1 serving (200g)'), findsOneWidget);
      expect(find.textContaining('320 kcal'), findsOneWidget);

      // Quick-add → meal saved to the pre-scoped Dinner slot.
      await tester.tap(find.byTooltip(Strings.addFoodTooltip));
      await tester.pumpAndSettle();
      expect(find.text(Strings.addedToMeal('Doro Wot', 'Dinner')), findsOneWidget);

      final List<Meal> meals = await MealRepository(db).mealsForDate(
        todayDateKey(),
      );
      expect(meals, hasLength(1));
      expect(meals.single.slot, MealSlot.dinner);
      final MealItem item = meals.single.items.single;
      expect(item.foodName, 'Doro Wot');
      expect(item.grams, 200);
      expect(item.snapshot.kcal, 320);

      // Amharic alias resolves to the same canonical food.
      await tester.enterText(find.byType(TextField), 'ዶሮ ወጥ');
      await tester.pumpAndSettle();
      expect(find.text('Doro Wot'), findsOneWidget);
      await harness.teardown(tester);
    });

    testWidgets('category chips filter results', (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      // Search lane via the scan center sheet.
      await tester.tap(find.byIcon(Icons.add_circle));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text(Strings.scanSearchFood.toUpperCase()));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.scanSearchFood.toUpperCase()));
      await tester.pumpAndSettle();

      // Browse shows foods from all categories (the list is lazy, so
      // scroll the results list down to reach the lower cards).
      expect(find.text('Injera'), findsOneWidget);
      await tester.drag(find.byType(ListView).last, const Offset(0, -400));
      await tester.pumpAndSettle();
      expect(find.text('Chechebsa'), findsOneWidget);

      await tester.tap(find.text('Breakfast'));
      await tester.pumpAndSettle();
      expect(find.text('Chechebsa'), findsOneWidget);
      expect(find.text('Injera'), findsNothing);
      expect(find.text('Doro Wot'), findsNothing);
      await harness.teardown(tester);
    });
  });
}
