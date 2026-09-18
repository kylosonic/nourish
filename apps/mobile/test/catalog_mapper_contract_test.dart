import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_mobile/data/sources/api_catalog_data_source.dart';
import 'package:nourish_mobile/data/sources/catalog_data_source.dart';

/// Contract test for the `/v1/catalog` ↔ mobile mapper boundary.
///
/// QA finding Q1 (S1 Gate C): the mapper used to ignore the server's `id` and
/// re-derive one from `canonicalName` + `source.foodCode`. The FCT canonical
/// names are long descriptions ("Chicken, meat, without skin, stew, …"), so
/// none of them matched an S0 seed short name and **all 18** ids diverged from
/// the canonical application id, breaking the blueprint §11 id-stability rule
/// and the S2 analysis `foodId` bridge.
///
/// The fixture below is a **real captured response** from
/// `GET /v1/catalog` (18 FCT foods, `nourish` DB after the S1 import) — not a
/// hand-written payload. Hand-written payloads with short names were exactly
/// what let the divergence ship.
void main() {
  late Map<String, dynamic> payload;

  setUpAll(() {
    final File file = File('test/fixtures/catalog_response.json');
    expect(
      file.existsSync(),
      isTrue,
      reason: 'the captured /v1/catalog fixture must be committed',
    );
    payload = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  });

  test('real captured payload maps at all (guards the fixture itself)', () {
    final CatalogSnapshot snapshot = mapCatalogSnapshot(payload);
    expect(snapshot.version.isNotEmpty, isTrue);
    expect(snapshot.foods, isNotEmpty);
  });

  test('every mapped food keeps the SERVER id (Q1 regression)', () {
    final CatalogSnapshot snapshot = mapCatalogSnapshot(payload);
    final List<Map<String, dynamic>> rawFoods =
        (payload['foods'] as List<dynamic>).cast<Map<String, dynamic>>();

    expect(
      snapshot.foods.length,
      rawFoods.length,
      reason: 'no food may be dropped from a valid production payload',
    );

    final Map<String, String> expectedIdByName = <String, String>{
      for (final Map<String, dynamic> food in rawFoods)
        food['canonicalName'] as String: food['id'] as String,
    };

    for (final CatalogFood food in snapshot.foods) {
      expect(
        food.id,
        expectedIdByName[food.canonicalName],
        reason: 'canonicalName "${food.canonicalName}" must keep the server id',
      );
    }

    // The specific ids QA found diverging (server slug → fct-<code>).
    final Map<String, String> idsByName = <String, String>{
      for (final CatalogFood food in snapshot.foods) food.canonicalName: food.id,
    };
    expect(idsByName.values, contains('doro_wot'));
    expect(idsByName.values, contains('kitfo'));
    expect(
      idsByName.values.where((String id) => id.startsWith('fct-')),
      isEmpty,
      reason: 'no food may fall back to a derived id when the server sent one',
    );
  });

  test('provenance survives the mapping (foodCode + source block)', () {
    final CatalogSnapshot snapshot = mapCatalogSnapshot(payload);
    final CatalogFood doroWot = snapshot.foods.firstWhere(
      (CatalogFood food) => food.id == 'doro_wot',
    );
    expect(doroWot.source.foodCode, '070152');
    expect(doroWot.source.name, 'ethiopian-fct-2025');
    expect(doroWot.source.version, '2025');
    expect(doroWot.per100g.kcal, 219);
  });

  test('fallback derivation still works when the server sends no id', () {
    final CatalogSnapshot snapshot = mapCatalogSnapshot(<String, dynamic>{
      'version': 'legacy-1',
      'foods': <Map<String, dynamic>>[
        <String, dynamic>{
          // No 'id': must fall back to the seed slug on an exact name match.
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
          'source': <String, dynamic>{
            'name': 'ethiopian-fct-2025',
            'version': '2025',
            'foodCode': '010109',
          },
        },
        <String, dynamic>{
          // No 'id' and no seed-name match: must fall back to fct-<code>.
          'canonicalName': 'Some Other Food',
          'category': 'Ethiopian',
          'defaultPortion': <String, dynamic>{
            'unit': 'serving',
            'quantity': 1,
            'grams': 100,
          },
          'per100g': <String, dynamic>{
            'kcal': 100,
            'proteinG': 1,
            'carbsG': 1,
            'fatG': 1,
          },
          'source': <String, dynamic>{
            'name': 'ethiopian-fct-2025',
            'version': '2025',
            'foodCode': '999999',
          },
        },
      ],
    });

    expect(
      snapshot.foods.map((CatalogFood f) => f.id).toList(),
      <String>['injera', 'fct-999999'],
    );
  });
}
