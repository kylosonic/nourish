/// Weight logging and trend (WW-03).
///
/// Pure functions in this file: the trend is the part a user will act on, so the
/// smoothing rule is pinned by tests rather than tuned by eye.
library;

/// One recorded entry, as the UI thinks about it.
class WeightEntry {
  const WeightEntry({
    required this.dateKey,
    required this.weightKg,
    required this.loggedAt,
  });

  final String dateKey;
  final double weightKg;
  final DateTime loggedAt;

  /// Newest first, in measured time: the day the weight belongs to decides,
  /// and `loggedAt` only breaks a tie inside the same day. A back-filled entry
  /// for an old date therefore sorts by that old date — even though it was
  /// typed today — so "current weight" stays what the scale last said.
  static int newestFirst(WeightEntry a, WeightEntry b) {
    final int byDay = b.dateKey.compareTo(a.dateKey);
    return byDay != 0 ? byDay : b.loggedAt.compareTo(a.loggedAt);
  }
}

/// The weight trend over a window.
class WeightTrend {
  const WeightTrend({
    required this.points,
    required this.latestKg,
    required this.targetKg,
    required this.entryCount,
    required this.changeKg,
    required this.smoothedChangeKg,
  });

  /// One point per day that has at least one entry, oldest first. The value is
  /// that day's mean when several entries exist.
  final List<WeightTrendPoint> points;

  /// The most recent entry's value — the number the user recognises as "now".
  final double? latestKg;

  final double? targetKg;
  final int entryCount;

  /// Raw change across the window: latest day's mean minus the first day's mean.
  final double? changeKg;

  /// Change between the smoothed start and end — the number worth showing.
  final double? smoothedChangeKg;

  bool get isEmpty => points.isEmpty;

  /// True when the movement is inside normal day-to-day noise. The contract
  /// says the UI must not alarm on ±0.5 kg, so the copy for this case is
  /// deliberately neutral rather than celebratory or cautionary.
  bool get isWithinNoise =>
      smoothedChangeKg == null || smoothedChangeKg!.abs() < weightNoiseBandKg;
}

/// The ±0.5 kg band WW-03 calls normal day-to-day movement.
///
/// Declared once and shared: the weight screen and the insights highlight both
/// have to agree on where noise ends, and two copies of the number would drift.
const double weightNoiseBandKg = 0.5;

class WeightTrendPoint {
  const WeightTrendPoint({
    required this.dateKey,
    required this.meanKg,
    required this.smoothedKg,
    required this.entries,
  });

  final String dateKey;

  /// The day's mean of its entries.
  final double meanKg;

  /// Trailing-window mean up to and including this day — the trend line.
  final double smoothedKg;

  final int entries;
}

/// Entries allowed per day before the mean is taken. Several same-day weigh-ins
/// are legitimate (WW-03 edge case); the day's mean is their summary.
WeightTrend computeWeightTrend({
  required List<WeightEntry> entries,
  double? targetKg,
  int smoothingWindow = 7,
}) {
  if (entries.isEmpty) {
    return WeightTrend(
      points: const <WeightTrendPoint>[],
      latestKg: null,
      targetKg: targetKg,
      entryCount: 0,
      changeKg: null,
      smoothedChangeKg: null,
    );
  }

  // Group by day, keeping the calendar order (keys are ISO strings).
  final Map<String, List<WeightEntry>> byDay = <String, List<WeightEntry>>{};
  for (final WeightEntry entry in entries) {
    byDay.putIfAbsent(entry.dateKey, () => <WeightEntry>[]).add(entry);
  }
  final List<String> days = byDay.keys.toList()..sort();

  final List<WeightTrendPoint> points = <WeightTrendPoint>[];
  final List<double> trailing = <double>[];
  for (final String day in days) {
    final List<WeightEntry> dayEntries = byDay[day]!;
    final double mean =
        dayEntries.fold<double>(0, (double sum, WeightEntry e) => sum + e.weightKg) /
            dayEntries.length;
    trailing.add(mean);
    if (trailing.length > smoothingWindow) trailing.removeAt(0);
    final double smoothed =
        trailing.reduce((double a, double b) => a + b) / trailing.length;
    points.add(
      WeightTrendPoint(
        dateKey: day,
        meanKg: mean,
        smoothedKg: smoothed,
        entries: dayEntries.length,
      ),
    );
  }

  final List<WeightEntry> sortedByTime = <WeightEntry>[...entries]
    ..sort(WeightEntry.newestFirst);
  final double? latest = sortedByTime.isEmpty ? null : sortedByTime.first.weightKg;

  return WeightTrend(
    points: points,
    latestKg: latest,
    targetKg: targetKg,
    entryCount: entries.length,
    changeKg: points.length < 2 ? null : points.last.meanKg - points.first.meanKg,
    smoothedChangeKg: points.length < 2
        ? null
        : points.last.smoothedKg - points.first.smoothedKg,
  );
}

/// SAFE-01 body-weight range used by onboarding (PPA-3). Entry outside it is
/// rejected at the field rather than stored and corrected later.
const double minWeightKg = 30;
const double maxWeightKg = 350;

/// Validate a typed weight. Returns null when it is acceptable, otherwise the
/// message to show next to the field.
String? validateWeightInput(String raw) {
  final String trimmed = raw.trim();
  if (trimmed.isEmpty) return 'Enter your weight.';
  final double? value = double.tryParse(trimmed.replaceAll(',', '.'));
  if (value == null) return 'That does not look like a number.';
  if (value < minWeightKg || value > maxWeightKg) {
    return 'Enter a weight between ${minWeightKg.round()} and ${maxWeightKg.round()} kg.';
  }
  return null;
}

/// Trend direction in words, avoiding alarm at normal noise.
String describeWeightChange(WeightTrend trend) {
  final double? change = trend.smoothedChangeKg;
  if (change == null) return 'Log again to see a trend.';
  if (trend.isWithinNoise) {
    return 'Holding steady — day-to-day changes of under 0.5 kg are normal.';
  }
  final String direction = change < 0 ? 'down' : 'up';
  return 'Trending $direction ${change.abs().toStringAsFixed(1)} kg across ${trend.points.length} logged days.';
}
