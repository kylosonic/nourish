/// One water intake record (WW-01).
class WaterLog {
  WaterLog({
    required this.id,
    required this.dateKey,
    required this.amountMl,
    required this.loggedAt,
  });

  final String id;

  /// Local calendar day as `yyyy-MM-dd`.
  final String dateKey;

  /// Amount consumed in milliliters (always positive).
  final int amountMl;

  /// When the record was created.
  final DateTime loggedAt;
}
