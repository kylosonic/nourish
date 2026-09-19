import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';
import 'package:nourish_mobile/features/insights/weekly_insights.dart';

/// INS-01 / INS-02 unit tests: the dashboard is a pure function of records, so
/// the rules — including the P-INS-1 distinction the behavior contract says
/// must not be papered over — are pinned here rather than inferred from a
/// screenshot.
void main() {
  const List<String> window = <String>[
    '2026-09-13',
    '2026-09-14',
    '2026-09-15',
    '2026-09-16',
    '2026-09-17',
    '2026-09-18',
    '2026-09-19',
  ];

  String label(String dateKey) {
    const Map<String, String> labels = <String, String>{
      '2026-09-13': 'Sun',
      '2026-09-14': 'Mon',
      '2026-09-15': 'Tue',
      '2026-09-16': 'Wed',
      '2026-09-17': 'Thu',
      '2026-09-18': 'Fri',
      '2026-09-19': 'Sat',
    };
    return labels[dateKey]!;
  }

  /// A meal on [dateKey] whose single item carries the given snapshot values.
  Meal mealOn(
    String dateKey, {
    double kcal = 500,
    double protein = 20,
    double carbs = 60,
    double fat = 15,
    double fiber = 6,
    double sodium = 400,
    String foodId = 'shiro_wot',
    String itemId = 'i1',
  }) {
    return Meal(
      id: 'm-$dateKey',
      dateKey: dateKey,
      slot: MealSlot.lunch,
      createdAt: DateTime.parse('$dateKey 12:00:00'),
      items: <MealItem>[
        MealItem(
          id: itemId,
          mealId: 'm-$dateKey',
          foodId: foodId,
          foodName: 'Shiro Wot',
          portionUnit: PortionUnit.cup,
          portionQuantity: 1,
          grams: 240,
          snapshot: NutritionSnapshot(
            kcal: kcal,
            proteinG: protein,
            carbsG: carbs,
            fatG: fat,
            fiberG: fiber,
            sodiumMg: sodium,
          ),
        ),
      ],
    );
  }

  DailyTarget target({int kcal = 2000, int protein = 100, int carbs = 250, int fat = 70}) {
    return DailyTarget(
      targetKcal: kcal,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      bmrKcal: 1500,
      tdeeKcal: 2000,
      goalAdjustmentKcal: 0,
      activityFactor: 1.375,
      pace: null,
      formulaVersion: 'test-1',
      dateGenerated: DateTime.parse('2026-09-13 08:00:00'),
      floorKcal: 1200,
    );
  }

  WeeklyInsights build({
    required List<Meal> meals,
    Map<String, int> water = const <String, int>{},
    DailyTarget? dailyTarget,
    Map<String, String> categories = const <String, String>{'shiro_wot': 'Ethiopian'},
  }) {
    return buildWeeklyInsights(
      windowDateKeys: window,
      weekdayLabelFor: label,
      meals: meals,
      waterMlByDateKey: water,
      target: dailyTarget,
      categoryByFoodId: categories,
    );
  }

  group('empty and partial windows', () {
    test('no meals at all is an empty state, never a zero-filled dashboard', () {
      final WeeklyInsights insights = build(meals: <Meal>[], dailyTarget: target());
      expect(insights.isEmpty, isTrue);
      expect(insights.loggedDays, 0);
      expect(insights.highlights, isEmpty);
    });

    test('a partly elapsed window is labelled honestly', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[mealOn('2026-09-19')],
        dailyTarget: target(),
      );
      expect(insights.isEmpty, isFalse);
      expect(insights.isPartial, isTrue);
      expect(insights.loggedDays, 1);
      expect(insights.windowDays, 7);
    });
  });

  group('P-INS-1: un-logged days are not zero-consumption days', () {
    test('a day with no meals is un-logged; a logged day totals its items', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[mealOn('2026-09-19', kcal: 500)],
        dailyTarget: target(),
      );
      final DayInsight unlogged = insights.days.firstWhere(
        (DayInsight d) => d.dateKey == '2026-09-18',
      );
      final DayInsight logged = insights.days.firstWhere(
        (DayInsight d) => d.dateKey == '2026-09-19',
      );
      expect(unlogged.logged, isFalse);
      expect(unlogged.kcal, 0);
      expect(logged.logged, isTrue);
      expect(logged.kcal, 500);
    });

    test('averages divide by logged days, not by the whole window', () {
      // Two logged days at 1000 kcal each: the honest average is 1000, not 286.
      final WeeklyInsights insights = build(
        meals: <Meal>[
          mealOn('2026-09-18', kcal: 1000),
          mealOn('2026-09-19', kcal: 1000),
        ],
        dailyTarget: target(),
      );
      expect(insights.loggedDays, 2);
      expect(insights.averageKcal, 1000);
    });
  });

  group('caloric balance', () {
    test('flags exactly the days over target (INS-01 acceptance example)', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[
          mealOn('2026-09-17', kcal: 1800),
          mealOn('2026-09-18', kcal: 2400), // Friday, over a 2000 target
          mealOn('2026-09-19', kcal: 2000), // exactly on target is not "over"
        ],
        dailyTarget: target(kcal: 2000),
      );
      final List<String> over = insights.days
          .where((DayInsight d) => d.exceededTarget)
          .map((DayInsight d) => d.weekdayLabel)
          .toList();
      expect(over, <String>['Fri']);
    });

    test('nothing is flagged over target when there is no target yet', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[mealOn('2026-09-19', kcal: 5000)],
      );
      expect(insights.targetKcal, 0);
      expect(insights.days.every((DayInsight d) => !d.exceededTarget), isTrue);
    });
  });

  group('macro averages', () {
    test('reports the average against the target as a percentage', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[
          mealOn('2026-09-18', protein: 110),
          mealOn('2026-09-19', protein: 90),
        ],
        dailyTarget: target(protein: 100),
      );
      expect(insights.averageProteinG, 100);
      expect(insights.percentOfTarget(insights.averageProteinG, insights.targetProteinG), 100);
    });
  });

  group('dietary diversity', () {
    test('splits logged items by their catalog category', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[
          mealOn('2026-09-18', foodId: 'shiro_wot', itemId: 'a'),
          mealOn('2026-09-19', foodId: 'pasta', itemId: 'b'),
        ],
        categories: <String, String>{'shiro_wot': 'Ethiopian', 'pasta': 'Dinner'},
      );
      expect(insights.ethiopianShare, closeTo(0.5, 0.001));
    });

    test('an item the catalog no longer knows is not guessed into a group', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[
          mealOn('2026-09-18', foodId: 'deleted_food', itemId: 'a'),
        ],
        categories: const <String, String>{},
      );
      expect(insights.ethiopianShare, isNull);
      // The unknown item is counted, and it sits on the day it was logged.
      final int unknowns = insights.days.fold<int>(
        0,
        (int sum, DayInsight d) => sum + d.unknownItems,
      );
      expect(unknowns, 1);
    });
  });

  group('INS-02 highlights', () {
    test('a sodium spike names the specific day and the percentage', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[
          mealOn('2026-09-18', sodium: 2300), // Friday, 15% over 2000 mg
        ],
        dailyTarget: target(),
      );
      final InsightHighlight sodium = insights.highlights.firstWhere(
        (InsightHighlight h) => h.title == 'Sodium intake',
      );
      expect(sodium.kind, HighlightKind.cautionary);
      expect(sodium.detail, contains('15%'));
      expect(sodium.detail, contains('Fri'));
    });

    test('no sodium highlight when nothing is over the reference', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[mealOn('2026-09-18', sodium: 400)],
        dailyTarget: target(),
      );
      expect(
        insights.highlights.any((InsightHighlight h) => h.title == 'Sodium intake'),
        isFalse,
      );
    });

    test('fiber is only praised when the data supports the claim', () {
      // Six of seven logged days over the fiber reference: worth saying.
      final WeeklyInsights consistent = build(
        meals: <Meal>[
          for (final String day in window)
            mealOn(day, fiber: 30),
        ],
        dailyTarget: target(),
      );
      final InsightHighlight fiber = consistent.highlights.firstWhere(
        (InsightHighlight h) => h.title == 'Fiber goal met',
      );
      expect(fiber.kind, HighlightKind.positive);
      expect(fiber.detail, contains('7 of your 7'));

      // One low-fiber day only: no claim either way, because the rule needs a
      // pattern. And never a generic "you're doing great".
      final WeeklyInsights thin = build(
        meals: <Meal>[mealOn('2026-09-19', fiber: 3)],
        dailyTarget: target(),
      );
      expect(
        thin.highlights.any((InsightHighlight h) => h.title == 'Fiber goal met'),
        isFalse,
      );
    });

    test('over-target days are named, not described vaguely', () {
      final WeeklyInsights insights = build(
        meals: <Meal>[
          mealOn('2026-09-18', kcal: 2400),
          mealOn('2026-09-19', kcal: 2600),
        ],
        dailyTarget: target(kcal: 2000),
      );
      final InsightHighlight over = insights.highlights.firstWhere(
        (InsightHighlight h) => h.title == 'Over your target',
      );
      expect(over.detail, contains('2 days'));
      expect(over.detail, contains('Fri'));
      expect(over.detail, contains('Sat'));
      expect(over.detail, contains('2000'));
    });

    test('no highlights at all without logged data', () {
      expect(build(meals: <Meal>[], dailyTarget: target()).highlights, isEmpty);
    });
  });
}
