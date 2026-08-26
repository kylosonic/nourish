/// Canonical meal slots (ADR-0003 / PPA-5).
enum MealSlot {
  breakfast,
  lunch,
  dinner,
  snack,
  other;

  /// Human-readable English label (S0 ships English-only strings, PPA-6).
  String get displayName => switch (this) {
        MealSlot.breakfast => 'Breakfast',
        MealSlot.lunch => 'Lunch',
        MealSlot.dinner => 'Dinner',
        MealSlot.snack => 'Snack',
        MealSlot.other => 'Other',
      };
}
