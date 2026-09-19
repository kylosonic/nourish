/// Calendar-day keys and greeting buckets (blueprint §6 core utils).
library;

import 'clock.dart';

/// Local calendar day as `yyyy-MM-dd`.
String dateKeyFor(DateTime date) {
  final String y = date.year.toString().padLeft(4, '0');
  final String m = date.month.toString().padLeft(2, '0');
  final String d = date.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

/// Today's date key (local time), read through the injectable [clock]
/// seam (M3). Passing a fixed clock recomputes the key for that instant.
String todayDateKey([Clock? clock]) => dateKeyFor((clock ?? systemClock)());

/// The calendar day of an instant, with the time of day dropped.
DateTime dateOnly(DateTime instant) =>
    DateTime(instant.year, instant.month, instant.day);

const List<String> _weekdayLabels = <String>[
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

/// Short weekday label for a `yyyy-MM-dd` key (chart axis, INS-01).
///
/// A fixed table rather than locale formatting, so the axis is stable in a
/// widget test and cannot change silently with the host locale.
String weekdayLabelFor(String dateKey) {
  final DateTime? parsed = DateTime.tryParse(dateKey);
  if (parsed == null) return '';
  return _weekdayLabels[parsed.weekday - 1];
}

/// Home-screen greeting buckets (HOME-01).
enum GreetingBucket { morning, afternoon, evening }

/// Morning: before 12:00; afternoon: 12:00–16:59; evening: 17:00+.
GreetingBucket greetingBucketFor(DateTime time) {
  final int hour = time.hour;
  if (hour < 12) {
    return GreetingBucket.morning;
  }
  if (hour < 17) {
    return GreetingBucket.afternoon;
  }
  return GreetingBucket.evening;
}
