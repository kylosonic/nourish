/// Self-reported physical activity level, with the multiplier applied to
/// BMR to derive TDEE (blueprint section 8).
enum Activity {
  sedentary(1.2),
  light(1.375),
  moderate(1.55),
  veryActive(1.725),
  athlete(1.9);

  const Activity(this.factor);

  /// Multiplier applied to BMR to derive TDEE.
  final double factor;
}
