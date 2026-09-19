import 'package:nourish_domain/domain.dart';

/// Weekly insights derived from the user's own logged data (INS-01 / INS-02).
///
/// Everything here is a pure function of local records: no model, no network,
/// no template. If the data does not support a claim, the claim is not made —
/// which is why the model carries `logged` per day rather than only totals.
///
/// **P-INS-1, resolved as the architect (this is the decision the behavior
/// contract says must not be papered over):** a day with no logged meals and a
/// day on which the user logged meals totalling zero are DIFFERENT states.
/// [DayInsight.logged] distinguishes them, the chart draws an un-logged day as
/// an empty slot with no bar at all, and averages are taken over logged days
/// while the window size stays honest.

/// How many days the dashboard looks back.
const int insightsWindowDays = 7;

enum HighlightKind { positive, cautionary }

/// One data-driven finding. [detail] must cite the specific day or count.
class InsightHighlight {
  const InsightHighlight({
    required this.kind,
    required this.title,
    required this.detail,
  });

  final HighlightKind kind;
  final String title;
  final String detail;
}

/// One day of the window.
class DayInsight {
  const DayInsight({
    required this.dateKey,
    required this.weekdayLabel,
    required this.logged,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.fiberG,
    required this.sodiumMg,
    required this.waterMl,
    required this.ethiopianItems,
    required this.otherItems,
    required this.unknownItems,
    required this.exceededTarget,
  });

  final String dateKey;

  /// Three-letter weekday label for the chart axis.
  final String weekdayLabel;

  /// True when at least one meal was logged that day. A logged day may still
  /// total zero; an un-logged day has no consumption to report at all.
  final bool logged;

  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final double fiberG;
  final double sodiumMg;
  final int waterMl;

  /// Diversity counts, derived from the logged items' catalog categories.
  final int ethiopianItems;
  final int otherItems;
  /// Items whose food is no longer in the local catalog: counted honestly
  /// rather than guessed into one of the two groups.
  final int unknownItems;

  final bool exceededTarget;
}

/// The whole dashboard payload.
class WeeklyInsights {
  const WeeklyInsights({
    required this.days,
    required this.targetKcal,
    required this.targetProteinG,
    required this.targetCarbsG,
    required this.targetFatG,
    required this.highlights,
  });

  final List<DayInsight> days;
  final int targetKcal;
  final int targetProteinG;
  final int targetCarbsG;
  final int targetFatG;
  final List<InsightHighlight> highlights;

  int get loggedDays => days.where((DayInsight d) => d.logged).length;
  int get windowDays => days.length;

  /// No meals anywhere in the window: the screen shows an empty state, never a
  /// zero-filled dashboard (INS-01 failure outcome).
  bool get isEmpty => loggedDays == 0;

  /// A window that is only partly elapsed (a new account) is labelled honestly.
  bool get isPartial => loggedDays > 0 && loggedDays < windowDays;

  /// Mean intake over LOGGED days — dividing by the window would understate a
  /// user who has only just started.
  double get averageKcal => loggedDays == 0
      ? 0
      : days
              .where((DayInsight d) => d.logged)
              .fold<double>(0, (double sum, DayInsight d) => sum + d.kcal) /
          loggedDays;

  double get averageProteinG => _average((DayInsight d) => d.proteinG);
  double get averageCarbsG => _average((DayInsight d) => d.carbsG);
  double get averageFatG => _average((DayInsight d) => d.fatG);
  double get averageFiberG => _average((DayInsight d) => d.fiberG);
  double get averageSodiumMg => _average((DayInsight d) => d.sodiumMg);

  double _average(double Function(DayInsight) pick) => loggedDays == 0
      ? 0
      : days
              .where((DayInsight d) => d.logged)
              .fold<double>(0, (double sum, DayInsight d) => sum + pick(d)) /
          loggedDays;

  /// Share of logged items that are Ethiopian, or null when nothing could be
  /// classified (an honest "unknown" rather than a made-up split).
  double? get ethiopianShare {
    final int classified = days.fold<int>(
      0,
      (int sum, DayInsight d) => sum + d.ethiopianItems + d.otherItems,
    );
    if (classified == 0) return null;
    final int ethiopian = days.fold<int>(
      0,
      (int sum, DayInsight d) => sum + d.ethiopianItems,
    );
    return ethiopian / classified;
  }

  /// Percentage of the macro target met on average, capped at 999 so a wild
  /// value cannot produce an absurd label.
  int percentOfTarget(double average, int target) {
    if (target <= 0) return 0;
    return ((average / target) * 100).round().clamp(0, 999);
  }
}

/// Total fiber the FCT-derived targets imply; the app has no fiber target of
/// its own, so the highlight compares against a documented reference intake
/// rather than inventing a goal (25 g/day is the WHO/FAO population reference
/// for an adult).
const double dailyFiberReferenceG = 25;

/// Sodium reference used for the cautionary highlight. The app has no sodium
/// target either; 2000 mg/day is the WHO recommendation this project cites.
const double dailySodiumReferenceMg = 2000;

