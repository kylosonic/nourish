import 'package:drift/drift.dart';

import '../database.dart';
import '../tables/tables.dart';

part 'food_dao.g.dart';

/// Catalog queries: raw row access for [Foods], [FoodAliases] and
/// [FoodPortions]. `FoodRepository` composes these rows into domain
/// [Food] models and owns search semantics (bias ordering, categories).
@DriftAccessor(tables: [Foods, FoodAliases, FoodPortions])
class FoodDao extends DatabaseAccessor<AppDatabase> with _$FoodDaoMixin {
  FoodDao(super.db);

  Future<List<FoodsRow>> allFoodRows() => select(foods).get();

  /// Number of cached foods — used by the catalog durability guard
  /// (QA finding F-05).
  Future<int> countAll() async {
    final countExp = foods.id.count();
    final query = selectOnly(foods)..addColumns([countExp]);
    final row = await query.getSingle();
    return row.read(countExp) ?? 0;
  }

  Future<List<FoodsRow>> categoryRows(String category) =>
      (select(foods)..where((Foods f) => f.category.equals(category))).get();

  /// Case-insensitive match on the canonical name OR any alias
  /// (English and Amharic alike — Amharic has no case, but `lower()` is
  /// harmless and keeps English matching consistent).
  ///
  /// Implemented as two queries (canonical-name matches, then alias-id
  /// matches) so a single food can never appear twice: a join-based OR
  /// multiplies rows per matching alias.
  Future<List<FoodsRow>> searchFoodRows(String query) async {
    final String q = query.trim().toLowerCase();
    if (q.isEmpty) {
      return allFoodRows();
    }
    final String like = '%$q%';

    final List<FoodsRow> byName = await (select(
      foods,
    )..where((Foods f) => f.canonicalName.lower().like(like))).get();
    final List<String> byAlias =
        await (selectOnly(foodAliases, distinct: true)
              ..addColumns([foodAliases.foodId])
              ..where(foodAliases.alias.lower().like(like)))
            .map((row) => row.read(foodAliases.foodId)!)
            .get();

    final Set<String> ids = <String>{
      ...byName.map((FoodsRow f) => f.id),
      ...byAlias,
    };
    if (ids.length == byName.length && byAlias.every(ids.contains)) {
      return byName;
    }
    return (select(foods)..where((Foods f) => f.id.isIn(ids))).get();
  }

  /// All portion rows grouped by food id.
  Future<Map<String, List<FoodPortionsRow>>> allPortionsByFood() async {
    final List<FoodPortionsRow> rows = await select(foodPortions).get();
    final Map<String, List<FoodPortionsRow>> grouped = {};
    for (final FoodPortionsRow row in rows) {
      grouped.putIfAbsent(row.foodId, () => []).add(row);
    }
    return grouped;
  }

  /// All alias rows grouped by food id.
  Future<Map<String, List<FoodAliasesRow>>> allAliasesByFood() async {
    final List<FoodAliasesRow> rows = await select(foodAliases).get();
    final Map<String, List<FoodAliasesRow>> grouped = {};
    for (final FoodAliasesRow row in rows) {
      grouped.putIfAbsent(row.foodId, () => []).add(row);
    }
    return grouped;
  }

  /// Insert helpers used by the seed importer (replace semantics keep
  /// re-imports idempotent at the row level too).
  Future<void> insertFood(FoodsRow row) =>
      into(foods).insertOnConflictUpdate(row);

  Future<void> insertAliases(Iterable<FoodAliasesRow> rows) => batch(
    (Batch batch) => batch.insertAllOnConflictUpdate(foodAliases, rows),
  );

  Future<void> insertPortions(Iterable<FoodPortionsRow> rows) => batch(
    (Batch batch) => batch.insertAllOnConflictUpdate(foodPortions, rows),
  );
}
