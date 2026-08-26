import 'nutrition.dart';
import 'portion_unit.dart';

/// One food entry inside a meal, frozen with its nutrition snapshot.
class MealItem {
  const MealItem({
    required this.id,
    required this.mealId,
    required this.foodId,
    required this.foodName,
    required this.portionUnit,
    required this.portionQuantity,
    required this.grams,
    required this.snapshot,
  });

  final String id;
  final String mealId;
  final String foodId;

  /// Display name copied at log time (renders even if the catalog
  /// changes later).
  final String foodName;

  final PortionUnit portionUnit;

  /// How many of [portionUnit] were logged (for example 1 injera).
  final double portionQuantity;

  /// Converted weight in grams.
  final double grams;

  /// Immutable nutrition for this item at log time (TGT-04).
  final NutritionSnapshot snapshot;
}
