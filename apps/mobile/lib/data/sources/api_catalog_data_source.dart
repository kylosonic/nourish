import 'dart:convert';
import 'dart:developer' as developer;

import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:nourish_domain/domain.dart';

import '../seed/seed_catalog.dart';
import 'catalog_data_source.dart';

/// [CatalogFetchException] now lives in the shared seam file because the local
/// source raises it too (durability guard, QA F-05); re-exported so existing
/// importers of this file keep working unchanged.
export 'catalog_data_source.dart' show CatalogFetchException;

/// Base URL of the Nourish catalog API (blueprint S1 §11): compile-time
/// env, no plugin — `http` is pure Dart and offline-safe when unused.
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3000',
);

/// Catalog fetch timeout.
const Duration apiCatalogTimeout = Duration(seconds: 10);

/// The remote catalog authority (OFF-01): GET `/v1/catalog` with a
/// conditional `If-None-Match` header — a 304 means the local catalog is
/// already current. Together with the sync service this is the app's
/// only egress point (A14).
class ApiCatalogDataSource implements CatalogDataSource {
  ApiCatalogDataSource({http.Client? client, String baseUrl = apiBaseUrl})
    : this._(client ?? http.Client(), baseUrl);

  ApiCatalogDataSource._(this._client, this._baseUrl);

  final http.Client _client;
  final String _baseUrl;

  /// Local reads are not this source's job: search ALWAYS reads the
  /// local cache (LOG-05/OFF-01); the network is only written INTO it.
  @override
  Future<List<Food>> searchLocal(
    String query, {
    String? category,
    FoodPreference? preference,
  }) => throw UnsupportedError('ApiCatalogDataSource is fetch-only');

  @override
  Future<List<Food>> allLocal({FoodPreference? preference}) =>
      throw UnsupportedError('ApiCatalogDataSource is fetch-only');

  @override
  Future<List<Food>> localByCategory(String category) =>
      throw UnsupportedError('ApiCatalogDataSource is fetch-only');

  @override
  Future<String?> storedVersion() =>
      throw UnsupportedError('ApiCatalogDataSource is fetch-only');

  @override
  Future<void> replaceAll(
    CatalogSnapshot snapshot, {
    bool allowShrink = false,
  }) => throw UnsupportedError('ApiCatalogDataSource is fetch-only');

  @override
  Future<CatalogSnapshot?> fetchSnapshot({String? etag}) async {
    final Uri uri = Uri.parse('$_baseUrl/v1/catalog');
    final http.Response response = await _client
        .get(
          uri,
          headers: <String, String>{
            'Accept': 'application/json',
            'If-None-Match': ?etag,
          },
        )
        .timeout(apiCatalogTimeout);
    if (response.statusCode == 304) {
      // Not modified: the stored catalog is already current.
      return null;
    }
    if (response.statusCode != 200) {
      throw CatalogFetchException(
        'catalog fetch failed: HTTP ${response.statusCode}',
      );
    }
    _verifyPayloadIntegrity(response);
    final Object? decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw CatalogFetchException('catalog response is not a JSON object');
    }
    return mapCatalogSnapshot(decoded);
  }

  /// End-to-end payload integrity (QA finding F-05).
  ///
  /// The API sends `X-Catalog-Payload-Sha256`, a SHA-256 over the exact
  /// response body bytes it produced. Verifying it catches a truncated,
  /// corrupted or proxy-rewritten payload *before* it can replace a good
  /// cached catalog. A **missing** header is not a failure — older servers and
  /// the S1-era API simply do not send it, and the catalog is still parsed
  /// with every per-food guard below. A **present but mismatching** header is
  /// fatal: the sync service keeps the previous catalog (OFF-01).
  static void _verifyPayloadIntegrity(http.Response response) {
    final String? expected =
        response.headers['x-catalog-payload-sha256']?.trim().toLowerCase();
    if (expected == null || expected.isEmpty) {
      developer.log(
        'catalog response carries no payload hash — integrity unverified',
        name: 'catalog-sync',
      );
      return;
    }
    final String actual = sha256.convert(response.bodyBytes).toString();
    if (actual != expected) {
      throw CatalogFetchException(
        'catalog payload failed its integrity check '
        '(expected $expected, got $actual) — keeping the previous catalog',
      );
    }
  }
}

