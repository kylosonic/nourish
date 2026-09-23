import 'package:nourish_domain/domain.dart';

import '../../core/date_utils.dart';
import '../database.dart';
import '../daos/meal_dao.dart';
import '../models/sync_operation.dart';
import 'sync_queue_repository.dart';

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
    await _queueMeal(saved);
    return saved;
  }

  /// Queue the meal for the server (OFF-02).
  ///
  /// The frozen snapshot goes on the wire, not a reference to the catalog: the
  /// server keeps what the meal actually contained, exactly as the device does.
  Future<void> _queueMeal(Meal meal) async {
    // The domain meal carries its local row id as a string; the queue keys on
    // the numeric id, which is what the local table uses.
    final int rowId = int.parse(meal.id);
    final SyncQueueRepository queue = SyncQueueRepository(_db);
    // Items carry their own install-scoped id: the server validates one per
    // item, and it is what identifies an item inside a meal across pushes.
    final String device = await queue.deviceId();
    await queue.enqueue(
      'meal',
      rowId,
      SyncOperation(
        clientId: '',
        kind: SyncKind.meal,
        op: SyncOp.upsert,
        updatedAt: meal.createdAt,
        loggedAt: meal.createdAt,
        dateKey: meal.dateKey,
        slot: meal.slot,
        items: meal.items
            .map(
              (MealItem item) => SyncOperationItem(
                clientId: '$device:item:${item.id}',
                foodId: item.foodId,
                foodName: item.foodName,
                portionUnit: item.portionUnit.name,
                portionQuantity: item.portionQuantity,
                grams: item.grams,
                kcal: item.snapshot.kcal,
                proteinG: item.snapshot.proteinG,
                carbsG: item.snapshot.carbsG,
                fatG: item.snapshot.fatG,
                fiberG: item.snapshot.fiberG,
                sodiumMg: item.snapshot.sodiumMg,
              ),
            )
            .toList(),
      ),
    );
  }

  /// Remove a meal and queue its tombstone.
  ///
  /// The tombstone is written in the same transaction as the delete, so the
  /// server cannot be left believing a meal the user removed is still there.
  Future<void> deleteMeal(int mealId) async {
    final Meal? meal = await _meals.mealById(mealId);
    await _db.transaction(() async {
      await _meals.deleteMealWithItems(mealId);
      if (meal == null) return;
      final DateTime now = DateTime.now();
      await SyncQueueRepository(_db).enqueue(
        'meal',
        mealId,
        SyncOperation(
          clientId: '',
          kind: SyncKind.meal,
          op: SyncOp.delete,
          updatedAt: now,
          dateKey: meal.dateKey,
        ),
      );
    });
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
