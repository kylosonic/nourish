import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/water_repository.dart';

import 'test_helpers.dart';

void main() {
  late AppDatabase db;
  late WaterRepository repository;

  const String dateKey = '2026-08-26';

  setUp(() async {
    db = await openSeededDb();
    repository = WaterRepository(db);
  });

  tearDown(() async => db.close());

  group('WaterRepository (WW-01 subset)', () {
    test('addMl defaults to +250 ml', () async {
      await repository.addMl(dateKey: dateKey);
      expect(await repository.dailyTotalMl(dateKey), 250);
    });

    test('repeated adds accumulate', () async {
      await repository.addMl(dateKey: dateKey);
      await repository.addMl(dateKey: dateKey);
      expect(await repository.dailyTotalMl(dateKey), 500);
    });

    test('removeMl defaults to -250 ml', () async {
      await repository.addMl(amountMl: 500, dateKey: dateKey);
      await repository.removeMl(dateKey: dateKey);
      expect(await repository.dailyTotalMl(dateKey), 250);
    });

    test('remove is clamped at zero (floor)', () async {
      await repository.addMl(amountMl: 250, dateKey: dateKey);
      await repository.removeMl(amountMl: 500, dateKey: dateKey);
      expect(
        await repository.dailyTotalMl(dateKey),
        0,
        reason: 'never below zero',
      );
    });

    test('remove from zero stays at zero', () async {
      await repository.removeMl(amountMl: 250, dateKey: dateKey);
      expect(await repository.dailyTotalMl(dateKey), 0);
    });

    test('removals are stored as signed log entries (audit trail)', () async {
      await repository.addMl(amountMl: 250, dateKey: dateKey);
      await repository.removeMl(amountMl: 250, dateKey: dateKey);
      final logs = await db.waterDao.rawLogsForDate(dateKey);
      expect(logs.length, 2);
      expect(logs.map((l) => l.amountMl).toList(), <int>[250, -250]);
    });

    test('negative addMl input is treated as a positive add', () async {
      await repository.addMl(amountMl: -250, dateKey: dateKey);
      expect(await repository.dailyTotalMl(dateKey), 250);
    });
  });
}
