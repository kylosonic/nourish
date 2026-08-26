import 'food_source.dart';
import 'nutrition.dart';
import 'portion.dart';

/// A canonical catalog food.
class Food {
  Food({
    required this.id,
    required this.canonicalName,
    required this.category,
    required this.defaultPortion,
    required this.portions,
    required this.per100g,
    this.aliases = const [],
    required this.source,
    this.isSeed = false,
  });

  /// Stable identifier (for example `injera`).
  final String id;

  /// Canonical display name (for example `Injera`).
  final String canonicalName;

  /// Category bucket used by search chips (for example `Ethiopian`).
  final String category;

  /// The portion offered by default in search quick-add (LOG-05).
  final Portion defaultPortion;

  /// All known ways of portioning this food.
  final List<Portion> portions;

  /// Nutrition per 100 g.
  final NutritionPer100g per100g;

  /// Search aliases, including alternate spellings and Amharic forms.
  final List<String> aliases;

  /// Provenance of the nutrition values.
  final FoodSource source;

  /// True when this food ships with the bundled seed catalog.
  final bool isSeed;
}
