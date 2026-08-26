import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

void main() {
  NutritionPer100g per100g({
    double kcal = 0,
    double protein = 0,
    double carbs = 0,
    double fat = 0,
    double? fiber,
    double? sodium,
  }) {
    return NutritionPer100g(
      kcal: kcal,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      fiberG: fiber,
      sodiumMg: sodium,
    );
  }

  test('180 kcal/100g x 150g = 270 kcal (TGT-03 example)', () {
    final NutritionSnapshot snapshot = nutritionFor(per100g(kcal: 180), 150);
    expect(snapshot.kcal, 270);
  });

  test('150 kcal/100g x 150g = 225 kcal (injera design value)', () {
    final NutritionSnapshot snapshot = nutritionFor(per100g(kcal: 150), 150);
    expect(snapshot.kcal, 225);
  });

  test('rounding is half away from zero: 16.5 kcal rounds up to 17', () {
    final NutritionSnapshot up = nutritionFor(per100g(kcal: 33), 50);
    expect(up.kcal, 17);

    final NutritionSnapshot down = nutritionFor(per100g(kcal: 32.8), 50);
    expect(down.kcal, 16);
  });

  test('2000 g edge case scales by 20x', () {
    final NutritionSnapshot snapshot =
        nutritionFor(per100g(kcal: 180, protein: 4), 2000);
    expect(snapshot.kcal, 3600);
    expect(snapshot.proteinG, 80);
  });

  test('fiber and sodium keep one decimal', () {
    final NutritionSnapshot snapshot =
        nutritionFor(per100g(fiber: 2.25, sodium: 15), 150);
    expect(snapshot.fiberG, closeTo(3.4, 1e-9));
    expect(snapshot.sodiumMg, closeTo(22.5, 1e-9));
  });
}
