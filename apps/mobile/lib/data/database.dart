import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'daos/food_dao.dart';
import 'daos/meal_dao.dart';
import 'daos/profile_dao.dart';
import 'daos/target_dao.dart';
import 'daos/water_dao.dart';
import 'tables/tables.dart';

part 'database.g.dart';

/// The single local SQLite database for Nourish (schema version 1).
///
/// Future slices add tables through versioned Drift migrations; the seed
/// catalog re-import is guarded separately by `seed_meta` (blueprint §17).
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
    SeedMeta,
  ],
  daos: [ProfileDao, FoodDao, MealDao, WaterDao, TargetDao],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  /// Opens the on-device database file via drift_flutter
  /// (path_provider-backed), for Android/iOS/Windows.
  static Future<AppDatabase> open() async {
    return AppDatabase(driftDatabase(name: 'nourish'));
  }

  @override
  int get schemaVersion => 1;
}
