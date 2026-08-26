import 'package:nourish_domain/domain.dart';

import '../database.dart';
import '../daos/food_dao.dart';

/// Catalog read model: composes Drift rows into domain [Food]s and owns
/// search semantics (alias matching, category filter, preference bias).
class FoodRepository {
  FoodRepository(this._db);

  final AppDatabase _db;

  FoodDao get _foods => _db.foodDao;

  /// Searches canonical names + aliases (case-insensitive, English and
  /// Amharic), optionally filters by category, and orders results with
  /// the user's cuisine preference bias.
  Future<List<Food>> search(
    String query, {
    String? category,
    FoodPreference? preference,
  }) async {
    final List<FoodsRow> rows = await _foods.searchFoodRows(query);
    final List<Food> foods = await _compose(rows);
    final List<Food> filtered = category == null
        ? foods
        : foods.where((Food f) => f.category == category).toList();
    return applyPreferenceBias(filtered, preference);
  }

  Future<List<Food>> allFoods({FoodPreference? preference}) async {
    return applyPreferenceBias(
      await _compose(await _foods.allFoodRows()),
      preference,
    );
  }

  Future<List<Food>> foodsByCategory(String category) async {
    return _compose(await _foods.categoryRows(category));
  }

  /// Preference-bias ordering hook (LOG-05): foods matching the user's
  /// cuisine preference rank first; all others keep catalog order.
  static List<Food> applyPreferenceBias(
    List<Food> foods,
    FoodPreference? preference,
  ) {
    if (preference == null || preference == FoodPreference.mixed) {
      return foods;
    }
    bool matches(Food food) {
      switch (preference) {
        case FoodPreference.ethiopian:
          return food.category == 'Ethiopian';
        case FoodPreference.international:
          return food.category != 'Ethiopian';
        case FoodPreference.mixed:
          return true;
      }
    }

    final List<Food> matched = foods.where(matches).toList();
    final List<Food> rest = foods.where((Food f) => !matches(f)).toList();
    return [...matched, ...rest];
  }

  Future<List<Food>> _compose(List<FoodsRow> rows) async {
    if (rows.isEmpty) {
      return const [];
    }
    final Map<String, List<FoodPortionsRow>> portionsByFood = await _foods
        .allPortionsByFood();
    final Map<String, List<FoodAliasesRow>> aliasesByFood = await _foods
        .allAliasesByFood();
    return rows.map((FoodsRow row) {
      final List<FoodPortionsRow> portionRows =
          portionsByFood[row.id] ?? const <FoodPortionsRow>[];
      final List<FoodAliasesRow> aliasRows =
          aliasesByFood[row.id] ?? const <FoodAliasesRow>[];
      return Food(
        id: row.id,
        canonicalName: row.canonicalName,
        category: row.category,
        defaultPortion: Portion(
          unit: PortionUnit.values.byName(row.defaultPortionUnit),
          quantity: row.defaultPortionQty,
          grams: row.defaultPortionGrams,
        ),
        portions: portionRows
            .map(
              (FoodPortionsRow p) => Portion(
                unit: PortionUnit.values.byName(p.unit),
                quantity: p.quantity,
                grams: p.grams,
              ),
            )
            .toList(),
        per100g: NutritionPer100g(
          kcal: row.per100gKcal,
          proteinG: row.per100gProtein,
          carbsG: row.per100gCarbs,
          fatG: row.per100gFat,
          fiberG: row.per100gFiber,
          sodiumMg: row.per100gSodium,
        ),
        aliases: aliasRows.map((FoodAliasesRow a) => a.alias).toList(),
        source: FoodSource(name: row.sourceName, version: row.sourceVersion),
        isSeed: row.isSeed,
      );
    }).toList();
  }
}
