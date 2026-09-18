import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/food_repository.dart';
import 'package:nourish_mobile/data/sources/catalog_data_source.dart';
import 'package:nourish_mobile/data/sources/local_catalog_data_source.dart';
import 'package:nourish_mobile/data/sync/catalog_sync_service.dart';
import 'package:nourish_mobile/l10n/strings.dart';
import 'package:nourish_mobile/providers.dart';
import 'package:nourish_mobile/router/routes.dart';

import 'pump_app.dart';
import 'test_helpers.dart';
import 'widget/seed_helpers.dart';

/// Scripted remote source — no sockets, ever (A14).
class _FakeApi implements CatalogDataSource {
  _FakeApi(this.snapshot);

  final CatalogSnapshot snapshot;

  @override
  Future<List<Food>> searchLocal(
    String query, {
    String? category,
    FoodPreference? preference,
  }) => throw UnsupportedError('fake api is fetch-only');

  @override
  Future<List<Food>> allLocal({FoodPreference? preference}) =>
      throw UnsupportedError('fake api is fetch-only');

  @override
  Future<List<Food>> localByCategory(String category) =>
      throw UnsupportedError('fake api is fetch-only');

  @override
  Future<String?> storedVersion() => throw UnsupportedError('fake api');

  @override
  Future<void> replaceAll(CatalogSnapshot snapshot, {bool allowShrink = false}) =>
      throw UnsupportedError('fake api');

  @override
  Future<CatalogSnapshot?> fetchSnapshot({String? etag}) async => snapshot;
}

CatalogFood _fctFood({
  required String id,
  required String name,
  String category = 'Snacks',
  String foodCode = '5000',
}) {
  return CatalogFood(
    id: id,
    canonicalName: name,
    category: category,
    defaultPortion: const Portion(unit: PortionUnit.serving, grams: 50),
    portions: const <Portion>[Portion(unit: PortionUnit.serving, grams: 50)],
    per100g: NutritionPer100g(
      kcal: 470,
      proteinG: 13,
      carbsG: 55,
      fatG: 22,
    ),
    aliases: const <CatalogFoodAlias>[
      CatalogFoodAlias('kolo', language: 'en'),
      CatalogFoodAlias('ቆሎ', language: 'am'),
    ],
    source: FoodSource(
      name: 'ethiopian-fct-2025',
      version: '2025',
      foodCode: foodCode,
      reference: 'EPHI & FAO 2025. The Ethiopian Food Composition Table '
          '2025. Addis Ababa, Ethiopia.',
      importDate: DateTime(2026, 8, 26),
    ),
  );
}

/// Empties the cached catalog so a deliberately tiny synced fixture can be
/// exercised without tripping the F-05 durability floor.
Future<void> _clearCatalog(AppDatabase db) async {
  await db.delete(db.foodAliases).go();
  await db.delete(db.foodPortions).go();
  await db.delete(db.foods).go();
}

void main() {
  group('OFF-01 offline lanes', () {    test('bootstrap seed search works with zero network', () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);
      final FoodRepository repository = FoodRepository(
        LocalCatalogDataSource(db),
      );

      final List<Food> results = await repository.search('shiro');
      expect(results.single.canonicalName, 'Shiro Wot');
      expect((await repository.allFoods()).length, 20,
          reason: 'the full bootstrap cache is searchable offline');
    });

    test('post-sync FCT snapshot is searchable with its source block',
        () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);
      final LocalCatalogDataSource local = LocalCatalogDataSource(db);
      // Tiny fixture catalog: start empty so the F-05 durability floor
      // (which guards an existing non-empty cache) does not apply.
      await _clearCatalog(db);
      final CatalogSyncService sync = CatalogSyncService(
        local: local,
        api: _FakeApi(
          CatalogSnapshot(
            version: '2025-a1b2c3',
            sourceName: 'ethiopian-fct-2025',
            foods: <CatalogFood>[
              _fctFood(id: 'fct-5000', name: 'Kolo', foodCode: '5000'),
            ],
          ),
        ),
      );
      await sync.sync();

      final FoodRepository repository = FoodRepository(local);
      final List<Food> results = await repository.search('kolo');
      expect(results.single.id, 'fct-5000');
      expect(results.single.source.name, 'ethiopian-fct-2025');
      expect(results.single.source.foodCode, '5000');
      expect(results.single.source.reference, isNotNull);
      expect(results.single.source.importDate, isNotNull);
      expect(results.single.isSeed, isFalse);
      // The snapshot replaced the seed: a single catalog offline.
      expect((await repository.allFoods()).length, 1);
    });

    test('name-matched FCT food keeps the seed slug (meal refs stay valid)',
        () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);
      final LocalCatalogDataSource local = LocalCatalogDataSource(db);
      await _clearCatalog(db);
      await CatalogSyncService(
        local: local,
        api: _FakeApi(
          CatalogSnapshot(
            version: '2025-a1b2c3',
            sourceName: 'ethiopian-fct-2025',
            foods: <CatalogFood>[
              _fctFood(id: 'injera', name: 'Injera', foodCode: 'F0099'),
            ],
          ),
        ),
      ).sync();

      final Food injera = (await FoodRepository(local).search('injera')).single;
      expect(injera.id, 'injera');
      expect(injera.source.name, 'ethiopian-fct-2025',
          reason: 'the slug is stable while the provenance is now FCT');
    });
  });

  group('search footer honesty (pre-sync vs post-sync)', () {
    testWidgets('pre-sync: provisional disclaimer; post-sync: FCT citation',
        (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);
      await _clearCatalog(db);

      final _FakeApi fakeApi = _FakeApi(
        CatalogSnapshot(
          version: '2025-a1b2c3',
          sourceName: 'ethiopian-fct-2025',
          foods: <CatalogFood>[
            _fctFood(id: 'fct-5000', name: 'Kolo', foodCode: '5000'),
          ],
        ),
      );
      final AppHarness harness = await pumpApp(
        tester,
        profile: answers,
        db: db,
        overrides: <Override>[
          apiCatalogDataSourceProvider.overrideWithValue(fakeApi),
        ],
      );

      harness.router.go(AppRoutes.searchFood);
      await tester.pumpAndSettle();

      // Pre-sync: the provisional bootstrap disclaimer.
      expect(find.text(Strings.seedDisclaimer), findsOneWidget);
      expect(find.text(Strings.fctCitationFooter), findsNothing);

      // Drive the sync through the provider graph (no real sockets).
      await readProvider<CatalogSyncStateNotifier>(
        tester,
        catalogSyncStateProvider.notifier,
      ).runSync();
      await tester.pumpAndSettle();

      // Post-sync: the FCT citation replaces the disclaimer.
      expect(find.text(Strings.fctCitationFooter), findsOneWidget);
      expect(find.text(Strings.seedDisclaimer), findsNothing);
      await harness.teardown(tester);
    });
  });
}
