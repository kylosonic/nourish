/// Calendar-day keys and greeting buckets (blueprint §6 core utils).
library;

/// Local calendar day as `yyyy-MM-dd`.
String dateKeyFor(DateTime date) {
  final String y = date.year.toString().padLeft(4, '0');
  final String m = date.month.toString().padLeft(2, '0');
  final String d = date.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

/// Today's date key (local time).
String todayDateKey() => dateKeyFor(DateTime.now());

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
