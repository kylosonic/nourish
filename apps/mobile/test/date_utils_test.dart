import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/core/date_utils.dart';

void main() {
  group('dateKeyFor', () {
    test('formats yyyy-MM-dd', () {
      expect(dateKeyFor(DateTime(2026, 8, 26)), '2026-08-26');
    });

    test('zero-pads month and day', () {
      expect(dateKeyFor(DateTime(2026, 1, 5)), '2026-01-05');
    });

    test('zero-pads the year', () {
      expect(dateKeyFor(DateTime(26, 8, 26)), '0026-08-26');
    });

    test('midnight and 23:59 share the same date key', () {
      expect(
        dateKeyFor(DateTime(2026, 8, 26, 0, 0)),
        dateKeyFor(DateTime(2026, 8, 26, 23, 59, 59)),
      );
    });
  });

  group('greetingBucketFor (HOME-01)', () {
    test('before noon is morning', () {
      expect(
        greetingBucketFor(DateTime(2026, 8, 26, 6)),
        GreetingBucket.morning,
      );
      expect(
        greetingBucketFor(DateTime(2026, 8, 26, 11, 59)),
        GreetingBucket.morning,
      );
      expect(
        greetingBucketFor(DateTime(2026, 8, 26, 0)),
        GreetingBucket.morning,
      );
    });

    test('noon to 16:59 is afternoon', () {
      expect(
        greetingBucketFor(DateTime(2026, 8, 26, 12)),
        GreetingBucket.afternoon,
      );
      expect(
        greetingBucketFor(DateTime(2026, 8, 26, 16, 59)),
        GreetingBucket.afternoon,
      );
    });

    test('17:00 onward is evening', () {
      expect(
        greetingBucketFor(DateTime(2026, 8, 26, 17)),
        GreetingBucket.evening,
      );
      expect(
        greetingBucketFor(DateTime(2026, 8, 26, 23, 59)),
        GreetingBucket.evening,
      );
    });
  });
}