/// Maps a `/v1/catalog` JSON payload into a [CatalogSnapshot].
///
/// Id authority (blueprint S1 §11, corrected at Gate C / QA finding Q1): the
/// **server's canonical `id` wins** when present. The server slug *is* the
/// application-level canonical id (ADR-0004) and is the same id the API
/// exposes at `/v1/foods/:id` and returns as `foodId` in S2 analysis results,
/// so honouring it is what keeps S0 meal `foodId` references resolvable — the
/// server's canonicalizer assigns seed slugs (`injera`, `doro_wot`, …) to
/// foods that match bootstrap seed names.
///
/// The name/food-code derivation below is a **fallback only**, for payloads
/// with no usable `id` (older catalog versions, hand-written fixtures):
/// the seed slug when the canonical name matches a seed food exactly, else
/// `fct-<sourceFoodCode>`.
///
/// Guards, never crashes (blueprint S1 §8):
/// - a food with no server id AND no food code AND no seed-name match is
///   skipped (a stable id can never be invented);
/// - unknown portion units are skipped, logged, never fatal;
/// - a missing snapshot version is fatal — the sync gate needs it.
CatalogSnapshot mapCatalogSnapshot(Map<String, dynamic> json) {
  final Object? version = json['version'];
  if (version is! String || version.trim().isEmpty) {
    throw CatalogFetchException('catalog response is missing a version');
  }
  final Object? foodListRaw = json['foods'];
  if (foodListRaw is! List) {
    throw CatalogFetchException('catalog response is missing its foods');
  }

  final Map<String, String> seedIdsByName = <String, String>{
    for (final SeedFood seed in kSeedFoods)
      seed.canonicalName.trim().toLowerCase(): seed.id,
  };

  final List<CatalogFood> foods = <CatalogFood>[];
  String? sourceName;
  for (final Object? item in foodListRaw) {
    if (item is! Map<String, dynamic>) {
      developer.log(
        'catalog entry is not an object — skipped',
        name: 'catalog-sync',
      );
      continue;
    }
    final CatalogFood? food = _mapFood(item, seedIdsByName);
    if (food != null) {
      foods.add(food);
      sourceName ??= food.source.name;
    }
  }
  if (foods.isEmpty) {
    throw CatalogFetchException('catalog response contained no usable foods');
  }

  final Object? generatedAt = json['generatedAt'];
  return CatalogSnapshot(
    version: version,
    sourceName: sourceName ?? 'remote-catalog',
    foods: foods,
    sha256: _stringField(json, 'sha256'),
    generatedAt: generatedAt is String ? DateTime.tryParse(generatedAt) : null,
  );
}

CatalogFood? _mapFood(
  Map<String, dynamic> json,
  Map<String, String> seedIdsByName,
) {
  final String? name = _stringField(json, 'canonicalName');
  if (name == null || name.trim().isEmpty) {
    developer.log(
      'catalog food missing canonicalName — skipped',
      name: 'catalog-sync',
    );
    return null;
  }
  final String normalized = name.trim().toLowerCase();

  final FoodSource source = _foodSource(json['source']);
  final String seedId = seedIdsByName[normalized] ?? '';
  final String? foodCode = source.foodCode;

  // Server id first (QA Q1): it is the canonical application id and the
  // same namespace the API and the S2 analysis results use.
  final String serverId = _stringField(json, 'id')?.trim() ?? '';
  final String id = serverId.isNotEmpty
      ? serverId
      : (seedId.isNotEmpty
            ? seedId
            : (foodCode == null ? '' : 'fct-$foodCode'));
  if (id.isEmpty) {
    developer.log(
      'catalog food "$name" has no id, no foodCode and no seed-name match — '
      'skipped (a stable id can never be invented)',
      name: 'catalog-sync',
    );
    return null;
  }

  final List<Portion> portions = _portions(json['portions']);
  final Portion? defaultPortion = _defaultPortion(json['defaultPortion'], portions);
  if (defaultPortion == null) {
    developer.log(
      'catalog food "$name" has no usable default portion — skipped',
      name: 'catalog-sync',
    );
    return null;
  }
  final NutritionPer100g? per100g = _per100g(json['per100g']);
  if (per100g == null) {
    developer.log(
      'catalog food "$name" has incomplete per-100g nutrition — skipped',
      name: 'catalog-sync',
    );
    return null;
  }

  return CatalogFood(
    id: id,
    canonicalName: name,
    category: _stringField(json, 'category') ?? 'Ethiopian',
    defaultPortion: defaultPortion,
    portions: portions,
    per100g: per100g,
    aliases: _aliases(json['aliases']),
    source: source,
  );
}

