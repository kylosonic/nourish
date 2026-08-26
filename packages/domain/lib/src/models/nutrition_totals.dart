import 'nutrition.dart';

/// Aggregated nutrition across meal items (or across a whole day).
///
/// Fiber and sodium default to zero when the source snapshot omits them.
class NutritionTotals {
  const NutritionTotals({
    this.kcal = 0,
    this.protein = 0,
    this.carbs = 0,
    this.fat = 0,
    this.fiber = 0,
    this.sodium = 0,
  });

  final double kcal;
  final double protein;
  final double carbs;
  final double fat;
  final double fiber;
  final double sodium;

  /// The empty total (additive identity).
  static const NutritionTotals zero = NutritionTotals();

  /// Builds a total from a single [NutritionSnapshot].
  ///
  /// A factory (not const): a const constructor cannot read parameter
  /// fields in its initializer list.
  factory NutritionTotals.fromSnapshot(NutritionSnapshot snapshot) {
    return NutritionTotals(
      kcal: snapshot.kcal,
      protein: snapshot.proteinG,
      carbs: snapshot.carbsG,
      fat: snapshot.fatG,
      fiber: snapshot.fiberG ?? 0,
      sodium: snapshot.sodiumMg ?? 0,
    );
  }

  /// Component-wise addition.
  NutritionTotals operator +(NutritionTotals other) {
    return NutritionTotals(
      kcal: kcal + other.kcal,
      protein: protein + other.protein,
      carbs: carbs + other.carbs,
      fat: fat + other.fat,
      fiber: fiber + other.fiber,
      sodium: sodium + other.sodium,
    );
  }
}
