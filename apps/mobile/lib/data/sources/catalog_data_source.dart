import 'package:nourish_domain/domain.dart';

/// One catalog food as delivered by a remote snapshot, with full alias
/// and provenance fidelity.
///
/// The domain [Food] flattens aliases to plain strings (S0 domain shape,
/// which S1 must not change), so the catalog WRITE path carries this
/// row-shaped model instead; the local READ path composes domain [Food]s
/// from the stored rows as before.
class CatalogFood {
  const CatalogFood({
    required this.id,
    required this.canonicalName,
    required this.category,
    required this.defaultPortion,
    required this.portions,
    required this.per100g,
    this.aliases = const <CatalogFoodAlias>[],
    required this.source,
    this.isSeed = false,
  });

  /// Stable id — the seed slug when the canonical name matches a
  /// bootstrap food, otherwise `fct-<sourceFoodCode>` (S1 §11).
  final String id;

  final String canonicalName;
  final String category;
  final Portion defaultPortion;
  final List<Portion> portions;
  final NutritionPer100g per100g;
  final List<CatalogFoodAlias> aliases;

  /// Full provenance: name, version, foodCode, reference, importDate.
  final FoodSource source;

  /// False for snapshot foods; the snapshot replaces the seed catalog.
  final bool isSeed;
}

/// One search alias with its language tag (`en` | `am`), preserved from
/// the API alias records.
class CatalogFoodAlias {
  const CatalogFoodAlias(this.alias, {this.language = 'en'});

  final String alias;
  final String language;
}

/// A versioned catalog snapshot delivered by the remote catalog
/// authority (blueprint S1 §11, OFF-01). [foods] already carry the
/// id-stability rule applied.
class CatalogSnapshot {
  const CatalogSnapshot({
    required this.version,
    required this.sourceName,
    required this.foods,
    this.sha256,
    this.generatedAt,
  });

  /// Catalog version string (server-computed content hash).
  final String version;

  /// Source label of the snapshot's foods (e.g. `ethiopian-fct-2025`).
  final String sourceName;

  /// The full catalog contents.
  final List<CatalogFood> foods;

  /// Content checksum, when the server provides one.
  final String? sha256;

  /// Server generation time, when provided.
  final DateTime? generatedAt;
}

/// Fraction of the existing cache a replacement snapshot must retain
/// (QA finding F-05). A payload that parses but is drastically smaller than
/// the current catalog is treated as truncated/mangled rather than as a
/// legitimate mass removal, and the previous catalog is kept.
const double minRetainedRatio = 0.5;

/// Thrown on any transport, timeout, non-2xx, integrity, parse or
/// durability-guard failure. The sync service treats it as "keep the previous
/// catalog" (OFF-01).
class CatalogFetchException implements Exception {
  CatalogFetchException(this.message);

  final String message;

  @override
  String toString() => 'CatalogFetchException: $message';
}

/// The catalog seam (blueprint S1 §11): every catalog consumer reads
/// through this interface and never touches Drift rows or the network
/// directly (A14 egress confinement).
///
/// Local reads always hit the on-device cache (OFF-01); the network is
/// only ever written INTO the cache, never queried per keystroke.
abstract interface class CatalogDataSource {
  /// Local-cache search: canonical names + aliases (case-insensitive,
  /// English and Amharic), category filter, preference bias.
  Future<List<Food>> searchLocal(
    String query, {
    String? category,
    FoodPreference? preference,
  });

  /// All locally cached foods, preference-biased when asked.
  Future<List<Food>> allLocal({FoodPreference? preference});

  /// Locally cached foods of one category.
  Future<List<Food>> localByCategory(String category);

  /// The stored catalog version, or null when only the seed exists.
  Future<String?> storedVersion();

  /// Fetches the remote catalog snapshot; returns null when the catalog
  /// is unchanged (304 / version gate). Throws on transport or parse
  /// failure.
  Future<CatalogSnapshot?> fetchSnapshot({String? etag});

  /// Replaces the local catalog with [snapshot] in ONE transaction and
  /// records the catalog version + source. A throw rolls the whole
  /// replacement back, leaving the previous catalog intact (OFF-01).
  ///
  /// Implementations refuse a snapshot that would shrink the cache below
  /// [minRetainedRatio] of its current size unless [allowShrink] is set
  /// (durability guard, QA finding F-05).
  Future<void> replaceAll(CatalogSnapshot snapshot, {bool allowShrink = false});
}