FoodSource _foodSource(Object? raw) {
  if (raw is! Map<String, dynamic>) {
    return const FoodSource(name: 'remote-catalog');
  }
  final Object? importDate = raw['importDate'];
  return FoodSource(
    name: _stringField(raw, 'name') ?? 'remote-catalog',
    version: _stringField(raw, 'version'),
    foodCode: _stringField(raw, 'foodCode'),
    reference: _stringField(raw, 'reference'),
    importDate: importDate is String ? DateTime.tryParse(importDate) : null,
  );
}

Portion? _defaultPortion(Object? raw, List<Portion> portions) {
  final Portion? parsed = _portion(raw);
  if (parsed != null) {
    return parsed;
  }
  return portions.isEmpty ? null : portions.first;
}

Portion? _portion(Object? raw) {
  if (raw is! Map<String, dynamic>) {
    return null;
  }
  final String? unitName = _stringField(raw, 'unit');
  final Object? grams = raw['grams'];
  if (unitName == null || grams is! num) {
    return null;
  }
  final PortionUnit? unit = _unitByName(unitName);
  if (unit == null) {
    developer.log(
      'unknown portion unit "$unitName" — skipped',
      name: 'catalog-sync',
    );
    return null;
  }
  final Object? quantity = raw['quantity'];
  return Portion(
    unit: unit,
    quantity: quantity is num ? quantity.toDouble() : 1,
    grams: grams.toDouble(),
  );
}

List<Portion> _portions(Object? raw) {
  if (raw is! List) {
    return const <Portion>[];
  }
  return <Portion>[
    for (final Object? item in raw)
      if (_portion(item) != null) _portion(item)!,
  ];
}

PortionUnit? _unitByName(String name) {
  for (final PortionUnit unit in PortionUnit.values) {
    if (unit.name == name) {
      return unit;
    }
  }
  return null;
}

NutritionPer100g? _per100g(Object? raw) {
  if (raw is! Map<String, dynamic>) {
    return null;
  }
  final double? kcal = _doubleField(raw, 'kcal');
  final double? proteinG = _doubleField(raw, 'proteinG');
  final double? carbsG = _doubleField(raw, 'carbsG');
  final double? fatG = _doubleField(raw, 'fatG');
  if (kcal == null || proteinG == null || carbsG == null || fatG == null) {
    return null;
  }
  return NutritionPer100g(
    kcal: kcal,
    proteinG: proteinG,
    carbsG: carbsG,
    fatG: fatG,
    fiberG: _doubleField(raw, 'fiberG'),
    sodiumMg: _doubleField(raw, 'sodiumMg'),
  );
}

List<CatalogFoodAlias> _aliases(Object? raw) {
  if (raw is! List) {
    return const <CatalogFoodAlias>[];
  }
  return <CatalogFoodAlias>[
    for (final Object? item in raw)
      if (item is Map<String, dynamic> && _stringField(item, 'alias') != null)
        CatalogFoodAlias(
          _stringField(item, 'alias')!,
          language: _stringField(item, 'language') ?? 'en',
        ),
  ];
}

String? _stringField(Map<String, dynamic> json, String key) {
  final Object? value = json[key];
  return value is String ? value : null;
}

double? _doubleField(Map<String, dynamic> json, String key) {
  final Object? value = json[key];
  return value is num ? value.toDouble() : null;
}
