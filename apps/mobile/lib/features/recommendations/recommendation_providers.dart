import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_domain/domain.dart';

import '../../core/clock.dart';
import '../../core/date_utils.dart';
import '../../l10n/strings.dart';
import '../../providers.dart';
import 'what_can_i_eat.dart';

/// The remaining budget the user is planning against (INS-03 preconditions:
/// an active target and known remaining calories/macros).
///
/// Defaults come from today's own numbers — never a guess. A missing target
/// yields zeros with `hasTarget: false`, and the screen then says the target is
/// not set up rather than inventing a budget.
class RemainingBudget {
  const RemainingBudget({
    required this.remainingKcal,
    required this.remainingProteinG,
    required this.targetAtSafetyFloor,
    required this.hasTarget,
  });

  final int remainingKcal;
  final double remainingProteinG;

  /// The day's target is already clamped to the SAFE-01 floor.
  final bool targetAtSafetyFloor;

  final bool hasTarget;
}

final Provider<RemainingBudget> remainingBudgetProvider =
    Provider<RemainingBudget>((Ref<RemainingBudget> ref) {
  final DailyTarget? target = ref.watch(activeDailyTargetProvider).value;
  final NutritionTotals totals = ref.watch(todayTotalsProvider);
  if (target == null) {
    return const RemainingBudget(
      remainingKcal: 0,
      remainingProteinG: 0,
      targetAtSafetyFloor: false,
      hasTarget: false,
    );
  }
  final int remainingKcal = target.targetKcal - totals.kcal.round();
  return RemainingBudget(
    remainingKcal: remainingKcal < 0 ? 0 : remainingKcal,
    remainingProteinG: (target.proteinG - totals.protein).clamp(
      0,
      double.infinity,
    ),
    targetAtSafetyFloor: target.targetKcal <= target.floorKcal,
    hasTarget: true,
  );
});

/// The request the screen is working with: the user's own numbers once they
/// edit them, otherwise today's remaining budget (INS-03 "Action").
class RecommendationQuery {
  const RecommendationQuery({
    required this.remainingKcal,
    required this.proteinNeedG,
  });

  final int remainingKcal;
  final double proteinNeedG;
}

class RecommendationQueryController extends Notifier<RecommendationQuery?> {
  @override
  RecommendationQuery? build() => null;

  void set({required int remainingKcal, required double proteinNeedG}) {
    state = RecommendationQuery(
      remainingKcal: remainingKcal < 0 ? 0 : remainingKcal,
      proteinNeedG: proteinNeedG < 0 ? 0 : proteinNeedG,
    );
  }

  void clear() => state = null;
}

final NotifierProvider<RecommendationQueryController, RecommendationQuery?>
    recommendationQueryProvider =
    NotifierProvider<RecommendationQueryController, RecommendationQuery?>(
      RecommendationQueryController.new,
    );

/// Foods logged in the trailing three days, watched so the variety rule
/// follows a meal logged elsewhere in the session.
final StreamProvider<List<Meal>> recentlyLoggedMealsProvider =
    StreamProvider<List<Meal>>((Ref<AsyncValue<List<Meal>>> ref) {
  final Clock clock = ref.watch(clockProvider);
  final DateTime today = dateOnly(clock());
  return ref
      .watch(mealRepositoryProvider)
      .watchMealsInRange(
        dateKeyFor(today.subtract(const Duration(days: 3))),
        dateKeyFor(today),
      );
});

/// Suggestions for the current query, computed from the local catalog.
///
/// Pure and local: the same inputs always produce the same ranking, nothing
/// leaves the device, and no model is consulted.
final FutureProvider<RecommendationResult> recommendationsProvider =
    FutureProvider<RecommendationResult>((ref) async {
  final RemainingBudget budget = ref.watch(remainingBudgetProvider);
  final RecommendationQuery query =
      ref.watch(recommendationQueryProvider) ??
      RecommendationQuery(
        remainingKcal: budget.remainingKcal,
        proteinNeedG: budget.remainingProteinG,
      );

  final UserProfile? profile = await ref.watch(currentUserProvider.future);
  final List<Meal> recent = await ref.watch(recentlyLoggedMealsProvider.future);
  final List<Food> catalog = await ref.watch(foodRepositoryProvider).allFoods();

  return recommendFoods(
    request: RecommendationRequest(
      remainingKcal: query.remainingKcal,
      proteinNeedG: query.proteinNeedG,
      preference: profile?.foodPreference ?? FoodPreference.mixed,
      slot: mealSlotForHour(ref.watch(clockProvider)().hour),
      recentlyLoggedFoodIds: <String>{
        for (final Meal meal in recent)
          for (final MealItem item in meal.items) item.foodId,
      },
      targetAtSafetyFloor: budget.targetAtSafetyFloor,
    ),
    catalog: catalog,
  );
});

/// The sentence that summarises a result, kept next to the rules so the screen
/// and its tests read the same copy.
String recommendationHeadline(RecommendationResult result) {
  return switch (result.outcome) {
    RecommendationOutcome.budgetSpent => Strings.whatCanIEatNoBudget,
    RecommendationOutcome.nothingFits => Strings.whatCanIEatNothingFits,
    RecommendationOutcome.suggested => result.meetsProteinNeed
        ? Strings.whatCanIEatCovers(
            result.coveredProteinG.round(),
            result.usedKcal,
          )
        : Strings.whatCanIEatShortfall(
            result.coveredProteinG.round(),
            result.proteinNeedG.round(),
          ),
  };
}
