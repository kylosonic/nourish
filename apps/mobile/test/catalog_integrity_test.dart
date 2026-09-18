import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:nourish_mobile/data/sources/api_catalog_data_source.dart';
import 'package:nourish_mobile/data/sources/catalog_data_source.dart';

/// Payload-integrity behaviour of the remote catalog source (QA finding F-05).
///
/// The API sends `X-Catalog-Payload-Sha256` over the exact response body it
/// produced. A truncated or rewritten payload must be rejected *before* it can
/// replace a good cached catalog. A missing header is tolerated (older
/// servers); a present-but-wrong header is fatal.
void main() {
  final String body = jsonEncode(<String, dynamic>{
    'version': '2025-test',
    'sha256': 'unused-by-the-client',
    'generatedAt': '2026-08-27T12:38:43.716Z',
    'foods': <Map<String, dynamic>>[
      <String, dynamic>{
        'id': 'doro_wot',
        'canonicalName': 'Chicken, meat, without skin, stew',
        'category': 'Ethiopian',
        'defaultPortion': <String, dynamic>{
          'unit': 'cup',
          'quantity': 1,
          'grams': 240,
        },
        'per100g': <String, dynamic>{
          'kcal': 219,
          'proteinG': 6.8,
          'carbsG': 5.1,
          'fatG': 18.4,
        },
        'aliases': <Map<String, dynamic>>[],
        'portions': <Map<String, dynamic>>[],
        'source': <String, dynamic>{
          'name': 'ethiopian-fct-2025',
          'version': '2025',
          'foodCode': '070152',
        },
      },
    ],
  });

  String hashOf(String value) =>
      sha256.convert(utf8.encode(value)).toString();

  ApiCatalogDataSource sourceReturning(
    String responseBody, {
    String? payloadHash,
  }) {
    final MockClient client = MockClient((http.Request request) async {
      final Map<String, String> headers = <String, String>{
        'content-type': 'application/json',
      };
      if (payloadHash != null) {
        headers['x-catalog-payload-sha256'] = payloadHash;
      }
      return http.Response(responseBody, 200, headers: headers);
    });
    return ApiCatalogDataSource(
      client: client,
      baseUrl: 'http://catalog.test',
    );
  }

  test('accepts a payload whose header hash matches the body', () async {
    final CatalogSnapshot? snapshot = await sourceReturning(
      body,
      payloadHash: hashOf(body),
    ).fetchSnapshot();

    expect(snapshot, isNotNull);
    expect(snapshot!.foods.single.id, 'doro_wot');
  });

  test('rejects a payload whose body does not match the header hash (F-05)',
      () async {
    // The header describes the real body; the body arriving is different —
    // exactly what a truncated or rewritten response looks like.
    final String tampered = body.replaceFirst('219', '999');
    expect(tampered, isNot(body));

    await expectLater(
      sourceReturning(tampered, payloadHash: hashOf(body)).fetchSnapshot(),
      throwsA(isA<CatalogFetchException>()),
    );
  });

  test('tolerates a server that sends no payload hash (older API)', () async {
    final CatalogSnapshot? snapshot =
        await sourceReturning(body).fetchSnapshot();

    expect(snapshot, isNotNull);
    expect(snapshot!.foods.single.id, 'doro_wot');
  });

  test('a 304 is still "not modified" regardless of the hash', () async {
    final MockClient client = MockClient((http.Request request) async {
      return http.Response('', 304);
    });
    final ApiCatalogDataSource source = ApiCatalogDataSource(
      client: client,
      baseUrl: 'http://catalog.test',
    );

    expect(await source.fetchSnapshot(etag: '2025-test'), isNull);
  });
}
