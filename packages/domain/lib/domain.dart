/// Nourish domain layer: pure Dart, zero runtime dependencies.
///
/// Value models live in `src/models/`, deterministic engines in
/// `src/engines/`. Nothing in this package may depend on Flutter.
library;

export 'src/models/activity.dart';
export 'src/models/daily_target.dart';
export 'src/models/food.dart';
export 'src/models/food_alias.dart';
export 'src/models/food_preference.dart';
export 'src/models/food_source.dart';
export 'src/models/goal.dart';
export 'src/models/language.dart';
export 'src/models/meal.dart';
export 'src/models/meal_item.dart';
export 'src/models/meal_slot.dart';
export 'src/models/nutrition.dart';
export 'src/models/nutrition_totals.dart';
export 'src/models/pace.dart';
export 'src/models/portion.dart';
export 'src/models/portion_unit.dart';
export 'src/models/sex.dart';
export 'src/models/user_profile.dart';
export 'src/models/water_log.dart';
export 'src/engines/daily_totals.dart';
export 'src/engines/nutrition_engine.dart';
export 'src/engines/portion_engine.dart';
export 'src/engines/target_engine.dart';
