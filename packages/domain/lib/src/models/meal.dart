import 'meal_item.dart';
import 'meal_slot.dart';
import 'nutrition_totals.dart';

/// One logged eating occasion (breakfast, lunch, ...) on a calendar day.
class Meal {
  Meal({
    required this.id,
    required this.dateKey,
    required this.slot,
    required this.createdAt,
    this.items = const [],
  });

  final String id;

  /// Local calendar day as `yyyy-MM-dd`.
  final String dateKey;

  /// Which slot this meal belongs to.
  final MealSlot slot;

  /// When the meal was logged.
  final DateTime createdAt;

  /// Items in this meal, each with its immutable snapshot.
  final List<MealItem> items;

  /// Sum of every item's snapshot.
  NutritionTotals get totals {
    return items.fold<NutritionTotals>(
      NutritionTotals.zero,
      (NutritionTotals acc, MealItem item) =>
          acc + NutritionTotals.fromSnapshot(item.snapshot),
    );
  }
}
