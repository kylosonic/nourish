import 'package:drift/drift.dart';

/// Drift table definitions for the local-only Nourish database
/// (blueprint §13). No remote schema exists: this file is the single
/// source of truth for SQLite structure.
///
/// Enum-like columns (language, goal, slot, ...) store the Dart `name` of
/// the corresponding `nourish_domain` enum; repositories own the mapping.

/// Singleton user profile row (ONB-09 resume state).
///
/// Deliberately has no primary key: exactly one row exists per install,
/// created lazily on first boot by `ProfileDao.getOrCreate`.
@DataClassName('UserProfileRow')
class UserProfileTable extends Table {
  TextColumn get language => text().withDefault(const Constant('en'))();

  TextColumn get goal => text().nullable()();

  TextColumn get sex => text().nullable()();

  IntColumn get age => integer().nullable()();

  RealColumn get heightCm => real().nullable()();

  RealColumn get currentWeightKg => real().nullable()();

  RealColumn get targetWeightKg => real().nullable()();

  TextColumn get activity => text().nullable()();

  TextColumn get pace => text().nullable()();

  TextColumn get foodPreference => text().nullable()();

  BoolColumn get onboardingComplete =>
      boolean().withDefault(const Constant(false))();

  /// Number of completed counted onboarding steps (0..T), see
  /// `firstUnansweredRoute` in `router/app_router.dart`.
  IntColumn get currentOnboardingStep =>
      integer().withDefault(const Constant(0))();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
}

/// Canonical food catalog rows.
@DataClassName('FoodsRow')
class Foods extends Table {
  TextColumn get id => text()();

  TextColumn get canonicalName => text()();

  /// One of the search-chip categories: Ethiopian, Breakfast, Lunch,
  /// Dinner, Snacks.
  TextColumn get category => text()();

  TextColumn get defaultPortionUnit => text()();

  RealColumn get defaultPortionQty => real().withDefault(const Constant(1))();

  RealColumn get defaultPortionGrams => real()();

  RealColumn get per100gKcal => real()();

  RealColumn get per100gProtein => real()();

  RealColumn get per100gCarbs => real()();

  RealColumn get per100gFat => real()();

  RealColumn get per100gFiber => real().nullable()();

  RealColumn get per100gSodium => real().nullable()();

  TextColumn get sourceName => text()();

  TextColumn get sourceVersion => text().nullable()();

  /// Food code within the source dataset (FCT rows; null for seed rows).
  TextColumn get sourceFoodCode => text().nullable()();

  /// Human-readable citation/reference of the source row (FCT rows;
  /// null for seed rows).
  TextColumn get sourceReference => text().nullable()();

  /// When the source row was imported (FCT rows; null for seed rows).
  DateTimeColumn get importDate => dateTime().nullable()();

  BoolColumn get isSeed => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Localized search aliases for catalog foods (including Amharic).
@DataClassName('FoodAliasesRow')
class FoodAliases extends Table {
  TextColumn get foodId => text().references(Foods, #id)();

  TextColumn get alias => text()();

  /// `AppLanguage.name` of the alias text.
  TextColumn get language => text()();

  @override
  Set<Column> get primaryKey => {foodId, alias};
}

/// Per-food portion conversion table (a bowl of shiro ≠ a bowl of pasta).
@DataClassName('FoodPortionsRow')
class FoodPortions extends Table {
  TextColumn get foodId => text().references(Foods, #id)();

  /// `PortionUnit.name`.
  TextColumn get unit => text()();

  RealColumn get quantity => real().withDefault(const Constant(1))();

  RealColumn get grams => real()();

  @override
  Set<Column> get primaryKey => {foodId, unit};
}

/// Append-only daily target history (TGT-01 edge case: every re-derivation
/// writes a new row; historical rows are never rewritten).
@DataClassName('DailyTargetsRow')
class DailyTargets extends Table {
  IntColumn get id => integer().autoIncrement()();

  IntColumn get targetKcal => integer()();

  IntColumn get proteinG => integer()();

  IntColumn get carbsG => integer()();

  IntColumn get fatG => integer()();

  RealColumn get bmrKcal => real()();

  RealColumn get tdeeKcal => real()();

  RealColumn get goalAdjustmentKcal => real()();

  RealColumn get activityFactor => real()();

  TextColumn get pace => text().nullable()();

  TextColumn get formulaVersion => text()();

  DateTimeColumn get dateGenerated => dateTime()();

  IntColumn get floorKcal => integer()();
}

/// One logged eating occasion (a slot on a calendar day).
@DataClassName('MealsRow')
class Meals extends Table {
  IntColumn get id => integer().autoIncrement()();

  /// Local calendar day as `yyyy-MM-dd`.
  TextColumn get dateKey => text()();

  /// `MealSlot.name`.
  TextColumn get slot => text()();

  DateTimeColumn get createdAt => dateTime()();
}

/// One food entry inside a meal, frozen with its nutrition snapshot
/// (TGT-04): history renders these columns, never the live catalog.
@DataClassName('MealItemsRow')
class MealItems extends Table {
  IntColumn get id => integer().autoIncrement()();

  IntColumn get mealId => integer().references(Meals, #id)();

  TextColumn get foodId => text()();

  /// Display name copied at log time.
  TextColumn get foodName => text()();

  /// `PortionUnit.name`.
  TextColumn get portionUnit => text()();

  RealColumn get portionQuantity => real()();

  RealColumn get grams => real()();

  RealColumn get kcal => real()();

  RealColumn get proteinG => real()();

  RealColumn get carbsG => real()();

  RealColumn get fatG => real()();

  RealColumn get fiberG => real().nullable()();

  RealColumn get sodiumMg => real().nullable()();
}

/// Water intake records. Entries may be signed: removals (minus button)
/// are stored as negative amounts; the repository clamps the daily total
/// at zero.
@DataClassName('WaterLogsRow')
class WaterLogs extends Table {
  IntColumn get id => integer().autoIncrement()();

  /// Local calendar day as `yyyy-MM-dd`.
  TextColumn get dateKey => text()();

  IntColumn get amountMl => integer()();

  DateTimeColumn get loggedAt => dateTime()();
}

/// Key/value metadata for one-shot import guards (seed version).
@DataClassName('SeedMetaRow')
class SeedMeta extends Table {
  TextColumn get key => text()();

  TextColumn get value => text()();

  @override
  Set<Column> get primaryKey => {key};
}

/// Weight entries (WW-03).
///
/// One row per *entry*, not per day: the behavior contract allows several
/// same-day entries and requires a back-filled entry to keep the date it was
/// given. The trend is therefore computed over entries and only then grouped by
/// day, never on a one-row-per-day assumption.
@DataClassName('WeightLogsRow')
class WeightLogs extends Table {
  IntColumn get id => integer().autoIncrement()();

  /// Local calendar day as `yyyy-MM-dd` — the day the entry is *for*, which may
  /// be earlier than the day it was recorded.
  TextColumn get dateKey => text()();

  /// Kilograms, checked against the SAFE-01 body range before it is written.
  RealColumn get weightKg => real()();

  DateTimeColumn get loggedAt => dateTime()();
}
