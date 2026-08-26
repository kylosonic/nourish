/// Catalog nutrition descriptor per 100 g of edible portion.
///
/// Deliberately mutable: catalog rows ([Food.per100g]) may be adjusted
/// during import. What must never change is the snapshot; see
/// [NutritionSnapshot].
class NutritionPer100g {
  NutritionPer100g({
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.fiberG,
    this.sodiumMg,
  });

  /// Energy in kilocalories per 100 g.
  double kcal;

  /// Protein in grams per 100 g.
  double proteinG;

  /// Carbohydrates in grams per 100 g.
  double carbsG;

  /// Fat in grams per 100 g.
  double fatG;

  /// Dietary fiber in grams per 100 g (optional).
  double? fiberG;

  /// Sodium in milligrams per 100 g (optional).
  double? sodiumMg;
}

/// Immutable capture of nutrition for a specific amount of food.
///
/// Snapshots are computed at save time and stored with meal items
/// (TGT-04): history renders only snapshots, so later catalog edits
/// never rewrite what a user already logged.
class NutritionSnapshot {
  const NutritionSnapshot({
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.fiberG,
    this.sodiumMg,
  });

  /// Energy in kilocalories for this amount.
  final double kcal;

  /// Protein in grams for this amount.
  final double proteinG;

  /// Carbohydrates in grams for this amount.
  final double carbsG;

  /// Fat in grams for this amount.
  final double fatG;

  /// Dietary fiber in grams for this amount (optional).
  final double? fiberG;

  /// Sodium in milligrams for this amount (optional).
  final double? sodiumMg;

  /// Returns a NEW snapshot with the given fields replaced.
  ///
  /// Note: passing `null` keeps the current value; omit a parameter to
  /// leave the field unchanged.
  NutritionSnapshot copyWith({
    double? kcal,
    double? proteinG,
    double? carbsG,
    double? fatG,
    double? fiberG,
    double? sodiumMg,
  }) {
    return NutritionSnapshot(
      kcal: kcal ?? this.kcal,
      proteinG: proteinG ?? this.proteinG,
      carbsG: carbsG ?? this.carbsG,
      fatG: fatG ?? this.fatG,
      fiberG: fiberG ?? this.fiberG,
      sodiumMg: sodiumMg ?? this.sodiumMg,
    );
  }
}
