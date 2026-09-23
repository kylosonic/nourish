/// INS-03 "What can I eat": a deterministic recommender over the local catalog.
///
/// Nothing here calls a model. Every suggestion is a catalog food, at a portion
/// the app can log, whose numbers come from the same engine the logging path
/// uses — so what a suggestion claims is exactly what logging it would record.
///
/// P-INS-2 (the design screen) was never produced, so the layout of the screen
/// that consumes this is provisional (PPA-15). The rules below, however, come
/// straight from the behaviour contract: fit the remaining calorie budget, move
/// toward the remaining protein need, respect the user's food preference and
/// the meal slot, prefer local foods, avoid repeating what was just logged, and
/// when nothing fits, say so with the gap rather than inventing a food.
library;

import 'package:nourish_domain/domain.dart';

/// What the user is asking for (INS-03 "Action": they state their remaining
/// budget and what they still need).
class RecommendationRequest {
  const RecommendationRequest({
    required this.remainingKcal,
    required this.proteinNeedG,
    required this.preference,
    required this.slot,
    this.recentlyLoggedFoodIds = const <String>{},
    this.targetAtSafetyFloor = false,
  });

  /// Calories still available today. A suggestion must fit inside this.
  final int remainingKcal;

  /// Protein grams still needed today; 0 means "no protein goal in mind".
  final double proteinNeedG;

  final FoodPreference preference;

  /// The meal being planned, used to favour foods the catalog files under that
  /// slot (and local dishes, which the catalog files as `Ethiopian`).
  final MealSlot slot;

  /// Foods logged in the last few days, de-prioritized so suggestions vary.
  final Set<String> recentlyLoggedFoodIds;

  /// True when the day's target is already clamped to the SAFE-01 floor. The
  /// app must not nudge such a user to eat less, so the copy for a spent budget
  /// says that instead of implying they overate.
  final bool targetAtSafetyFloor;
}

/// One suggestion, with the numbers that justify it.
class FoodSuggestion {
  const FoodSuggestion({
    required this.food,
    required this.portion,
    required this.nutrition,
    required this.isLocal,
    required this.matchesSlot,
    required this.recentlyLogged,
  });

  final Food food;
  final Portion portion;

  /// What logging [portion] of [food] would record.
  final NutritionSnapshot nutrition;

  /// A food the catalog files as Ethiopian.
  final bool isLocal;

  final bool matchesSlot;
  final bool recentlyLogged;

  int get kcal => nutrition.kcal.round();
  double get proteinG => nutrition.proteinG;
}

/// Why there is nothing to suggest, when that happens.
enum RecommendationOutcome {
  /// Suggestions were produced.
  suggested,

  /// No calorie budget left today.
  budgetSpent,

  /// There is a budget, but no catalog food fits it.
  nothingFits,
}

class RecommendationResult {
  const RecommendationResult({
    required this.outcome,
    required this.suggestions,
    required this.coveredProteinG,
    required this.usedKcal,
    this.proteinNeedG = 0,
    this.budgetKcal = 0,
    this.closest,
  });

  final RecommendationOutcome outcome;

  /// Ranked, best first. Empty unless [outcome] is
  /// [RecommendationOutcome.suggested].
  final List<FoodSuggestion> suggestions;

  /// The protein need this result was computed against.
  final double proteinNeedG;

  /// The calorie budget this result was computed against, so a caller can show
  /// how far over budget a "closest" food is without re-deriving it.
  final int budgetKcal;

  /// The closest foods considered when nothing fit, with their gap. Populated
  /// only for [RecommendationOutcome.nothingFits] — the contract requires the
  /// gap to be explained rather than papered over.
  final List<FoodSuggestion>? closest;

  /// Protein the ranked suggestions cover together, within the budget.
  final double coveredProteinG;

  /// Calories those suggestions would use.
  final int usedKcal;

  /// True when the suggestions together close the protein gap (or when there
  /// was no gap to close). A shortfall is reported, never hidden.
  bool get meetsProteinNeed =>
      proteinNeedG <= 0 || coveredProteinG >= proteinNeedG;

  double get proteinShortfallG =>
      meetsProteinNeed ? 0 : proteinNeedG - coveredProteinG;
}

