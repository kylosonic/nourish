import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/sources/api_catalog_data_source.dart';
import 'package:nourish_mobile/data/sources/catalog_data_source.dart';
import 'package:nourish_mobile/data/sources/local_catalog_data_source.dart';
import 'package:nourish_mobile/data/sync/catalog_sync_service.dart';
import 'package:nourish_mobile/data/sync/catalog_sync_state.dart';
import 'package:nourish_mobile/data/tables/tables.dart';

import 'test_helpers.dart';

/// Scripted remote source — no sockets, ever (A14).
class _FakeApi implements CatalogDataSource {
  CatalogSnapshot? snapshot;
  bool throwOnFetch = false;
  int fetchCalls = 0;
  String? lastEtag;

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
  Future<CatalogSnapshot?> fetchSnapshot({String? etag}) async {
    fetchCalls++;
    lastEtag = etag;
    if (throwOnFetch) {
      throw CatalogFetchException('simulated network failure');
    }
    return snapshot;
  }
}

CatalogFood _fctFood({
  String id = 'fct-5000',
  String name = 'Kolo',
  String category = 'Snacks',
  double kcal = 470,
}) {
  return CatalogFood(
    id: id,
    canonicalName: name,
    category: category,
    defaultPortion: const Portion(unit: PortionUnit.cup, grams: 50),
    portions: const <Portion>[Portion(unit: PortionUnit.cup, grams: 50)],
    per100g: NutritionPer100g(
      kcal: kcal,
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
      foodCode: id.startsWith('fct-') ? id.substring(4) : null,
      reference:
          'EPHI & FAO 2025. The Ethiopian Food Composition Table 2025.',
      importDate: DateTime(2026, 8, 26),
    ),
  );
}

CatalogSnapshot _snapshot({
  String version = '2025-a1b2c3',
  List<CatalogFood>? foods,
}) {
  return CatalogSnapshot(
    version: version,
    sourceName: 'ethiopian-fct-2025',
    foods: foods ?? <CatalogFood>[_fctFood()],
    sha256: 'deadbeef',
  );
}

/// Empties the cached catalog.
///
/// Tests that intentionally exercise a *tiny* synced catalog start from an
/// empty cache: the F-05 durability guard only applies when a replacement
/// would shrink an existing, non-empty catalog.
Future<void> clearCatalog(AppDatabase db) async {
  await db.delete(db.foodAliases).go();
  await db.delete(db.foodPortions).go();
  await db.delete(db.foods).go();
}

