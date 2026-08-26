import '../models/portion.dart';
import '../models/portion_unit.dart';

/// Thrown when a food has no portion defined for the requested unit.
class PortionEngineException implements Exception {
  const PortionEngineException(this.message);

  final String message;

  @override
  String toString() => 'PortionEngineException: $message';
}

/// Converts a portion amount to grams using the food's own portion
/// table (TGT-02, blueprint section 9).
///
/// Gram weights are per food: [portions] is the food's table, so a bowl
/// of shiro converts differently from a bowl of pasta.
///
/// Throws [PortionEngineException] when no portion matches [unit].
double portionToGrams(List<Portion> portions, PortionUnit unit, double quantity) {
  for (final Portion portion in portions) {
    if (portion.unit == unit) {
      if (portion.quantity <= 0) {
        throw PortionEngineException(
            'portion for unit ${unit.name} has non-positive quantity');
      }
      return portion.grams * quantity / portion.quantity;
    }
  }
  throw PortionEngineException('no portion defined for unit ${unit.name}');
}
