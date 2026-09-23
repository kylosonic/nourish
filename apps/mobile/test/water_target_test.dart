import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/core/water_target.dart';
import 'package:nourish_mobile/data/repositories/water_repository.dart';

/// WW-01: the daily water goal is the user's own, adjustable a glass at a time,
/// and cannot be pushed outside the range the app is willing to stand behind.
void main() {
  group('adjustWaterTargetMl', () {
    test('moves one glass per step', () {
      expect(adjustWaterTargetMl(3000, 1), 3250);
      expect(adjustWaterTargetMl(3000, -1), 2750);
      expect(adjustWaterTargetMl(3000, 2), 3500);
    });

    test('clamps at the lower bound instead of going below it', () {
      expect(adjustWaterTargetMl(minWaterTargetMl, -1), minWaterTargetMl);
      expect(adjustWaterTargetMl(minWaterTargetMl + 100, -5), minWaterTargetMl);
    });

    test('clamps at the upper bound instead of going above it', () {
      expect(adjustWaterTargetMl(maxWaterTargetMl, 1), maxWaterTargetMl);
      expect(adjustWaterTargetMl(maxWaterTargetMl - 100, 5), maxWaterTargetMl);
    });

    test('a zero step is a no-op', () {
      expect(adjustWaterTargetMl(3000, 0), 3000);
    });
  });

  group('canAdjustWaterTargetMl', () {
    test('true while there is room in the given direction', () {
      expect(canAdjustWaterTargetMl(3000, 1), isTrue);
      expect(canAdjustWaterTargetMl(3000, -1), isTrue);
    });

    test('false at the bound the control is pushing against', () {
      expect(canAdjustWaterTargetMl(maxWaterTargetMl, 1), isFalse);
      expect(canAdjustWaterTargetMl(minWaterTargetMl, -1), isFalse);
      // The disabled direction is only the one at the bound.
      expect(canAdjustWaterTargetMl(maxWaterTargetMl, -1), isTrue);
    });
  });

  group('the documented default', () {
    test('is 3.0 L and is the same number the repository reports', () {
      expect(defaultWaterTargetMl, 3000);
      expect(
        WaterRepository.defaultTargetMl,
        defaultWaterTargetMl,
        reason: 'one default, not two copies of it',
      );
    });

    test('sits inside the adjustable range', () {
      expect(defaultWaterTargetMl, greaterThan(minWaterTargetMl));
      expect(defaultWaterTargetMl, lessThan(maxWaterTargetMl));
    });
  });
}
