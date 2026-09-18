import 'package:nourish_domain/domain.dart';

import '../database.dart';
import '../daos/food_dao.dart';
import '../tables/tables.dart';
import 'catalog_data_source.dart';

/// SeedMeta key recording the last successful catalog snapshot version.
const String catalogVersionKey = 'catalog_version';

/// SeedMeta key recording the source label of the last snapshot.
const String catalogSourceKey = 'catalog_source';

/// The on-device catalog cache.
///
/// This is the FoodDao-backed logic that lived in `FoodRepository` during
/// S0, moved (not rewritten) behind the [CatalogDataSource] seam, plus
/// the transactional snapshot replace and the stored-version read that
/// drive the sync's version gate (blueprint S1 §11).
class LocalCatalogDataSource implements CatalogDataSource {
  LocalCatalogDataSource(this._db);

  final AppDatabase _db;

  FoodDao get _foods => _db.foodDao;

  @override
  Future<List<Food>> searchLocal(
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

  @override
  Future<List<Food>> allLocal({FoodPreference? preference}) async {
    return applyPreferenceBias(
      await _compose(await _foods.allFoodRows()),
      preference,
    );
  }

  @override
  Future<List<Food>> localByCategory(String category) async {
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

  @override
  Future<String?> storedVersion() async {
    final SeedMetaRow? row = await (_db.select(
      _db.seedMeta,
    )..where((SeedMeta m) => m.key.equals(catalogVersionKey)))
        .getSingleOrNull();
    return row?.value;
  }

  /// The local cache never fetches: this seam method belongs to the
  /// remote source only.
  @override
  Future<CatalogSnapshot?> fetchSnapshot({String? etag}) =>
      throw UnsupportedError(
        'LocalCatalogDataSource cannot fetch a remote catalog',
      );

  /// Single-transaction catalog replace (OFF-01): on success the cache
  /// holds exactly the snapshot's foods and the version + source are
  /// recorded in `seed_meta`. Any throw rolls the whole transaction
  /// back, leaving the previous catalog (the seed) intact.
  ///
  /// **Shrink guard (QA finding F-05).** A truncated or mangled payload that
  /// still parses into one or two usable foods used to be able to wipe the
  /// whole cached catalog. A snapshot is therefore refused when it would leave
  /// the cache below [minRetainedRatio] of its current size. Pass
  /// `allowShrink: true` only for a deliberate, reviewed reduction.
  @override
  Future<void> replaceAll(
    CatalogSnapshot snapshot, {
    bool allowShrink = false,
  }) async {
    if (!allowShrink) {
      final int current = await _foods.countAll();
      final int incoming = snapshot.foods.length;
      final int floor = (current * minRetainedRatio).floor();
      if (current > 0 && incoming < floor) {
        throw CatalogFetchException(
          'refusing to replace a $current-food catalog with $incoming foods '
          '(below the ${(minRetainedRatio * 100).round()}% durability floor) — '
          'keeping the previous catalog',
        );
      }
    }
    await _db.transaction(() async {
      await (_db.delete(_db.foodAliases)).go();
      await (_db.delete(_db.foodPortions)).go();
      await (_db.delete(_db.foods)).go();

      for (final CatalogFood food in snapshot.foods) {
        await _foods.insertFood(_foodRow(food));
        await _foods.insertAliases(
          food.aliases.map(
            (CatalogFoodAlias alias) => FoodAliasesRow(
              foodId: food.id,
              alias: alias.alias,
              language: alias.language,
            ),
          ),
        );
        await _foods.insertPortions(_portionRows(food));
      }

      await _db
          .into(_db.seedMeta)
          .insertOnConflictUpdate(
            SeedMetaRow(key: catalogVersionKey, value: snapshot.version),
          );
      await _db
          .into(_db.seedMeta)
          .insertOnConflictUpdate(
            SeedMetaRow(key: catalogSourceKey, value: snapshot.sourceName),
          );
    });
  }

  /// Composes Drift rows into domain [Food]s (S0 logic, unchanged except
  /// the provenance block now carries the v2 columns).
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
        source: FoodSource(
          name: row.sourceName,
          version: row.sourceVersion,
          foodCode: row.sourceFoodCode,
          reference: row.sourceReference,
          importDate: row.importDate,
        ),
        isSeed: row.isSeed,
      );
    }).toList();
  }

  static FoodsRow _foodRow(CatalogFood food) => FoodsRow(
        id: food.id,
        canonicalName: food.canonicalName,
        category: food.category,
        defaultPortionUnit: food.defaultPortion.unit.name,
        defaultPortionQty: food.defaultPortion.quantity,
        defaultPortionGrams: food.defaultPortion.grams,
        per100gKcal: food.per100g.kcal,
        per100gProtein: food.per100g.proteinG,
        per100gCarbs: food.per100g.carbsG,
        per100gFat: food.per100g.fatG,
        per100gFiber: food.per100g.fiberG,
        per100gSodium: food.per100g.sodiumMg,
        sourceName: food.source.name,
        sourceVersion: food.source.version,
        sourceFoodCode: food.source.foodCode,
        sourceReference: food.source.reference,
        importDate: food.source.importDate,
        isSeed: food.isSeed,
      );

  /// Portion rows for a snapshot food. The default portion is always
  /// part of the table (deduped by unit) so quick-add and the portion
  /// picker agree.
  static List<FoodPortionsRow> _portionRows(CatalogFood food) {
    final Map<String, Portion> byUnit = <String, Portion>{};
    for (final Portion portion in food.portions) {
      byUnit.putIfAbsent(portion.unit.name, () => portion);
    }
    byUnit.putIfAbsent(
      food.defaultPortion.unit.name,
      () => food.defaultPortion,
    );
    return byUnit.values
        .map(
          (Portion portion) => FoodPortionsRow(
            foodId: food.id,
            unit: portion.unit.name,
            quantity: portion.quantity,
            grams: portion.grams,
          ),
        )
        .toList();
  }
}
