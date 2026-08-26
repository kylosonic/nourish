import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

void main() {
  const NutritionSnapshot snapshotA =
      NutritionSnapshot(kcal: 225, proteinG: 5, carbsG: 48, fatG: 1);
  const NutritionSnapshot snapshotB =
      NutritionSnapshot(kcal: 225, proteinG: 5, carbsG: 48, fatG: 1);

  test('snapshot has only final fields: const instances are canonical', () {
    // A const constructor requires every field to be final; identical
    // const expressions are canonicalized to the same instance.
    expect(identical(snapshotA, snapshotB), isTrue);
    expect(snapshotA.kcal, 225);
    expect(snapshotA.proteinG, 5);
    expect(snapshotA.carbsG, 48);
    expect(snapshotA.fatG, 1);
  });

  test('mutating the source per100g after snapshot creation does not '
      'change the snapshot', () {
    final NutritionPer100g per100g =
        NutritionPer100g(kcal: 150, proteinG: 5, carbsG: 45, fatG: 1);
    final NutritionSnapshot snapshot = nutritionFor(per100g, 150);
    expect(snapshot.kcal, 225);

    // A later catalog edit must never rewrite logged history (TGT-04).
    per100g.kcal = 400;
    expect(snapshot.kcal, 225);
  });

  test('copyWith returns a NEW instance and leaves the original untouched',
      () {
    final NutritionSnapshot updated = snapshotA.copyWith(kcal: 300);
    expect(identical(snapshotA, updated), isFalse);
    expect(snapshotA.kcal, 225);
    expect(updated.kcal, 300);
    expect(updated.proteinG, snapshotA.proteinG);
    expect(updated.carbsG, snapshotA.carbsG);
    expect(updated.fatG, snapshotA.fatG);
  });

  test('Meal.totals sums item snapshots correctly', () {
    final Meal meal = Meal(
      id: 'm1',
      dateKey: '2026-08-26',
      slot: MealSlot.lunch,
      createdAt: DateTime(2026, 8, 26, 12, 30),
      items: const [
        MealItem(
          id: 'i1',
          mealId: 'm1',
          foodId: 'injera',
          foodName: 'Injera',
          portionUnit: PortionUnit.injera,
          portionQuantity: 1,
          grams: 150,
          snapshot: NutritionSnapshot(kcal: 225, proteinG: 5, carbsG: 48, fatG: 1),
        ),
        MealItem(
          id: 'i2',
          mealId: 'm1',
          foodId: 'shiro',
          foodName: 'Shiro Wot',
          portionUnit: PortionUnit.bowl,
          portionQuantity: 1,
          grams: 240,
          snapshot: NutritionSnapshot(
            kcal: 281,
            proteinG: 9,
            carbsG: 42,
            fatG: 8,
            fiberG: 6,
            sodiumMg: 350,
          ),
        ),
      ],
    );

    expect(meal.totals.kcal, 506);
    expect(meal.totals.protein, 14);
    expect(meal.totals.carbs, 90);
    expect(meal.totals.fat, 9);
    expect(meal.totals.fiber, closeTo(6, 1e-9));
    expect(meal.totals.sodium, closeTo(350, 1e-9));
  });

  test('totalsFor sums all meals on a day', () {
    const NutritionSnapshot breakfastSnapshot =
        NutritionSnapshot(kcal: 300, proteinG: 10, carbsG: 40, fatG: 10);
    const NutritionSnapshot lunchSnapshot =
        NutritionSnapshot(kcal: 500, proteinG: 20, carbsG: 60, fatG: 15);

    final Meal breakfast = Meal(
      id: 'b1',
      dateKey: '2026-08-26',
      slot: MealSlot.breakfast,
      createdAt: DateTime(2026, 8, 26, 8),
      items: const [
        MealItem(
          id: 'bi1',
          mealId: 'b1',
          foodId: 'chechebsa',
          foodName: 'Chechebsa',
          portionUnit: PortionUnit.serving,
          portionQuantity: 1,
          grams: 200,
          snapshot: breakfastSnapshot,
        ),
      ],
    );
    final Meal lunch = Meal(
      id: 'l1',
      dateKey: '2026-08-26',
      slot: MealSlot.lunch,
      createdAt: DateTime(2026, 8, 26, 13),
      items: const [
        MealItem(
          id: 'li1',
          mealId: 'l1',
          foodId: 'shiro',
          foodName: 'Shiro Wot',
          portionUnit: PortionUnit.bowl,
          portionQuantity: 1,
          grams: 300,
          snapshot: lunchSnapshot,
        ),
      ],
    );

    final NutritionTotals totals = totalsFor([breakfast, lunch]);
    expect(totals.kcal, 800);
    expect(totals.protein, 30);
    expect(totals.carbs, 100);
    expect(totals.fat, 25);
  });
}
