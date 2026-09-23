import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'daos/food_dao.dart';
import 'daos/meal_dao.dart';
import 'daos/profile_dao.dart';
import 'daos/target_dao.dart';
import 'daos/water_dao.dart';
import 'daos/weight_dao.dart';
import 'tables/tables.dart';

part 'database.g.dart';

/// The single local SQLite database for Nourish (schema version 4).
///
/// v1→v2 adds the FCT provenance columns to [Foods] (additive, nullable,
/// on-device upgrade safe — blueprint S1 §11). v3 adds [WeightLogs], v4 adds
/// the adjustable water goal to the profile row. Future slices add tables
/// through versioned Drift migrations; the seed catalog re-import is
/// guarded separately by `seed_meta` (blueprint §17).
@DriftDatabase(
  tables: [
    UserProfileTable,
    Foods,
    FoodAliases,
    FoodPortions,
    DailyTargets,
    Meals,
    MealItems,
    WaterLogs,
    WeightLogs,
    SeedMeta,
  ],
  daos: [ProfileDao, FoodDao, MealDao, WaterDao, WeightDao, TargetDao],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  /// Opens the on-device database file via drift_flutter
  /// (path_provider-backed), for Android/iOS/Windows.
  static Future<AppDatabase> open() async {
    return AppDatabase(driftDatabase(name: 'nourish'));
  }

  @override
  int get schemaVersion => 4;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (Migrator m) async {
      await m.createAll();
    },
    onUpgrade: (Migrator m, int from, int to) async {
      if (from < 2) {
        // Additive nullable columns only: seed rows keep null values.
        await m.addColumn(foods, foods.sourceFoodCode);
        await m.addColumn(foods, foods.sourceReference);
        await m.addColumn(foods, foods.importDate);
      }
      if (from < 3) {
        // v3 adds the weight log table (WW-03). Additive: no existing table is
        // touched and no user data is rewritten.
        await m.createTable(weightLogs);
      }
      if (from < 4) {
        // v4 makes the water goal adjustable (WW-01). Nullable, so an existing
        // install keeps the documented default until the user changes it.
        await m.addColumn(userProfileTable, userProfileTable.waterTargetMl);
      }
    },
  );
}