/// Rank catalog [catalog] foods for [request] (INS-03).
///
/// Deterministic: the same request and catalog always produce the same order,
/// because ties break on the food's canonical name.
RecommendationResult recommendFoods({
  required RecommendationRequest request,
  required List<Food> catalog,
  int maxSuggestions = 5,
}) {
  if (request.remainingKcal <= 0) {
    return RecommendationResult(
      outcome: RecommendationOutcome.budgetSpent,
      suggestions: const <FoodSuggestion>[],
      coveredProteinG: 0,
      usedKcal: 0,
      proteinNeedG: request.proteinNeedG,
      budgetKcal: request.remainingKcal,
    );
  }

  final List<FoodSuggestion> candidates = <FoodSuggestion>[];
  final List<FoodSuggestion> tooBig = <FoodSuggestion>[];

  for (final Food food in catalog) {
    final Portion portion = food.defaultPortion;
    if (portion.grams <= 0) continue;
    final NutritionSnapshot nutrition = nutritionFor(food.per100g, portion.grams);
    if (nutrition.kcal <= 0) continue;

    final FoodSuggestion suggestion = FoodSuggestion(
      food: food,
      portion: portion,
      nutrition: nutrition,
      isLocal: food.category.toLowerCase() == 'ethiopian',
      matchesSlot: _matchesSlot(food.category, request.slot),
      recentlyLogged: request.recentlyLoggedFoodIds.contains(food.id),
    );

    if (suggestion.kcal <= request.remainingKcal) {
      candidates.add(suggestion);
    } else {
      tooBig.add(suggestion);
    }
  }

  if (candidates.isEmpty) {
    // Nothing fits: report the foods that came closest, smallest overshoot
    // first, so the user can see how far off the budget is.
    tooBig.sort((FoodSuggestion a, FoodSuggestion b) {
      final int byGap = (a.kcal - request.remainingKcal)
          .compareTo(b.kcal - request.remainingKcal);
      return byGap != 0
          ? byGap
          : a.food.canonicalName.compareTo(b.food.canonicalName);
    });
    return RecommendationResult(
      outcome: RecommendationOutcome.nothingFits,
      suggestions: const <FoodSuggestion>[],
      coveredProteinG: 0,
      usedKcal: 0,
      proteinNeedG: request.proteinNeedG,
      budgetKcal: request.remainingKcal,
      closest: tooBig.take(maxSuggestions).toList(),
    );
  }

  candidates.sort((FoodSuggestion a, FoodSuggestion b) {
    final int byDensity = _proteinDensity(b).compareTo(_proteinDensity(a));
    return byDensity != 0
        ? byDensity
        : a.food.canonicalName.compareTo(b.food.canonicalName);
  });

  // Build the combination density-first: when a food is useful because of its
  // protein, the number that matters is protein per calorie, and taking the
  // densest that still fits is what lets a 500 kcal budget actually close a
  // 35 g gap. Stopping as soon as the need is covered avoids piling on more
  // food than the user asked for; a need of 0 means "show me what fits".
  final List<FoodSuggestion> picked = <FoodSuggestion>[];
  int usedKcal = 0;
  double covered = 0;
  for (final FoodSuggestion candidate in candidates) {
    if (picked.length >= maxSuggestions) break;
    if (usedKcal + candidate.kcal > request.remainingKcal) continue;
    picked.add(candidate);
    usedKcal += candidate.kcal;
    covered += candidate.proteinG;
    if (request.proteinNeedG > 0 && covered >= request.proteinNeedG) break;
  }

  // Display order is the ranking score (density, then the user's own signals),
  // so the list reads best-first while the combination stays budget-optimal.
  picked.sort((FoodSuggestion a, FoodSuggestion b) {
    final int byScore = _score(b, request).compareTo(_score(a, request));
    return byScore != 0
        ? byScore
        : a.food.canonicalName.compareTo(b.food.canonicalName);
  });

  return RecommendationResult(
    outcome: RecommendationOutcome.suggested,
    suggestions: picked,
    coveredProteinG: covered,
    usedKcal: usedKcal,
    proteinNeedG: request.proteinNeedG,
    budgetKcal: request.remainingKcal,
  );
}

/// Grams of protein per kcal — the number that decides whether a food can close
/// a protein gap inside a calorie budget.
double _proteinDensity(FoodSuggestion suggestion) =>
    suggestion.proteinG / suggestion.kcal;

/// Ranking score. Documented rather than tuned: protein density leads, then the
/// user's own signals.
double _score(FoodSuggestion suggestion, RecommendationRequest request) {
  double score = _proteinDensity(suggestion) * 10;

  // The contract asks for local foods to be prioritized; the preference only
  // decides whether that applies (a user who chose international gets no push
  // either way).
  if (suggestion.isLocal &&
      request.preference != FoodPreference.international) {
    score += 0.4;
  }
  if (suggestion.matchesSlot) score += 0.3;
  if (suggestion.recentlyLogged) score -= 0.5;

  return score;
}

/// True when the catalog's category for a food is the one this slot suggests:
/// the catalog files breakfast/lunch/dinner items and snack items separately,
/// and files local dishes as `Ethiopian` (which suits lunch and dinner).
bool _matchesSlot(String category, MealSlot slot) {
  final String lower = category.toLowerCase();
  return switch (slot) {
    MealSlot.breakfast => lower == 'breakfast',
    MealSlot.lunch => lower == 'lunch' || lower == 'ethiopian',
    MealSlot.dinner => lower == 'dinner' || lower == 'ethiopian',
    MealSlot.snack => lower == 'snacks' || lower == 'snack',
    MealSlot.other => false,
  };
}

/// The meal slot for a time of day, so the screen can default to what the user
/// is actually planning (INS-03 lists "meal time" as a constraint).
MealSlot mealSlotForHour(int hour) {
  if (hour < 11) return MealSlot.breakfast;
  if (hour < 16) return MealSlot.lunch;
  if (hour < 22) return MealSlot.dinner;
  return MealSlot.snack;
}
