import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/core/clock.dart';
import 'package:nourish_mobile/core/date_utils.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/providers.dart';

import 'test_helpers.dart';

/// M3: the injectable clock drives every "today" derivation — crossing
/// midnight recomputes the day key, and the home providers read their
/// key through the injected clock, never the real wall clock.
void main() {
  group('M3 injectable clock', () {
    test('todayDateKey recomputes the day key across midnight', () {
      final DateTime beforeMidnight = DateTime(2026, 8, 26, 23, 59);
      final DateTime afterMidnight = DateTime(2026, 8, 27, 0, 1);

      Clock clockAt(DateTime instant) => () => instant;

      expect(todayDateKey(clockAt(beforeMidnight)), '2026-08-26');
      expect(
        todayDateKey(clockAt(afterMidnight)),
        '2026-08-27',
        reason: 'the day key must roll over when the clock crosses midnight',
      );
    });

    test('todayMealsProvider selects its day through the injected clock',
        () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);

      final DateTime fixedDay = DateTime(2026, 8, 26, 9, 0);
      await MealRepository(db).saveMeal(
        MealSlot.lunch,
        <MealItemDraft>[
          MealItemDraft(
            food: testFoodForClock(),
            unit: PortionUnit.grams,
            quantity: 1,
          ),
        ],
        dateKey: dateKeyFor(fixedDay),
      );

      final ProviderContainer container = ProviderContainer(
        overrides: <Override>[
          driftDatabaseProvider.overrideWithValue(db),
          clockProvider.overrideWithValue(() => fixedDay),
        ],
      );
      addTearDown(container.dispose);

      final List<Meal> meals = await container.read(todayMealsProvider.future);
      expect(
        meals,
        hasLength(1),
        reason: 'the injected clock\'s day key must select today\'s meals',
      );
      expect(meals.single.slot, MealSlot.lunch);
    });

    test('todayMealsProvider ignores meals on the real wall-clock day',
        () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);

      // Save a meal under the REAL today (whatever the wall clock says).
      await MealRepository(db).saveMeal(
        MealSlot.dinner,
        <MealItemDraft>[
          MealItemDraft(
            food: testFoodForClock(),
            unit: PortionUnit.grams,
            quantity: 1,
          ),
        ],
        dateKey: todayDateKey(),
      );

      final ProviderContainer container = ProviderContainer(
        overrides: <Override>[
          driftDatabaseProvider.overrideWithValue(db),
          // A fixed clock three days away: the real-today meal must not
          // leak into "today" under the injected clock.
          clockProvider.overrideWithValue(
            () => DateTime.now().add(const Duration(days: 3)),
          ),
        ],
      );
      addTearDown(container.dispose);

      final List<Meal> meals = await container.read(todayMealsProvider.future);
      expect(
        meals,
        isEmpty,
        reason: 'the injected clock, not the wall clock, defines today',
      );
    });
  });
}

/// Minimal catalog food for clock tests (100 g portion → 1×100 g).
Food testFoodForClock() {
  return Food(
    id: 'clock_food',
    canonicalName: 'Clock Food',
    category: 'Ethiopian',
    defaultPortion: const Portion(unit: PortionUnit.grams, grams: 100),
    portions: const <Portion>[Portion(unit: PortionUnit.grams, grams: 100)],
    per100g: NutritionPer100g(
      kcal: 100,
      proteinG: 5,
      carbsG: 10,
      fatG: 2,
    ),
    source: const FoodSource(name: 'test', version: '1'),
  );
}
