/// The user's primary goal selected during onboarding (ONB-03).
enum Goal {
  /// Eat below TDEE to reduce body weight.
  loseWeight,

  /// Eat above TDEE to gain lean mass.
  buildMuscle,

  /// Eat at TDEE to hold current weight.
  maintainWeight,

  /// No weight goal; focus on food quality (treated as maintenance).
  eatHealthier,
}
