import 'package:nourish_domain/domain.dart';

import '../../core/date_utils.dart';
import '../database.dart';
import '../daos/meal_dao.dart';

/// One food chosen for logging; grams and the nutrition snapshot are
/// computed at save time by the domain engines (TGT-02/03/04).
class MealItemDraft {
  const MealItemDraft({
    required this.food,
    required this.unit,
    this.quantity = 1,
  });

  final Food food;
  final PortionUnit unit;
  final double quantity;
}

/// Meal logging: converts drafts through the domain portion + nutrition
/// engines and freezes the resulting snapshot into `meal_items` columns.
class MealRepository {
  MealRepository(this._db);

  final AppDatabase _db;

  MealDao get _meals => _db.mealDao;

  /// Saves a meal with its items in one transaction and returns the
  /// composed meal (items carry their immutable snapshots).
  Future<Meal> saveMeal(
    MealSlot slot,
    List<MealItemDraft> items, {
    String? dateKey,
    DateTime? createdAt,
  }) async {
    if (items.isEmpty) {
      throw ArgumentError('cannot save a meal without items');
    }
    final DateTime loggedAt = createdAt ?? DateTime.now();
    final String key = dateKey ?? dateKeyFor(loggedAt);
    final List<MealItemRowData> rows = items.map((MealItemDraft draft) {
      final double grams = portionToGrams(
        draft.food.portions,
        draft.unit,
        draft.quantity,
      );
      final NutritionSnapshot snapshot = nutritionFor(
        draft.food.per100g,
        grams,
      );
      return MealItemRowData(
        foodId: draft.food.id,
        foodName: draft.food.canonicalName,
        portionUnit: draft.unit.name,
        portionQuantity: draft.quantity,
        grams: grams,
        kcal: snapshot.kcal,
        proteinG: snapshot.proteinG,
        carbsG: snapshot.carbsG,
        fatG: snapshot.fatG,
        fiberG: snapshot.fiberG,
        sodiumMg: snapshot.sodiumMg,
      );
    }).toList();
    final int mealId = await _meals.insertMealWithItems(
      dateKey: key,
      slot: slot,
      items: rows,
      createdAt: loggedAt,
    );
    final Meal? saved = await _meals.mealById(mealId);
    if (saved == null) {
      throw StateError('saved meal $mealId could not be read back');
    }
    return saved;
  }

  Future<List<Meal>> mealsForDate(String dateKey) =>
      _meals.mealsForDate(dateKey);

  /// Meals across an inclusive date range (insights window, INS-01).
  Future<List<Meal>> mealsInRange(String startKey, String endKey) =>
      _meals.mealsInRange(startKey, endKey);

  /// The same range as a live stream (INS-03 variety rule).
  Stream<List<Meal>> watchMealsInRange(String startKey, String endKey) =>
      _meals.watchMealsInRange(startKey, endKey);

  Stream<List<Meal>> watchMealsForDate(String dateKey) =>
      _meals.watchMealsForDate(dateKey);

  /// All meals, newest first (history source, LOG-06).
  Future<List<Meal>> allMeals() => _meals.allMeals();

  /// Aggregated consumed totals for a calendar day (domain engine).
  Future<NutritionTotals> totalsForDate(String dateKey) async =>
      totalsFor(await mealsForDate(dateKey));
}
