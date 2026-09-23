import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/weight_repository.dart';
import 'package:nourish_mobile/features/weight/weight_trend.dart';

import 'test_helpers.dart';

/// WW-03 over the real (in-memory) database: entries persist, the trend window
/// is the trailing calendar range, and nothing is ever silently dropped.
void main() {
  late AppDatabase db;
  late WeightRepository repository;

  setUp(() async {
    db = await openSeededDb();
    repository = WeightRepository(db);
  });

  tearDown(() async => db.close());

  group('WeightRepository (WW-03)', () {
    test('a logged entry is readable with its day and timestamp', () async {
      final DateTime at = DateTime.parse('2026-08-26T07:30:00');
      await repository.log(weightKg: 68.4, loggedAt: at);

      final List<WeightEntry> history = await repository.history();
      expect(history, hasLength(1));
      expect(history.first.weightKg, 68.4);
      expect(history.first.dateKey, '2026-08-26');
      expect(history.first.loggedAt, at);
    });

    test('an explicit dateKey back-fills without changing the logged time',
        () async {
      await repository.log(
        weightKg: 72,
        dateKey: '2026-08-01',
        loggedAt: DateTime.parse('2026-08-26T08:00:00'),
      );
      final WeightEntry entry = (await repository.history()).single;
      expect(entry.dateKey, '2026-08-01');
      expect(entry.loggedAt, DateTime.parse('2026-08-26T08:00:00'));
    });

    test('multiple same-day entries are all kept', () async {
      await repository.log(
        weightKg: 70,
        dateKey: '2026-08-26',
        loggedAt: DateTime.parse('2026-08-26T06:00:00'),
      );
      await repository.log(
        weightKg: 71,
        dateKey: '2026-08-26',
        loggedAt: DateTime.parse('2026-08-26T18:00:00'),
      );
      expect(await repository.history(), hasLength(2));
      expect((await repository.latest())!.weightKg, 71);
    });

    test('history is newest first by measured day, not by typing order',
        () async {
      await repository.log(
        weightKg: 72,
        dateKey: '2026-08-01',
        loggedAt: DateTime.parse('2026-08-26T09:00:00'),
      );
      await repository.log(
        weightKg: 70,
        dateKey: '2026-08-26',
        loggedAt: DateTime.parse('2026-08-26T07:00:00'),
      );

      final List<WeightEntry> history = await repository.history();
      expect(
        history.map((WeightEntry e) => e.dateKey).toList(),
        <String>['2026-08-26', '2026-08-01'],
      );
      expect(
        (await repository.latest())!.weightKg,
        70,
        reason: 'the back-filled entry is not "current"',
      );
    });

    test('a value outside the SAFE-01 range is rejected, not stored', () async {
      await expectLater(
        repository.log(weightKg: 12),
        throwsA(isA<ArgumentError>()),
      );
      await expectLater(
        repository.log(weightKg: 400),
        throwsA(isA<ArgumentError>()),
      );
      expect(await repository.history(), isEmpty);
    });

    test('watchHistory emits the entry as soon as it is written', () async {
      final Stream<List<WeightEntry>> stream = repository.watchHistory();
      final Future<List<WeightEntry>> first = stream.first;
      await repository.log(weightKg: 69.2);
      expect((await first).single.weightKg, 69.2);
    });

    group('trend window', () {
      final DateTime today = DateTime.parse('2026-08-26T10:00:00');

      Future<void> logOn(String dateKey, double kg) => repository.log(
        weightKg: kg,
        dateKey: dateKey,
        loggedAt: DateTime.parse('${dateKey}T07:00:00'),
      );

      test('the weekly window covers the trailing seven days inclusive',
          () async {
        await logOn('2026-08-20', 70); // 7 days back: inside a 7-day window
        await logOn('2026-08-19', 75); // 8 days back: outside it
        await logOn('2026-08-26', 69);

        final WeightTrend week = await repository.trend(
          days: 7,
          at: today,
          targetKg: 68,
        );
        expect(
          week.points.map((WeightTrendPoint p) => p.dateKey).toList(),
          <String>['2026-08-20', '2026-08-26'],
        );
        expect(week.targetKg, 68);
      });

      test('the monthly window reaches back thirty days', () async {
        await logOn('2026-07-28', 75); // 30 days back inclusive
        await logOn('2026-07-27', 76); // 31 days back: outside
        await logOn('2026-08-26', 69);

        final WeightTrend month = await repository.trend(days: 30, at: today);
        expect(
          month.points.map((WeightTrendPoint p) => p.dateKey).toList(),
          <String>['2026-07-28', '2026-08-26'],
        );
      });

      test('a future-dated row cannot leak into the window', () async {
        // A device clock that was briefly wrong must not quietly move the
        // trend; the window ends today.
        await logOn('2026-09-10', 60);
        final WeightTrend week = await repository.trend(days: 7, at: today);
        expect(week.isEmpty, isTrue);
      });

      test('no entries in the window yields an empty trend, not zeroes',
          () async {
        final WeightTrend week = await repository.trend(days: 7, at: today);
        expect(week.isEmpty, isTrue);
        expect(week.latestKg, isNull);
        expect(week.changeKg, isNull);
      });
    });

    test('nothing is seeded into the history from the onboarding answers',
        () async {
      // The onboarding weight is a stated value, not a weigh-in, and the
      // history is a record of what the scale said. The repository therefore
      // has no seeding path at all: an install that has never logged a weight
      // shows an empty history.
      expect(await repository.history(), isEmpty);
      expect(await repository.latest(), isNull);
    });
  });
}
