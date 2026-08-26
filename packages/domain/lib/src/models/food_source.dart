/// Provenance of a catalog food value (ADR-0004(e)).
///
/// Seed values are labeled `provisional-seed` and are never presented as
/// authoritative; the Ethiopian FCT 2025 import arrives in S1.
class FoodSource {
  const FoodSource({
    required this.name,
    this.version,
    this.foodCode,
    this.reference,
    this.importDate,
  });

  /// Source name, for example `provisional-seed` or `ethiopian-fct-2025`.
  final String name;

  /// Source dataset version, if any.
  final String? version;

  /// Food code within the source dataset, if any.
  final String? foodCode;

  /// Human-readable citation or reference, if any.
  final String? reference;

  /// When the source row was imported, if known.
  final DateTime? importDate;
}
