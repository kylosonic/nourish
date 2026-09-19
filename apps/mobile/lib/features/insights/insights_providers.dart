import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_domain/domain.dart';

import '../../core/clock.dart';
import '../../core/date_utils.dart';
import '../../providers.dart';
import 'weekly_insights.dart';

/// The trailing 7 calendar days, oldest first, ending on the clock's today.
///
/// Derived from the injectable clock so a test (or a device crossing midnight)
/// gets the window it should, rather than whatever `DateTime.now()` said when
/// the provider was first read.
final Provider<List<String>> insightsWindowProvider = Provider<List<String>>(
  (Ref<List<String>> ref) {
    final Clock clock = ref.watch(clockProvider);
    final DateTime today = dateOnly(clock());
    return <String>[
      for (int offset = insightsWindowDays - 1; offset >= 0; offset--)
        dateKeyFor(today.subtract(Duration(days: offset))),
    ];
  },
);

/// Everything the dashboard needs, assembled from local records only.
///
/// This is deliberately a FutureProvider over the local database: insights are
/// computed from what the user logged, never from a server aggregate and never
/// from a model.
final FutureProvider<WeeklyInsights> weeklyInsightsProvider =
    FutureProvider<WeeklyInsights>((ref) async {
  final List<String> window = ref.watch(insightsWindowProvider);
  final String startKey = window.first;
  final String endKey = window.last;

  final List<Meal> meals = await ref
      .watch(mealRepositoryProvider)
      .mealsInRange(startKey, endKey);

  final Map<String, int> waterByDay = <String, int>{};
  for (final String dateKey in window) {
    waterByDay[dateKey] = await ref
        .watch(waterRepositoryProvider)
        .dailyTotalMl(dateKey);
  }

  final DailyTarget? target = await ref
      .watch(targetRepositoryProvider)
      .latest();

  // Diversity needs to know what kind of food each logged item was, which the
  // meal snapshot does not carry; the local catalog does.
  final List<Food> catalog = await ref.watch(foodRepositoryProvider).allFoods();
  final Map<String, String> categoryByFoodId = <String, String>{
    for (final Food food in catalog) food.id: food.category,
  };

  return buildWeeklyInsights(
    windowDateKeys: window,
    weekdayLabelFor: weekdayLabelFor,
    meals: meals,
    waterMlByDateKey: waterByDay,
    target: target,
    categoryByFoodId: categoryByFoodId,
  );
});
