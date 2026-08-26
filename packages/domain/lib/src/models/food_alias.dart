import 'language.dart';

/// A localized alias pointing at a canonical food.
///
/// S0 persists language selection and stores aliases (including Amharic),
/// even though UI strings ship in English (PPA-6).
class FoodAlias {
  const FoodAlias({
    required this.alias,
    required this.language,
  });

  /// The alias text, for example `doro wet` or `ዶሮ ወጥ`.
  final String alias;

  /// Language the alias is written in.
  final AppLanguage language;
}
