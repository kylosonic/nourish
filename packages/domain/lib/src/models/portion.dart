import 'portion_unit.dart';

/// A measured way of serving one food (for example 1 injera = 150 g).
///
/// Gram weights are per food: a bowl of shiro is not the same weight as
/// a bowl of pasta (blueprint section 9, TGT-02).
class Portion {
  const Portion({
    required this.unit,
    required this.grams,
    this.quantity = 1,
  });

  /// The measuring unit ([PortionUnit.injera], [PortionUnit.bowl], ...).
  final PortionUnit unit;

  /// Weight in grams that [quantity] of this unit represents.
  final double grams;

  /// How many units the gram weight refers to (usually 1; 0.5 for half
  /// portions).
  final double quantity;

  /// Human-readable portion description, for example `1 injera (150g)`.
  String label() {
    final String quantityText =
        quantity % 1 == 0 ? quantity.toInt().toString() : quantity.toString();
    final String gramsText =
        grams % 1 == 0 ? grams.toInt().toString() : grams.toStringAsFixed(1);
    return '$quantityText ${unit.name} (${gramsText}g)';
  }
}
