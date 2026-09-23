import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/features/recommendations/what_can_i_eat.dart';

/// INS-03 unit tests: the recommender is a pure function of the catalog and the
/// request, so its rules — including the failure outcome the contract insists on
/// — are pinned here rather than inferred from a screenshot.
void main() {
  /// A catalog food with a 100 g default portion, so `per100g` is also the
  /// portion's nutrition and the arithmetic in these tests stays readable.
  Food food({
    required String id,
    required String name,
    required String category,
    double kcal = 200,
    double proteinG = 10,
    double grams = 100,
  }) {
    return Food(
      id: id,
      canonicalName: name,
      category: category,
      defaultPortion: Portion(unit: PortionUnit.grams, grams: grams),
      portions: <Portion>[Portion(unit: PortionUnit.grams, grams: grams)],
      per100g: NutritionPer100g(
        kcal: kcal,
        proteinG: proteinG,
        carbsG: 20,
        fatG: 5,
      ),
      source: const FoodSource(name: 'test', version: '1'),
    );
  }

  /// The acceptance example's budget: 500 kcal left and 35 g of protein needed.
  RecommendationRequest request({
    int remainingKcal = 500,
    double proteinNeedG = 35,
    FoodPreference preference = FoodPreference.ethiopian,
    MealSlot slot = MealSlot.lunch,
    Set<String> recent = const <String>{},
    bool atFloor = false,
  }) {
    return RecommendationRequest(
      remainingKcal: remainingKcal,
      proteinNeedG: proteinNeedG,
      preference: preference,
      slot: slot,
      recentlyLoggedFoodIds: recent,
      targetAtSafetyFloor: atFloor,
    );
  }

  group('INS-03 acceptance: a 500 kcal budget with a 35 g protein need', () {
    test('every suggestion fits the budget and together they can meet the need',
        () {
      final RecommendationResult result = recommendFoods(
        request: request(),
        catalog: <Food>[
          food(id: 'lentils', name: 'Lentils', category: 'Ethiopian', kcal: 200, proteinG: 18),
          food(id: 'chicken', name: 'Chicken', category: 'Dinner', kcal: 250, proteinG: 20),
          food(id: 'injera', name: 'Injera', category: 'Ethiopian', kcal: 150, proteinG: 4),
          food(id: 'pasta', name: 'Pasta', category: 'Dinner', kcal: 300, proteinG: 8),
        ],
      );

      expect(result.outcome, RecommendationOutcome.suggested);
      expect(result.suggestions, isNotEmpty);
      for (final FoodSuggestion suggestion in result.suggestions) {
        expect(
          suggestion.kcal,
          lessThanOrEqualTo(500),
          reason: 'a suggestion outside the budget is not a suggestion',
        );
      }
      expect(
        result.meetsProteinNeed,
        isTrue,
        reason: 'the list as a whole must be able to close a 35 g gap',
      );
      expect(result.coveredProteinG, greaterThanOrEqualTo(35));
      expect(result.usedKcal, lessThanOrEqualTo(500));
    });

    test('local foods rank among the results and density leads the order', () {
      final RecommendationResult result = recommendFoods(
        request: request(proteinNeedG: 0),
        catalog: <Food>[
          food(id: 'pasta', name: 'Pasta', category: 'Dinner', kcal: 300, proteinG: 8),
          food(id: 'lentils', name: 'Lentils', category: 'Ethiopian', kcal: 200, proteinG: 18),
          food(id: 'chicken', name: 'Chicken', category: 'Dinner', kcal: 250, proteinG: 20),
        ],
      );

      final List<String> ids = result.suggestions
          .map((FoodSuggestion s) => s.food.id)
          .toList();
      expect(ids, contains('lentils'));
      expect(
        ids.first,
        'lentils',
        reason: '18 g of protein for 200 kcal (0.090 g/kcal) beats chicken\'s '
            '20 g for 250 kcal (0.080 g/kcal)',
      );
      expect(
        result.suggestions.first.isLocal,
        isTrue,
        reason: 'contract: Ethiopian foods rank among the results',
      );
      expect(
        ids,
        isNot(contains('pasta')),
        reason: 'lentils and chicken already use 450 of the 500 kcal',
      );
    });

    test('a user who chose international food gets no local boost', () {
      // Identical numbers, no slot match either way: the only difference left
      // is the preference rule, and the name order is the opposite of the
      // category order so a boost is visible.
      final List<Food> catalog = <Food>[
        food(id: 'local', name: 'Zebra Dish', category: 'Ethiopian', kcal: 200, proteinG: 15),
        food(id: 'other', name: 'Alpha Dish', category: 'Dinner', kcal: 200, proteinG: 15),
      ];

      final RecommendationResult prefersLocal = recommendFoods(
        request: request(preference: FoodPreference.ethiopian, slot: MealSlot.other, proteinNeedG: 0),
        catalog: catalog,
      );
      expect(
        prefersLocal.suggestions.first.food.id,
        'local',
        reason: 'with the local boost, the Ethiopian dish leads despite its name',
      );

      final RecommendationResult prefersInternational = recommendFoods(
        request: request(preference: FoodPreference.international, slot: MealSlot.other, proteinNeedG: 0),
        catalog: catalog,
      );
      expect(
        prefersInternational.suggestions.first.food.id,
        'other',
        reason: 'no boost either way, so the deterministic name tie-break decides',
      );
    });

    test('the meal slot is respected', () {
      final RecommendationResult result = recommendFoods(
        request: request(slot: MealSlot.breakfast, proteinNeedG: 0),
        catalog: <Food>[
          food(id: 'eggs', name: 'Eggs', category: 'Breakfast', kcal: 150, proteinG: 12),
          food(id: 'pasta', name: 'Pasta', category: 'Dinner', kcal: 300, proteinG: 10),
        ],
      );

      final FoodSuggestion first = result.suggestions.first;
      expect(first.food.id, 'eggs');
      expect(first.matchesSlot, isTrue);
    });

    test('a food logged in the last three days is de-prioritized', () {
      final List<Food> catalog = <Food>[
        food(id: 'a', name: 'A Dish', category: 'Dinner', kcal: 200, proteinG: 15),
        food(id: 'b', name: 'B Dish', category: 'Dinner', kcal: 200, proteinG: 15),
      ];

      final RecommendationResult fresh = recommendFoods(
        request: request(proteinNeedG: 0),
        catalog: catalog,
      );
      expect(fresh.suggestions.first.food.id, 'a');

      final RecommendationResult repeated = recommendFoods(
        request: request(proteinNeedG: 0, recent: <String>{'a'}),
        catalog: catalog,
      );
      expect(
        repeated.suggestions.first.food.id,
        'b',
        reason: 'the same dish should not be suggested every day',
      );
      expect(
        repeated.suggestions
            .firstWhere((FoodSuggestion s) => s.food.id == 'a')
            .recentlyLogged,
        isTrue,
      );
    });
  });

  group('INS-03 failure and edge outcomes', () {
    test('a spent budget yields no suggestions and says why', () {
      final RecommendationResult result = recommendFoods(
        request: request(remainingKcal: 0, proteinNeedG: 20),
        catalog: <Food>[
          food(id: 'lentils', name: 'Lentils', category: 'Ethiopian', kcal: 100),
        ],
      );

      expect(result.outcome, RecommendationOutcome.budgetSpent);
      expect(result.suggestions, isEmpty);
      expect(result.coveredProteinG, 0);
    });

    test('a negative budget is treated as spent, never as room to eat', () {
      final RecommendationResult result = recommendFoods(
        request: request(remainingKcal: -50),
        catalog: <Food>[
          food(id: 'lentils', name: 'Lentils', category: 'Ethiopian', kcal: 100),
        ],
      );
      expect(result.outcome, RecommendationOutcome.budgetSpent);
    });

    test('nothing fitting reports the closest options and their gap', () {
      final RecommendationResult result = recommendFoods(
        request: request(remainingKcal: 80),
        catalog: <Food>[
          food(id: 'big', name: 'Big Plate', category: 'Ethiopian', kcal: 400),
          food(id: 'medium', name: 'Medium Plate', category: 'Dinner', kcal: 120),
          food(id: 'small', name: 'Small Plate', category: 'Snacks', kcal: 100),
        ],
      );

      expect(result.outcome, RecommendationOutcome.nothingFits);
      expect(result.suggestions, isEmpty);
      expect(result.budgetKcal, 80);
      expect(
        result.closest!.map((FoodSuggestion s) => s.food.id).toList(),
        <String>['small', 'medium', 'big'],
        reason: 'closest first: smallest overshoot leads',
      );
      expect(result.closest!.first.kcal - result.budgetKcal, 20);
    });

    test('an empty catalog is nothingFits, not an error', () {
      final RecommendationResult result = recommendFoods(
        request: request(),
        catalog: <Food>[],
      );
      expect(result.outcome, RecommendationOutcome.nothingFits);
      expect(result.closest, isEmpty);
    });

    test('a food with no usable portion is skipped rather than guessed', () {
      final RecommendationResult result = recommendFoods(
        request: request(),
        catalog: <Food>[
          food(id: 'zero', name: 'Zero Gram Food', category: 'Ethiopian', grams: 0),
          food(id: 'ok', name: 'Real Food', category: 'Ethiopian', kcal: 200, proteinG: 20),
        ],
      );

      expect(result.suggestions, hasLength(1));
      expect(result.suggestions.single.food.id, 'ok');
    });

    test('a shortfall is reported rather than padded with extra food', () {
      final RecommendationResult result = recommendFoods(
        request: request(remainingKcal: 500, proteinNeedG: 90),
        catalog: <Food>[
          food(id: 'a', name: 'A Dish', category: 'Ethiopian', kcal: 200, proteinG: 18),
          food(id: 'b', name: 'B Dish', category: 'Ethiopian', kcal: 200, proteinG: 18),
          food(id: 'c', name: 'C Dish', category: 'Ethiopian', kcal: 200, proteinG: 18),
        ],
      );

      expect(result.meetsProteinNeed, isFalse);
      expect(result.coveredProteinG, closeTo(36, 0.01));
      expect(result.proteinShortfallG, closeTo(54, 0.01));
      expect(
        result.usedKcal,
        lessThanOrEqualTo(500),
        reason: 'a shortfall never justifies exceeding the budget',
      );
    });

    test('no more than maxSuggestions are returned', () {
      final RecommendationResult result = recommendFoods(
        request: request(remainingKcal: 5000, proteinNeedG: 0),
        catalog: <Food>[
          for (int i = 0; i < 12; i++)
            food(id: 'f$i', name: 'Food $i', category: 'Ethiopian', kcal: 100, proteinG: 5),
        ],
        maxSuggestions: 4,
      );
      expect(result.suggestions, hasLength(4));
    });
  });

  group('mealSlotForHour', () {
    test('maps the clock to the meal being planned', () {
      expect(mealSlotForHour(7), MealSlot.breakfast);
      expect(mealSlotForHour(10), MealSlot.breakfast);
      expect(mealSlotForHour(11), MealSlot.lunch);
      expect(mealSlotForHour(15), MealSlot.lunch);
      expect(mealSlotForHour(16), MealSlot.dinner);
      expect(mealSlotForHour(21), MealSlot.dinner);
      expect(mealSlotForHour(22), MealSlot.snack);
      expect(mealSlotForHour(2), MealSlot.breakfast);
    });
  });
}
