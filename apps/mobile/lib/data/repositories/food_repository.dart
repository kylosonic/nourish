import 'package:nourish_domain/domain.dart';

import '../sources/catalog_data_source.dart';

/// Catalog read model (S1): delegates search and browse semantics to the
/// [CatalogDataSource] seam. The public API and behavior are unchanged
/// from S0; only the internals moved behind the seam (blueprint S1 §6).
class FoodRepository {
  FoodRepository(this._source);

  final CatalogDataSource _source;

  /// Searches canonical names + aliases (case-insensitive, English and
  /// Amharic), optionally filters by category, and orders results with
  /// the user's cuisine preference bias.
  Future<List<Food>> search(
    String query, {
    String? category,
    FoodPreference? preference,
  }) {
    return _source.searchLocal(
      query,
      category: category,
      preference: preference,
    );
  }

  Future<List<Food>> allFoods({FoodPreference? preference}) {
    return _source.allLocal(preference: preference);
  }

  Future<List<Food>> foodsByCategory(String category) {
    return _source.localByCategory(category);
  }
}
