import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/core/formatters.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';

import 'pump_app.dart';
import 'test_helpers.dart';
import 'widget/seed_helpers.dart';

/// M2 / HOME-03: when two meals land in the SAME slot, the home card
/// aggregates them into one row — summed kcal plus both item names.
void main() {
  group('HOME-03 multi-items-per-slot totals', () {
    testWidgets(
      'two snacks in one slot aggregate into one row with both names',
      (WidgetTester tester) async {
        final AppDatabase db = await openSeededDb();
        final UserProfile answers = answerProfile();
        await seedTarget(db, answers);

        final MealRepository meals = MealRepository(db);
        await meals.saveMeal(
          MealSlot.snack,
          <MealItemDraft>[
            MealItemDraft(
              food: testFood(id: 'snack_a', name: 'First Snack', kcal: 100),
              unit: PortionUnit.grams,
              quantity: 1,
            ),
          ],
        );
        await meals.saveMeal(
          MealSlot.snack,
          <MealItemDraft>[
            MealItemDraft(
              food: testFood(id: 'snack_b', name: 'Second Snack', kcal: 50),
              unit: PortionUnit.grams,
              quantity: 1,
            ),
          ],
        );

        final AppHarness harness = await pumpApp(
          tester,
          profile: answers,
          db: db,
        );

        // One aggregated snack row: both names and the summed kcal
        // (100 + 50). The ring shows the leftover value, so the total
        // '150' appears only in the snack row.
        expect(find.text('First Snack, Second Snack'), findsOneWidget);
        expect(find.text(formatKcal(150)), findsOneWidget);
        expect(find.text('First Snack'), findsNothing);
        expect(find.text('Second Snack'), findsNothing);
        await harness.teardown(tester);
      },
    );

    testWidgets(
      'different slots keep separate rows (no cross-slot merging)',
      (WidgetTester tester) async {
        final AppDatabase db = await openSeededDb();
        final UserProfile answers = answerProfile();
        await seedTarget(db, answers);

        final MealRepository meals = MealRepository(db);
        await meals.saveMeal(
          MealSlot.breakfast,
          <MealItemDraft>[
            MealItemDraft(
              food: testFood(id: 'bk_a', name: 'Breakfast Food', kcal: 300),
              unit: PortionUnit.grams,
              quantity: 1,
            ),
          ],
        );
        await meals.saveMeal(
          MealSlot.dinner,
          <MealItemDraft>[
            MealItemDraft(
              food: testFood(id: 'dn_a', name: 'Dinner Food', kcal: 500),
              unit: PortionUnit.grams,
              quantity: 1,
            ),
          ],
        );

        final AppHarness harness = await pumpApp(
          tester,
          profile: answers,
          db: db,
        );

        expect(find.text('Breakfast Food'), findsOneWidget);
        expect(find.text('Dinner Food'), findsOneWidget);
        await harness.teardown(tester);
      },
    );
  });
}
