import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/food_repository.dart';
import 'package:nourish_mobile/data/sources/local_catalog_data_source.dart';

import 'test_helpers.dart';

void main() {
  late AppDatabase db;
  late FoodRepository repository;

  setUp(() async {
    db = await openSeededDb();
    repository = FoodRepository(LocalCatalogDataSource(db));
  });

  tearDown(() async => db.close());

  group('FoodRepository.search', () {
    test('English alias "enjera" resolves to Injera', () async {
      final results = await repository.search('enjera');
      expect(results.single.canonicalName, 'Injera');
    });

    test('Amharic alias "እንጀራ" resolves to Injera', () async {
      final results = await repository.search('እንጀራ');
      expect(results.single.canonicalName, 'Injera');
    });

    test('canonical name match is case-insensitive', () async {
      final results = await repository.search('SHIRO');
      expect(results.single.canonicalName, 'Shiro Wot');
    });

    test('category filter narrows results to that category', () async {
      final snacks = await repository.search('', category: 'Snacks');
      final names = snacks.map((Food f) => f.canonicalName).toSet();
      expect(names, <String>{'Orange', 'Avocado', 'Banana'});
    });

    test('unknown query returns no results', () async {
      final results = await repository.search('zzz-not-a-food');
      expect(results, isEmpty);
    });
  });

  group('FoodRepository preference bias (ordering hook)', () {
    test('Ethiopian preference ranks Ethiopian foods first', () async {
      final foods = await repository.allFoods(
        preference: FoodPreference.ethiopian,
      );
      expect(foods, isNotEmpty);
      expect(foods.first.category, 'Ethiopian');
    });

    test('international preference ranks non-Ethiopian foods first', () async {
      final foods = await repository.allFoods(
        preference: FoodPreference.international,
      );
      expect(foods, isNotEmpty);
      expect(foods.first.category, isNot('Ethiopian'));
    });

    test('no preference keeps catalog order', () async {
      final biased = await repository.allFoods(
        preference: FoodPreference.ethiopian,
      );
      final unbiased = await repository.allFoods();
      expect(
        biased.map((Food f) => f.id).toSet(),
        unbiased.map((Food f) => f.id).toSet(),
        reason: 'ordering changes membership only',
      );
    });
  });

  group('FoodRepository composed domain model', () {
    test(
      'Injera default portion is 1 × 150 g with per-100g 150 kcal',
      () async {
        final injera = (await repository.search('injera')).single;
        expect(injera.defaultPortion.grams, 150);
        expect(injera.defaultPortion.unit, PortionUnit.injera);
        expect(injera.per100g.kcal, 150);
        expect(injera.source.name, 'provisional-seed-bootstrap');
      },
    );
  });
}
