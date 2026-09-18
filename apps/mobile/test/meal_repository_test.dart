import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/food_repository.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/data/sources/local_catalog_data_source.dart';

import 'test_helpers.dart';

void main() {
  late AppDatabase db;
  late FoodRepository foodRepository;
  late MealRepository mealRepository;

  const String dateKey = '2026-08-26';

  setUp(() async {
    db = await openSeededDb();
    foodRepository = FoodRepository(LocalCatalogDataSource(db));
    mealRepository = MealRepository(db);
  });

  tearDown(() async => db.close());

  group('MealRepository snapshot capture (TGT-03/04)', () {
    test(
      'saved item kcal equals the computed snapshot (Injera anchor)',
      () async {
        final Food injera = (await foodRepository.search('injera')).single;

        // Design anchor: 1 piece 150 g @ 150 kcal/100g = 225 kcal.
        final Meal saved = await mealRepository.saveMeal(
          MealSlot.breakfast,
          <MealItemDraft>[
            MealItemDraft(food: injera, unit: PortionUnit.injera, quantity: 1),
          ],
          dateKey: dateKey,
        );

        final MealItem item = saved.items.single;
        expect(item.grams, 150);
        expect(item.snapshot.kcal, 225);

        // Independent recomputation from the engine must agree.
        final NutritionSnapshot expected = nutritionFor(
          injera.per100g,
          item.grams,
        );
        expect(item.snapshot.kcal, expected.kcal);
        expect(item.snapshot.proteinG, expected.proteinG);
        expect(item.snapshot.carbsG, expected.carbsG);
        expect(item.snapshot.fatG, expected.fatG);
      },
    );

    test('Shiro anchor: 1 cup 240 g @ 117 kcal/100g → 281 kcal', () async {
      // The design card shows 280; 117 × 2.4 = 280.8 rounds half-away-
      // from-zero to 281 (documented deviation in the build report).
      final Food shiro = (await foodRepository.search('shiro')).single;
      final Meal saved = await mealRepository.saveMeal(
        MealSlot.lunch,
        <MealItemDraft>[
          MealItemDraft(food: shiro, unit: PortionUnit.cup, quantity: 1),
        ],
        dateKey: dateKey,
      );
      expect(saved.items.single.grams, 240);
      expect(saved.items.single.snapshot.kcal, 281);
    });

    test(
      'Beef Tibs anchor: 1 serving 200 g @ 175 kcal/100g → 350 kcal',
      () async {
        final Food tibs = (await foodRepository.search('beef tibs')).single;
        final Meal saved = await mealRepository.saveMeal(
          MealSlot.dinner,
          <MealItemDraft>[
            MealItemDraft(food: tibs, unit: PortionUnit.serving, quantity: 1),
          ],
          dateKey: dateKey,
        );
        expect(saved.items.single.grams, 200);
        expect(saved.items.single.snapshot.kcal, 350);
      },
    );

    test('mutating the catalog object after save does not change the '
        'stored snapshot (immutability)', () async {
      final Food injera = (await foodRepository.search('injera')).single;
      final MealItemDraft draft = MealItemDraft(
        food: injera,
        unit: PortionUnit.injera,
        quantity: 1,
      );

      await mealRepository.saveMeal(MealSlot.breakfast, <MealItemDraft>[
        draft,
      ], dateKey: dateKey);

      // Simulate a later catalog edit on the in-memory object.
      injera.per100g.kcal = 999;
      injera.per100g.proteinG = 999;

      final Meal stored = (await mealRepository.mealsForDate(dateKey)).single;
      expect(
        stored.items.single.snapshot.kcal,
        225,
        reason: 'history renders snapshots, never the live catalog',
      );
    });

    test('daily totals sum every item snapshot', () async {
      final Food shiro = (await foodRepository.search('shiro')).single;
      final Food tibs = (await foodRepository.search('beef tibs')).single;

      await mealRepository.saveMeal(MealSlot.lunch, <MealItemDraft>[
        MealItemDraft(food: shiro, unit: PortionUnit.cup),
        MealItemDraft(food: tibs, unit: PortionUnit.serving),
      ], dateKey: dateKey);

      final NutritionTotals totals = await mealRepository.totalsForDate(
        dateKey,
      );
      expect(totals.kcal, 281 + 350);
    });

    test(
      'multiple items in one meal share the meal and compose items',
      () async {
        final Food egg = (await foodRepository.search('egg')).single;
        final Food milk = (await foodRepository.search('milk')).single;

        await mealRepository.saveMeal(MealSlot.breakfast, <MealItemDraft>[
          MealItemDraft(food: egg, unit: PortionUnit.piece, quantity: 2),
          MealItemDraft(food: milk, unit: PortionUnit.glass),
        ], dateKey: dateKey);

        final Meal meal = (await mealRepository.mealsForDate(dateKey)).single;
        expect(meal.slot, MealSlot.breakfast);
        expect(meal.items.length, 2);
        expect(meal.totals.kcal, 155 + 105); // 2 eggs + 1 glass milk
      },
    );

    test('refuses to save a meal without items', () async {
      expect(
        () => mealRepository.saveMeal(
          MealSlot.snack,
          const <MealItemDraft>[],
          dateKey: dateKey,
        ),
        throwsArgumentError,
      );
    });
  });
}
