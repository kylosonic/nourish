import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

void main() {
  const List<Portion> injeraPortions = [
    Portion(unit: PortionUnit.injera, grams: 150, quantity: 1),
  ];

  test('injera: 1 unit = 150 g', () {
    final double grams = portionToGrams(injeraPortions, PortionUnit.injera, 1);
    expect(grams, 150);
  });

  test('half injera: quantity 0.5 = 75 g', () {
    final double grams = portionToGrams(injeraPortions, PortionUnit.injera, 0.5);
    expect(grams, 75);
  });

  test('bowl differs per food: shiro bowl = 240 g', () {
    const List<Portion> portions = [
      Portion(unit: PortionUnit.bowl, grams: 240, quantity: 1),
    ];
    final double grams = portionToGrams(portions, PortionUnit.bowl, 1);
    expect(grams, 240);
  });

  test('bowl differs per food: pasta bowl = 180 g', () {
    const List<Portion> portions = [
      Portion(unit: PortionUnit.bowl, grams: 180, quantity: 1),
    ];
    final double grams = portionToGrams(portions, PortionUnit.bowl, 1);
    expect(grams, 180);
  });

  test('unknown unit for a food throws PortionEngineException', () {
    expect(
      () => portionToGrams(injeraPortions, PortionUnit.cup, 1),
      throwsA(isA<PortionEngineException>()),
    );
  });
}
