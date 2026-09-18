import 'dart:developer' as developer;

import 'package:nourish_domain/domain.dart';

import '../database.dart';
import '../tables/tables.dart';
import 'seed_catalog.dart';

/// Current seed catalog version. Bump when the catalog content changes;
/// the import re-runs on devices holding an older version.
const String seedVersion = 's0-1';

/// SeedMeta key guarding the one-shot import (blueprint §17).
const String seedVersionKey = 'seed_version';

/// First-run import of the 20-food bootstrap catalog
/// (`provisional-seed-bootstrap`): the first cache the app ships with
/// (OFF-01). The sync service replaces it with the Ethiopian FCT 2025
/// catalog on the first successful sync; until then (or whenever sync
/// fails) this cache is what search serves, with the provisional-values
/// disclaimer shown.
///
/// Idempotent: guarded by a `seed_meta` row (`seed_version` == [seedVersion]).
/// Row inserts use replace semantics so a crash mid-import cannot leave a
/// half-imported catalog: the transaction rolls back and the next boot
/// retries cleanly.
class SeedImporter {
  SeedImporter(this.db);

  final AppDatabase db;

  /// Imports the catalog if the guard version is missing or stale.
  /// Returns the number of foods inserted (0 when already current).
  Future<int> run() async {
    final SeedMetaRow? existing = await (db.select(
      db.seedMeta,
    )..where((SeedMeta m) => m.key.equals(seedVersionKey))).getSingleOrNull();
    if (existing?.value == seedVersion) {
      developer.log(
        'seed catalog already at $seedVersion — skipping',
        name: 'seed',
      );
      return 0;
    }

    var inserted = 0;
    await db.transaction(() async {
      for (final SeedFood food in kSeedFoods) {
        await db.foodDao.insertFood(
          FoodsRow(
            id: food.id,
            canonicalName: food.canonicalName,
            category: food.category,
            defaultPortionUnit: food.defaultUnit.name,
            defaultPortionQty: food.defaultQuantity,
            defaultPortionGrams: food.defaultGrams,
            per100gKcal: food.per100g.kcal,
            per100gProtein: food.per100g.proteinG,
            per100gCarbs: food.per100g.carbsG,
            per100gFat: food.per100g.fatG,
            per100gFiber: food.per100g.fiberG,
            per100gSodium: food.per100g.sodiumMg,
            sourceName: seedSourceName,
            isSeed: true,
          ),
        );
        await db.foodDao.insertAliases(
          food.aliases.map((FoodAlias alias) => _aliasRow(food, alias)),
        );
        await db.foodDao.insertPortions(
          food.portions.map((Portion portion) => _portionRow(food, portion)),
        );
        inserted++;
      }
      await db
          .into(db.seedMeta)
          .insertOnConflictUpdate(
            SeedMetaRow(key: seedVersionKey, value: seedVersion),
          );
    });

    developer.log(
      'seed catalog imported: $inserted foods at $seedVersion',
      name: 'seed',
    );
    return inserted;
  }

  static FoodAliasesRow _aliasRow(SeedFood food, FoodAlias alias) =>
      FoodAliasesRow(
        foodId: food.id,
        alias: alias.alias,
        language: alias.language.name,
      );

  static FoodPortionsRow _portionRow(SeedFood food, Portion portion) =>
      FoodPortionsRow(
        foodId: food.id,
        unit: portion.unit.name,
        quantity: portion.quantity,
        grams: portion.grams,
      );
}