/// Build the dashboard from raw records.
///
/// [meals] may contain meals from any date; only the window is used.
/// [categoryByFoodId] maps a food id to its catalog category, used for the
/// diversity split.
WeeklyInsights buildWeeklyInsights({
  required List<String> windowDateKeys,
  required String Function(String dateKey) weekdayLabelFor,
  required List<Meal> meals,
  required Map<String, int> waterMlByDateKey,
  required DailyTarget? target,
  required Map<String, String> categoryByFoodId,
}) {
  final Map<String, List<Meal>> byDay = <String, List<Meal>>{};
  for (final Meal meal in meals) {
    byDay.putIfAbsent(meal.dateKey, () => <Meal>[]).add(meal);
  }

  final int targetKcal = target?.targetKcal ?? 0;
  final List<DayInsight> days = <DayInsight>[];

  for (final String dateKey in windowDateKeys) {
    final List<Meal> dayMeals = byDay[dateKey] ?? const <Meal>[];
    final NutritionTotals totals = totalsFor(dayMeals);
    int ethiopian = 0;
    int other = 0;
    int unknown = 0;
    for (final Meal meal in dayMeals) {
      for (final MealItem item in meal.items) {
        final String? category = categoryByFoodId[item.foodId];
        if (category == null) {
          unknown++;
        } else if (category.toLowerCase() == 'ethiopian') {
          ethiopian++;
        } else {
          other++;
        }
      }
    }
    days.add(
      DayInsight(
        dateKey: dateKey,
        weekdayLabel: weekdayLabelFor(dateKey),
        // "Logged" means the user recorded something. An un-logged day is not
        // a zero-consumption day (P-INS-1).
        logged: dayMeals.isNotEmpty,
        kcal: totals.kcal.toDouble(),
        proteinG: totals.protein,
        carbsG: totals.carbs,
        fatG: totals.fat,
        fiberG: totals.fiber,
        sodiumMg: totals.sodium,
        waterMl: waterMlByDateKey[dateKey] ?? 0,
        ethiopianItems: ethiopian,
        otherItems: other,
        unknownItems: unknown,
        exceededTarget: targetKcal > 0 && totals.kcal > targetKcal,
      ),
    );
  }

  final WeeklyInsights insights = WeeklyInsights(
    days: days,
    targetKcal: targetKcal,
    targetProteinG: target?.proteinG ?? 0,
    targetCarbsG: target?.carbsG ?? 0,
    targetFatG: target?.fatG ?? 0,
    highlights: const <InsightHighlight>[],
  );

  return WeeklyInsights(
    days: insights.days,
    targetKcal: insights.targetKcal,
    targetProteinG: insights.targetProteinG,
    targetCarbsG: insights.targetCarbsG,
    targetFatG: insights.targetFatG,
    highlights: generateHighlights(insights),
  );
}

/// INS-02: derive highlights from real patterns.
///
/// Each rule states a specific, checkable fact and cites the day or the count.
/// A rule that cannot be supported by the data emits nothing — there is no
/// fallback "you're doing great" line.
List<InsightHighlight> generateHighlights(WeeklyInsights insights) {
  final List<InsightHighlight> highlights = <InsightHighlight>[];
  final List<DayInsight> logged = insights.days
      .where((DayInsight d) => d.logged)
      .toList();
  if (logged.isEmpty) return highlights;

  // Fiber: only claim consistency when it is actually consistent.
  final int fiberDays = logged
      .where((DayInsight d) => d.fiberG >= dailyFiberReferenceG)
      .length;
  if (fiberDays >= 4) {
    highlights.add(
      InsightHighlight(
        kind: HighlightKind.positive,
        title: 'Fiber goal met',
        detail:
            'You reached $dailyFiberReferenceG g of fiber on $fiberDays of your ${logged.length} logged days.',
      ),
    );
  } else if (fiberDays == 0 && logged.length >= 3) {
    highlights.add(
      InsightHighlight(
        kind: HighlightKind.cautionary,
        title: 'Low fiber',
        detail:
            'None of your ${logged.length} logged days reached $dailyFiberReferenceG g of fiber.',
      ),
    );
  }

  // Sodium: name the day that went over, with the actual percentage.
  final DayInsight? salty = _maxBy(logged, (DayInsight d) => d.sodiumMg);
  if (salty != null && salty.sodiumMg > dailySodiumReferenceMg) {
    final int percent =
        (((salty.sodiumMg - dailySodiumReferenceMg) / dailySodiumReferenceMg) * 100).round();
    highlights.add(
      InsightHighlight(
        kind: HighlightKind.cautionary,
        title: 'Sodium intake',
        detail:
            'Sodium was $percent% above the ${dailySodiumReferenceMg.round()} mg reference on ${salty.weekdayLabel}.',
      ),
    );
  }

  // Calories over target: name every over-target day rather than a vague trend.
  final List<DayInsight> over = logged
      .where((DayInsight d) => d.exceededTarget)
      .toList();
  if (over.isNotEmpty && insights.targetKcal > 0) {
    final String dayNames = over.map((DayInsight d) => d.weekdayLabel).join(', ');
    highlights.add(
      InsightHighlight(
        kind: HighlightKind.cautionary,
        title: 'Over your target',
        detail:
            'You went over your ${insights.targetKcal} kcal target on '
            '${over.length == 1 ? dayNames : '${over.length} days ($dayNames)'}.',
      ),
    );
  }

  // Logging consistency: a real count, and only worth saying once it is a
  // pattern rather than a single entry.
  if (insights.loggedDays >= 3) {
    highlights.add(
      InsightHighlight(
        kind: insights.loggedDays >= 5
            ? HighlightKind.positive
            : HighlightKind.cautionary,
        title: 'Logging consistency',
        detail:
            'You logged on ${insights.loggedDays} of the last ${insights.windowDays} days.',
      ),
    );
  }

  return highlights;
}

DayInsight? _maxBy(List<DayInsight> days, double Function(DayInsight) pick) {
  DayInsight? best;
  for (final DayInsight day in days) {
    if (best == null || pick(day) > pick(best)) best = day;
  }
  return best;
}
