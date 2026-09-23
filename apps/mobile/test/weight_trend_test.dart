import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/features/weight/weight_trend.dart';
import 'package:nourish_mobile/l10n/strings.dart';

/// WW-03 acceptance: the trend is computed over logged entries, same-day
/// entries aggregate, and the copy never alarm on ±0.5 kg day-to-day noise.
void main() {
  WeightEntry entry(String dateKey, double kg, {int hour = 7}) => WeightEntry(
    dateKey: dateKey,
    weightKg: kg,
    loggedAt: DateTime.parse('${dateKey}T${hour.toString().padLeft(2, '0')}:00:00'),
  );

  group('computeWeightTrend', () {
    test('no entries: empty trend with nothing invented', () {
      final WeightTrend trend = computeWeightTrend(entries: <WeightEntry>[]);
      expect(trend.isEmpty, isTrue);
      expect(trend.latestKg, isNull);
      expect(trend.changeKg, isNull);
      expect(trend.smoothedChangeKg, isNull);
      expect(trend.entryCount, 0);
      expect(trend.points, isEmpty);
    });

    test('one entry: a point, but no change to report', () {
      final WeightTrend trend = computeWeightTrend(
        entries: <WeightEntry>[entry('2026-08-01', 70)],
        targetKg: 65,
      );
      expect(trend.points, hasLength(1));
      expect(trend.latestKg, 70);
      expect(trend.targetKg, 65);
      expect(trend.entryCount, 1);
      expect(
        trend.changeKg,
        isNull,
        reason: 'a single logged day cannot show a direction',
      );
      expect(trend.isWithinNoise, isTrue);
    });

    test('several same-day entries are averaged into that day', () {
      final WeightTrend trend = computeWeightTrend(
        entries: <WeightEntry>[
          entry('2026-08-01', 70, hour: 6),
          entry('2026-08-01', 71, hour: 18),
          entry('2026-08-02', 68, hour: 7),
        ],
      );
      expect(trend.points, hasLength(2), reason: 'one point per logged day');
      expect(trend.points.first.meanKg, 70.5);
      expect(trend.points.first.entries, 2);
      expect(trend.points.last.meanKg, 68);
      expect(trend.points.last.entries, 1);
      expect(
        trend.latestKg,
        68,
        reason: 'current weight is the most recent entry, not the day mean',
      );
      expect(trend.entryCount, 3);
    });

    test('points are ordered by calendar day even when logged out of order', () {
      final WeightTrend trend = computeWeightTrend(
        entries: <WeightEntry>[
          entry('2026-08-03', 69),
          entry('2026-08-01', 71),
          entry('2026-08-02', 70),
        ],
      );
      expect(
        trend.points.map((WeightTrendPoint p) => p.dateKey).toList(),
        <String>['2026-08-01', '2026-08-02', '2026-08-03'],
      );
    });

    test('back-filled historical entries keep their given dates', () {
      final WeightTrend trend = computeWeightTrend(
        entries: <WeightEntry>[
          entry('2026-07-01', 75),
          // Logged today, but it belongs to 1 August.
          WeightEntry(
            dateKey: '2026-08-01',
            weightKg: 72,
            loggedAt: DateTime.parse('2026-08-20T09:00:00'),
          ),
          entry('2026-08-20', 70),
        ],
      );
      expect(
        trend.points.map((WeightTrendPoint p) => p.dateKey).toList(),
        <String>['2026-07-01', '2026-08-01', '2026-08-20'],
      );
      expect(
        trend.latestKg,
        70,
        reason: 'current weight follows the measured day, not the typing order',
      );
    });

    test('the smoothed line damps a single-day spike instead of following it',
        () {
      // Seven flat days at 70 kg, then one day at 74 kg. A raw view shows a
      // 4 kg jump; the trailing mean shows a seventh of it.
      final List<WeightEntry> entries = <WeightEntry>[
        for (int day = 1; day <= 7; day++) entry('2026-08-0$day', 70),
        entry('2026-08-08', 74),
      ];
      final WeightTrend trend = computeWeightTrend(entries: entries);

      expect(trend.points.last.meanKg, 74);
      expect(
        trend.points.last.smoothedKg,
        lessThan(71),
        reason: 'the trend line is the trailing mean, not the day value',
      );
      expect(trend.changeKg, closeTo(4, 1e-9));
      expect(trend.smoothedChangeKg, closeTo(4 / 7, 1e-9));
      expect(
        trend.isWithinNoise,
        isFalse,
        reason: 'the smoothed move clears the 0.5 kg noise band',
      );
    });

    test('the smoothing window is trailing and bounded', () {
      final WeightTrend trend = computeWeightTrend(
        entries: <WeightEntry>[
          for (int day = 1; day <= 3; day++) entry('2026-08-0$day', 60),
          entry('2026-08-04', 80),
        ],
        smoothingWindow: 3,
      );
      // Days 1-3 average 60; day 4's window is days 2-4 = (60+60+80)/3.
      expect(trend.points[0].smoothedKg, closeTo(60, 1e-9));
      expect(trend.points[3].smoothedKg, closeTo(66.666666, 1e-6));
    });

    test('movement under 0.5 kg is inside the noise band', () {
      final WeightTrend trend = computeWeightTrend(
        entries: <WeightEntry>[
          entry('2026-08-01', 70),
          entry('2026-08-02', 70.4),
        ],
      );
      expect(trend.isWithinNoise, isTrue);
      expect(describeWeightChange(trend), Strings.weightWithinNoise);
    });

    test('a real move is described in words with its size', () {
      final WeightTrend trend = computeWeightTrend(
        entries: <WeightEntry>[
          entry('2026-08-01', 74),
          entry('2026-08-02', 72),
        ],
      );
      // Two days: the trailing mean has only today and yesterday to average,
      // so the smoothed move is half the raw move.
      expect(trend.changeKg, closeTo(-2, 1e-9));
      expect(trend.smoothedChangeKg, closeTo(-1, 1e-9));
      expect(
        describeWeightChange(trend),
        'Trending down 1.0 kg across 2 logged days.',
      );
    });

    test('a single entry asks for one more rather than claiming a trend', () {
      final WeightTrend trend = computeWeightTrend(
        entries: <WeightEntry>[entry('2026-08-01', 70)],
      );
      expect(describeWeightChange(trend), 'Log again to see a trend.');
    });
  });

  group('validateWeightInput (SAFE-01 boundaries)', () {
    test('accepts a value inside the range', () {
      expect(validateWeightInput('68.5'), isNull);
      expect(validateWeightInput(' 70 '), isNull);
    });

    test('accepts the range boundaries themselves', () {
      expect(validateWeightInput('30'), isNull);
      expect(validateWeightInput('350'), isNull);
    });

    test('rejects a value below or above the range', () {
      expect(validateWeightInput('29.9'), isNotNull);
      expect(validateWeightInput('350.1'), isNotNull);
    });

    test('rejects empty and non-numeric input', () {
      expect(validateWeightInput(''), isNotNull);
      expect(validateWeightInput('   '), isNotNull);
      expect(validateWeightInput('seventy'), isNotNull);
    });

    test('accepts a comma decimal separator (typed on some keyboards)', () {
      expect(validateWeightInput('68,5'), isNull);
    });
  });
}
