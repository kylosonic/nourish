import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/food_repository.dart';
import 'package:nourish_mobile/data/seed/seed_catalog.dart';
import 'package:nourish_mobile/data/seed/seed_importer.dart';

void main() {
  late AppDatabase db;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
  });

  tearDown(() async => db.close());

  group('SeedImporter', () {
    test(
      'imports exactly 20 foods and is idempotent (seed_meta guard)',
      () async {
        final SeedImporter importer = SeedImporter(db);

        final int first = await importer.run();
        expect(first, 20, reason: 'first import inserts the whole catalog');
        expect(kSeedFoods.length, 20);

        final int second = await importer.run();
        expect(second, 0, reason: 'second run must be a no-op');

        final foods = await db.foodDao.allFoodRows();
        expect(foods.length, 20);

        final meta = await (db.select(
          db.seedMeta,
        )..where((m) => m.key.equals(seedVersionKey))).getSingle();
        expect(meta.value, seedVersion);
        expect(meta.value, 's0-1');
      },
    );

    test('every seed food carries the provisional source label', () async {
      await SeedImporter(db).run();
      final foods = await db.foodDao.allFoodRows();
      expect(foods.length, 20);
      for (final food in foods) {
        expect(
          food.sourceName,
          seedSourceName,
          reason: '${food.canonicalName} must be labeled provisional',
        );
        expect(food.isSeed, isTrue);
      }
    });
  });

  group('Seed alias resolution (LOG-05)', () {
    test('"doro wet" resolves to Doro Wot', () async {
      await SeedImporter(db).run();
      final results = await FoodRepository(db).search('doro wet');
      expect(results.single.canonicalName, 'Doro Wot');
    });

    test('"ዶሮ ወጥ" (Amharic) resolves to Doro Wot', () async {
      await SeedImporter(db).run();
      final results = await FoodRepository(db).search('ዶሮ ወጥ');
      expect(results.single.canonicalName, 'Doro Wot');
    });
  });
}
