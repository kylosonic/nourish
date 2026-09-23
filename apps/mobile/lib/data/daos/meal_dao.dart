import 'dart:async';

import 'package:drift/drift.dart';
import 'package:nourish_domain/domain.dart';

import '../database.dart';
import '../tables/tables.dart';

part 'meal_dao.g.dart';

/// Flat per-row values for one meal item (the frozen snapshot columns).
///
/// Built by `MealRepository` from the domain engines at save time; the
/// DAO stores exactly what it is given — no math lives here.
class MealItemRowData {
  const MealItemRowData({
    required this.foodId,
    required this.foodName,
    required this.portionUnit,
    required this.portionQuantity,
    required this.grams,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.fiberG,
    this.sodiumMg,
  });

  final String foodId;
  final String foodName;

  /// `PortionUnit.name`.
  final String portionUnit;
  final double portionQuantity;
  final double grams;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final double? fiberG;
  final double? sodiumMg;
}

/// Meals and meal items: transactional inserts and per-date composition
/// into domain [Meal] models (items always travel with their meals).
@DriftAccessor(tables: [Meals, MealItems])
class MealDao extends DatabaseAccessor<AppDatabase> with _$MealDaoMixin {
  MealDao(super.db);

  /// Inserts the meal and all of its items in one transaction; returns
  /// the new meal id.
  Future<int> insertMealWithItems({
    required String dateKey,
    required MealSlot slot,
    required List<MealItemRowData> items,
    DateTime? createdAt,
  }) {
    return transaction(() async {
      final int mealId = await into(meals).insert(
        MealsCompanion.insert(
          dateKey: dateKey,
          slot: slot.name,
          createdAt: createdAt ?? DateTime.now(),
        ),
      );
      for (final MealItemRowData item in items) {
        await into(mealItems).insert(
          MealItemsCompanion.insert(
            mealId: mealId,
            foodId: item.foodId,
            foodName: item.foodName,
            portionUnit: item.portionUnit,
            portionQuantity: item.portionQuantity,
            grams: item.grams,
            kcal: item.kcal,
            proteinG: item.proteinG,
            carbsG: item.carbsG,
            fatG: item.fatG,
            fiberG: Value(item.fiberG),
            sodiumMg: Value(item.sodiumMg),
          ),
        );
      }
      return mealId;
    });
  }

  /// Deletes a meal and its items in one transaction (LOG-06 removal path).
  Future<void> deleteMealWithItems(int mealId) {
    return transaction(() async {
      await (delete(mealItems)..where((MealItems i) => i.mealId.equals(mealId)))
          .go();
      await (delete(meals)..where((Meals m) => m.id.equals(mealId))).go();
    });
  }

  Future<Meal?> mealById(int id) async {    final MealsRow? row = await (select(
      meals,
    )..where((Meals m) => m.id.equals(id))).getSingleOrNull();
    if (row == null) {
      return null;
    }
    final List<Meal> composed = await _compose([row]);
    return composed.single;
  }

  Future<List<Meal>> mealsForDate(String dateKey) => _compose(
    (select(meals)
          ..where((Meals m) => m.dateKey.equals(dateKey))
          ..orderBy([(Meals m) => OrderingTerm.asc(m.createdAt)]))
        .get(),
  );

  Stream<List<Meal>> watchMealsForDate(String dateKey) => (select(
    meals,
  )..where((Meals m) => m.dateKey.equals(dateKey))).watch().asyncMap(_compose);

  /// Meals in an inclusive `yyyy-MM-dd` range, oldest first.
  ///
  /// The date key is a fixed-width ISO string, so a lexicographic range is the
  /// same as a date range and needs no parsing on the SQL side.
  Future<List<Meal>> mealsInRange(String startKey, String endKey) => _compose(
    (select(meals)
          ..where(
            (Meals m) =>
                m.dateKey.isBiggerOrEqualValue(startKey) &
                m.dateKey.isSmallerOrEqualValue(endKey),
          )
          ..orderBy([(Meals m) => OrderingTerm.asc(m.createdAt)]))
        .get(),
  );

  /// The same range as a stream, so a screen derived from recent meals (for
  /// example INS-03's variety rule) follows a meal logged elsewhere.
  Stream<List<Meal>> watchMealsInRange(String startKey, String endKey) => (select(
    meals,
  )..where(
        (Meals m) =>
            m.dateKey.isBiggerOrEqualValue(startKey) &
            m.dateKey.isSmallerOrEqualValue(endKey),
      ))
      .watch()
      .asyncMap(_compose);

  /// All meals, newest first (meal history source).
  Future<List<Meal>> allMeals() => _compose(
    (select(
      meals,
    )..orderBy([(Meals m) => OrderingTerm.desc(m.createdAt)])).get(),
  );

  Future<List<Meal>> _compose(FutureOr<List<MealsRow>> rows) async {
    final List<MealsRow> resolved = await rows;
    if (resolved.isEmpty) {
      return const [];
    }
    final List<int> ids = resolved.map((MealsRow r) => r.id).toList();
    final List<MealItemsRow> itemRows = await (select(
      mealItems,
    )..where((MealItems i) => i.mealId.isIn(ids))).get();
    final Map<int, List<MealItem>> byMeal = {};
    for (final MealItemsRow item in itemRows) {
      byMeal
          .putIfAbsent(item.mealId, () => [])
          .add(
            MealItem(
              id: '${item.id}',
              mealId: '${item.mealId}',
              foodId: item.foodId,
              foodName: item.foodName,
              portionUnit: PortionUnit.values.byName(item.portionUnit),
              portionQuantity: item.portionQuantity,
              grams: item.grams,
              snapshot: NutritionSnapshot(
                kcal: item.kcal,
                proteinG: item.proteinG,
                carbsG: item.carbsG,
                fatG: item.fatG,
                fiberG: item.fiberG,
                sodiumMg: item.sodiumMg,
              ),
            ),
          );
    }
    return resolved
        .map(
          (MealsRow row) => Meal(
            id: '${row.id}',
            dateKey: row.dateKey,
            slot: MealSlot.values.byName(row.slot),
            createdAt: row.createdAt,
            items: byMeal[row.id] ?? const [],
          ),
        )
        .toList();
  }
}