void main() {
  group('CatalogSyncService version gate (A13)', () {
    test('304 / not-modified: stored catalog untouched, state synced',
        () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);
      final LocalCatalogDataSource local = LocalCatalogDataSource(db);
      await db.into(db.seedMeta).insertOnConflictUpdate(
        SeedMetaRow(key: catalogVersionKey, value: '2025-a1b2c3'),
      );
      final _FakeApi api = _FakeApi()..snapshot = null; // server → 304

      final CatalogSyncService service = CatalogSyncService(
        local: local,
        api: api,
      );
      await service.sync();

      expect(api.fetchCalls, 1);
      expect(api.lastEtag, '2025-a1b2c3');
      expect(
        service.state.value,
        const CatalogSyncSynced('2025-a1b2c3'),
      );
      // The seed catalog is untouched: still exactly the 20 bootstrap foods.
      expect((await db.foodDao.allFoodRows()).length, 20);
    });

    test('server returns the same version: no replace happens', () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);
      final LocalCatalogDataSource local = LocalCatalogDataSource(db);
      await db.into(db.seedMeta).insertOnConflictUpdate(
        SeedMetaRow(key: catalogVersionKey, value: '2025-a1b2c3'),
      );
      final _FakeApi api = _FakeApi()..snapshot = _snapshot();

      final CatalogSyncService service = CatalogSyncService(
        local: local,
        api: api,
      );
      await service.sync();

      expect(service.state.value, const CatalogSyncSynced('2025-a1b2c3'));
      expect((await db.foodDao.allFoodRows()).length, 20,
          reason: 'same-version snapshot must not replace the catalog');
    });
  });

  group('CatalogSyncService replace on success (A12)', () {
    test('new version replaces the catalog and records version + source',
        () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);
      final LocalCatalogDataSource local = LocalCatalogDataSource(db);
      // 12 of the 20 seeded foods: above the 50% durability floor (F-05).
      final List<CatalogFood> incoming = List<CatalogFood>.generate(
        12,
        (int i) => _fctFood(id: 'fct-50$i', name: 'Food $i'),
      );
      final _FakeApi api = _FakeApi()..snapshot = _snapshot(foods: incoming);

      final CatalogSyncService service = CatalogSyncService(
        local: local,
        api: api,
      );
      await service.sync();

      expect(service.state.value, const CatalogSyncSynced('2025-a1b2c3'));

      final rows = await db.foodDao.allFoodRows();
      expect(rows, hasLength(12), reason: 'snapshot replaces the seed');
      expect(rows.first.id, 'fct-500');
      expect(rows.first.sourceFoodCode, '500');
      expect(rows.first.sourceName, 'ethiopian-fct-2025');
      expect(rows.first.importDate, isNotNull);
      expect(rows.first.isSeed, isFalse);

      final versionMeta = await (db.select(
        db.seedMeta,
      )..where((SeedMeta m) => m.key.equals(catalogVersionKey)))
          .getSingle();
      expect(versionMeta.value, '2025-a1b2c3');

      final sourceMeta = await (db.select(
        db.seedMeta,
      )..where((SeedMeta m) => m.key.equals(catalogSourceKey)))
          .getSingle();
      expect(sourceMeta.value, 'ethiopian-fct-2025');
    });

    test(
        'durability guard: a drastically smaller snapshot is refused and the '
        'previous catalog is kept (QA F-05)', () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);
      final LocalCatalogDataSource local = LocalCatalogDataSource(db);
      final int before = (await db.foodDao.allFoodRows()).length;
      expect(before, 20);

      // A truncated/mangled payload that still parses into ONE usable food
      // must not be allowed to wipe the cache.
      final _FakeApi api = _FakeApi()
        ..snapshot = _snapshot(
          version: '2025-truncated',
          foods: <CatalogFood>[_fctFood()],
        );

      final CatalogSyncService service = CatalogSyncService(
        local: local,
        api: api,
      );
      await service.sync();

      expect(service.state.value, isA<CatalogSyncFailed>());
      expect(
        (await db.foodDao.allFoodRows()).length,
        before,
        reason: 'the previous catalog survives a refused replacement',
      );
      expect(
        await local.storedVersion(),
        isNull,
        reason: 'the refused snapshot records no version',
      );
    });
  });

  group('CatalogSyncService failure keeps the catalog (OFF-01)', () {
    test('fetch failure: seed stays, state failed, nothing recorded',
        () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);
      final LocalCatalogDataSource local = LocalCatalogDataSource(db);
      final _FakeApi api = _FakeApi()..throwOnFetch = true;

      final CatalogSyncService service = CatalogSyncService(
        local: local,
        api: api,
      );
      await service.sync();

      expect(service.state.value, const CatalogSyncFailed());
      expect(
        (await db.foodDao.allFoodRows()).length,
        20,
        reason: 'the seed catalog must survive a failed sync',
      );
      expect(await local.storedVersion(), isNull);
    });

    test('failure after a sync keeps the previous snapshot + its version',
        () async {
      final AppDatabase db = await openSeededDb();
      addTearDown(db.close);
      final LocalCatalogDataSource local = LocalCatalogDataSource(db);
      // Start from an empty cache so the F-05 durability floor does not apply
      // to this one-food fixture (the test is about failure handling).
      await clearCatalog(db);
      final _FakeApi api = _FakeApi()
        ..snapshot = _snapshot(foods: <CatalogFood>[_fctFood()]);

      final CatalogSyncService service = CatalogSyncService(
        local: local,
        api: api,
      );
      await service.sync();
      expect(service.state.value, const CatalogSyncSynced('2025-a1b2c3'));

      // A later, failing sync: the FCT catalog stays in place and the
      // failure carries the previous version (footer stays honest).
      api.throwOnFetch = true;
      await service.sync();

      expect(
        service.state.value,
        const CatalogSyncFailed(previousVersion: '2025-a1b2c3'),
      );
      final rows = await db.foodDao.allFoodRows();
      expect(rows.single.id, 'fct-5000',
          reason: 'the synced catalog is preserved on failure');
    });
  });

  group('snapshot mapper id fallback (payloads with no server id)', () {
    // NOTE: the server id is authoritative and always wins when present; the
    // real-capture contract lives in catalog_mapper_contract_test.dart. The
    // hand-written payloads below deliberately omit 'id' to exercise the
    // legacy fallback path only.
    test('name-matching FCT food keeps the seed slug; others get fct-<code>',
        () {
      final CatalogSnapshot snapshot = mapCatalogSnapshot(
        <String, dynamic>{
          'version': '2025-a1b2c3',
          'sha256': 'abc',
          'foods': <Map<String, dynamic>>[
            <String, dynamic>{
              'canonicalName': 'Injera',
              'category': 'Ethiopian',
              'defaultPortion': <String, dynamic>{
                'unit': 'injera',
                'quantity': 1,
                'grams': 150,
              },
              'per100g': <String, dynamic>{
                'kcal': 150,
                'proteinG': 5,
                'carbsG': 30,
                'fatG': 0.5,
              },
              'aliases': <Map<String, dynamic>>[
                <String, dynamic>{'alias': 'enjera', 'language': 'en'},
                <String, dynamic>{'alias': 'እንጀራ', 'language': 'am'},
              ],
              'source': <String, dynamic>{
                'name': 'ethiopian-fct-2025',
                'version': '2025',
                'foodCode': 'F0099',
                'reference': 'FCT 2025',
              },
            },
            <String, dynamic>{
              'canonicalName': 'Kolo',
              'category': 'Snacks',
              'defaultPortion': <String, dynamic>{
                'unit': 'serving',
                'quantity': 1,
                'grams': 50,
              },
              'per100g': <String, dynamic>{
                'kcal': 470,
                'proteinG': 13,
                'carbsG': 55,
                'fatG': 22,
              },
              'aliases': <Map<String, dynamic>>[],
              'source': <String, dynamic>{
                'name': 'ethiopian-fct-2025',
                'version': '2025',
                'foodCode': '5000',
                'reference': 'FCT 2025',
              },
            },
          ],
        },
      );

      expect(
        snapshot.foods.map((CatalogFood f) => f.id),
        <String>['injera', 'fct-5000'],
        reason: 'seed-matched foods keep their slug; new foods get '
            'fct-<code> ids so meal references stay resolvable',
      );
      // Alias language fidelity survives the mapping.
      expect(
        snapshot.foods.first.aliases.map((CatalogFoodAlias a) => a.language),
        <String>['en', 'am'],
      );
      expect(snapshot.foods.last.aliases, isEmpty);
    });

    test('food without code and without seed match is skipped (never invent ids)',
        () {
      final CatalogSnapshot snapshot = mapCatalogSnapshot(
        <String, dynamic>{
          'version': 'v1',
          'foods': <Map<String, dynamic>>[
            <String, dynamic>{
              'canonicalName': 'Brand New Dish',
              'category': 'Lunch',
              'defaultPortion': <String, dynamic>{
                'unit': 'serving',
                'grams': 200,
              },
              'per100g': <String, dynamic>{
                'kcal': 100,
                'proteinG': 1,
                'carbsG': 2,
                'fatG': 3,
              },
              'source': <String, dynamic>{'name': 'x', 'version': '1'},
            },
            <String, dynamic>{
              'canonicalName': 'Kolo',
              'category': 'Snacks',
              'defaultPortion': <String, dynamic>{
                'unit': 'serving',
                'grams': 50,
              },
              'per100g': <String, dynamic>{
                'kcal': 470,
                'proteinG': 13,
                'carbsG': 55,
                'fatG': 22,
              },
              'source': <String, dynamic>{
                'name': 'x',
                'version': '1',
                'foodCode': '5000',
              },
            },
          ],
        },
      );

      expect(snapshot.foods, hasLength(1));
      expect(snapshot.foods.single.id, 'fct-5000');
    });

    test('unknown portion unit is skipped, never fatal', () {
      final CatalogSnapshot snapshot = mapCatalogSnapshot(
        <String, dynamic>{
          'version': 'v1',
          'foods': <Map<String, dynamic>>[
            <String, dynamic>{
              'canonicalName': 'Kolo',
              'category': 'Snacks',
              'defaultPortion': <String, dynamic>{
                'unit': 'serving',
                'grams': 50,
              },
              'per100g': <String, dynamic>{
                'kcal': 470,
                'proteinG': 13,
                'carbsG': 55,
                'fatG': 22,
              },
              'portions': <Map<String, dynamic>>[
                <String, dynamic>{
                  'unit': 'sorcerers_scoop',
                  'quantity': 1,
                  'grams': 42,
                },
                <String, dynamic>{
                  'unit': 'serving',
                  'quantity': 1,
                  'grams': 50,
                },
              ],
              'source': <String, dynamic>{
                'name': 'x',
                'version': '1',
                'foodCode': '5000',
              },
            },
          ],
        },
      );

      final CatalogFood kolo = snapshot.foods.single;
      expect(
        kolo.portions.map((Portion p) => p.unit.name),
        <String>['serving'],
        reason: 'the unknown unit is skipped; the known one is kept',
      );
    });

    test('missing version is fatal (the sync gate needs it)', () {
      expect(
        () => mapCatalogSnapshot(<String, dynamic>{'foods': <dynamic>[]}),
        throwsA(isA<CatalogFetchException>()),
      );
    });
  });
}
