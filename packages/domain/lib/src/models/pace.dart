/// Weight-loss pace. Encodes the daily calorie deficit applied to TDEE
/// when the goal is [Goal.loseWeight].
enum Pace {
  conservative(-250),
  moderate(-500),
  aggressive(-1000);

  const Pace(this.kcalPerDay);

  /// Daily calorie deficit subtracted from TDEE (negative kcal value).
  final int kcalPerDay;
}
