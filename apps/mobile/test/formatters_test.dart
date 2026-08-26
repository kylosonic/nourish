import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/core/formatters.dart';

void main() {
  group('roundHalfAwayFromZero', () {
    test('positive halves round up', () {
      expect(roundHalfAwayFromZero(2.5), 3);
      expect(roundHalfAwayFromZero(2.4), 2);
      expect(roundHalfAwayFromZero(0.5), 1);
    });

    test('negative halves round away from zero', () {
      expect(roundHalfAwayFromZero(-2.5), -3);
      expect(roundHalfAwayFromZero(-0.5), -1);
    });
  });

  group('formatKcal', () {
    test('rounds to whole kcal', () {
      expect(formatKcal(225), '225');
      expect(formatKcal(280.8), '281'); // shiro anchor rounding
      expect(formatKcal(225.4), '225');
    });
  });

  group('formatGrams', () {
    test('rounds to whole grams', () {
      expect(formatGrams(150), '150');
      expect(formatGrams(149.6), '150');
    });
  });

  group('formatLiters', () {
    test('renders the 3.0 L target', () {
      expect(formatLiters(3000), '3.0');
    });

    test('renders a 250 ml glass', () {
      expect(formatLiters(250), '0.25');
    });

    test('renders mixed values with at most two decimals', () {
      expect(formatLiters(1250), '1.25');
      expect(formatLiters(1000), '1.0');
      expect(formatLiters(0), '0.0');
    });
  });
}
