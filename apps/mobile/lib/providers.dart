import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_domain/domain.dart';

import 'core/date_utils.dart';
import 'data/database.dart';
import 'data/repositories/food_repository.dart';
import 'data/repositories/meal_repository.dart';
import 'data/repositories/onboarding_repository.dart';
import 'data/repositories/target_repository.dart';
import 'data/repositories/water_repository.dart';
import 'features/onboarding/onboarding_controller.dart';

/// Riverpod provider graph (blueprint §11). Strictly top-down: widgets
/// consume streams, controllers own mutations, every write flows through
/// a repository into Drift.

/// Opened once in bootstrap and injected via `ProviderScope(overrides:)`.
final Provider<AppDatabase> driftDatabaseProvider = Provider<AppDatabase>(
  (Ref<AppDatabase> ref) => throw UnimplementedError(
    'driftDatabaseProvider is overridden during bootstrap',
  ),
);

final Provider<TargetEngine> targetEngineProvider = Provider<TargetEngine>(
  (Ref<TargetEngine> ref) => TargetEngine(),
);

final Provider<OnboardingRepository> onboardingRepositoryProvider =
    Provider<OnboardingRepository>(
      (Ref<OnboardingRepository> ref) =>
          OnboardingRepository(ref.watch(driftDatabaseProvider)),
    );

final Provider<FoodRepository> foodRepositoryProvider =
    Provider<FoodRepository>(
      (Ref<FoodRepository> ref) =>
          FoodRepository(ref.watch(driftDatabaseProvider)),
    );

final Provider<MealRepository> mealRepositoryProvider =
    Provider<MealRepository>(
      (Ref<MealRepository> ref) =>
          MealRepository(ref.watch(driftDatabaseProvider)),
    );

final Provider<WaterRepository> waterRepositoryProvider =
    Provider<WaterRepository>(
      (Ref<WaterRepository> ref) =>
          WaterRepository(ref.watch(driftDatabaseProvider)),
    );

final Provider<TargetRepository> targetRepositoryProvider =
    Provider<TargetRepository>(
      (Ref<TargetRepository> ref) => TargetRepository(
        ref.watch(driftDatabaseProvider),
        ref.watch(targetEngineProvider),
      ),
    );

/// The single persisted profile (null only before first creation).
final StreamProvider<UserProfile?> currentUserProvider =
    StreamProvider<UserProfile?>(
      (Ref<AsyncValue<UserProfile?>> ref) =>
          ref.watch(onboardingRepositoryProvider).watchProfile(),
    );

/// Latest append-only target row (null until onboarding answers exist).
final StreamProvider<DailyTarget?> activeDailyTargetProvider =
    StreamProvider<DailyTarget?>(
      (Ref<AsyncValue<DailyTarget?>> ref) =>
          ref.watch(targetRepositoryProvider).watchLatest(),
    );

/// Today's meals with their frozen item snapshots.
final StreamProvider<List<Meal>> todayMealsProvider =
    StreamProvider<List<Meal>>(
      (Ref<AsyncValue<List<Meal>>> ref) =>
          ref.watch(mealRepositoryProvider).watchMealsForDate(todayDateKey()),
    );

/// Today's consumed totals (domain aggregation over snapshots).
final Provider<NutritionTotals> todayTotalsProvider = Provider<NutritionTotals>(
  (Ref<NutritionTotals> ref) =>
      totalsFor(ref.watch(todayMealsProvider).value ?? const <Meal>[]),
);

/// One hydration day: consumed vs the S0-fixed 3.0 L target.
class WaterDay {
  const WaterDay({required this.consumedMl, this.targetMl = defaultTargetMl});

  /// S0 constant target (blueprint §13).
  static const int defaultTargetMl = WaterRepository.defaultTargetMl;

  final int consumedMl;
  final int targetMl;

  double get litersConsumed => consumedMl / 1000;

  double get litersTarget => targetMl / 1000;
}

final StreamProvider<WaterDay> todayWaterProvider = StreamProvider<WaterDay>(
  (Ref<AsyncValue<WaterDay>> ref) => ref
      .watch(waterRepositoryProvider)
      .watchDailyTotalMl(todayDateKey())
      .map((int ml) => WaterDay(consumedMl: ml)),
);

/// Home dashboard values (HOME-01/02): calories left, macro leftovers and
/// the ring fraction. A missing target (setup not finished) yields nulls
/// — the UI shows a setup prompt, never invented zeroes.
class HomeDashboardData {
  const HomeDashboardData({
    required this.targetKcal,
    required this.consumedKcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.waterMl,
  });

  factory HomeDashboardData.from(
    DailyTarget? target,
    NutritionTotals totals,
    WaterDay? water,
  ) {
    return HomeDashboardData(
      targetKcal: target?.targetKcal,
      consumedKcal: totals.kcal,
      proteinG: target == null ? null : target.proteinG - totals.protein,
      carbsG: target == null ? null : target.carbsG - totals.carbs,
      fatG: target == null ? null : target.fatG - totals.fat,
      waterMl: water?.consumedMl ?? 0,
    );
  }

  /// Active target; null while onboarding is unfinished.
  final int? targetKcal;
  final double consumedKcal;
  final double? proteinG;
  final double? carbsG;
  final double? fatG;
  final int waterMl;

  double? get caloriesLeft =>
      targetKcal == null ? null : targetKcal! - consumedKcal;

  bool get isOverTarget => targetKcal != null && consumedKcal > targetKcal!;

  /// Ring fraction, clamped to 0..1 — no >100% wrap (HOME-02).
  double get ringFraction {
    if (targetKcal == null || targetKcal! <= 0) {
      return 0;
    }
    return (consumedKcal / targetKcal!).clamp(0.0, 1.0);
  }
}

final Provider<HomeDashboardData> homeDashboardProvider =
    Provider<HomeDashboardData>((Ref<HomeDashboardData> ref) {
      final DailyTarget? target = ref.watch(activeDailyTargetProvider).value;
      final NutritionTotals totals = ref.watch(todayTotalsProvider);
      final WaterDay? water = ref.watch(todayWaterProvider).value;
      return HomeDashboardData.from(target, totals, water);
    });

/// The router's live profile view: overridden in `main()` with the
/// bootstrap [ValueNotifier] and updated by the onboarding controller
/// after every persist so the redirect stays live for the session.
/// Null when no router wiring exists (plain unit containers).
final Provider<ValueNotifier<UserProfile>?> profileNotifierProvider =
    Provider<ValueNotifier<UserProfile>?>(
      (Ref<ValueNotifier<UserProfile>?> ref) => null,
    );

/// The transactional onboarding controller (blueprint §11): step list
/// per goal, draft answers, field validation, persist-on-continue and
/// resume-at-first-unanswered (ONB-09).
final NotifierProvider<OnboardingController, OnboardingState>
    onboardingControllerProvider =
    NotifierProvider<OnboardingController, OnboardingState>(
      OnboardingController.new,
    );

/// Slot scoping for quick-add (HOME-03 / LOG-05): the scan sheet or a
/// slot row sets the active meal context; food search quick-add lands in
/// that slot.
class ActiveMealContext extends Notifier<MealSlot?> {
  @override
  MealSlot? build() => null;

  void set(MealSlot? slot) => state = slot;

  void clear() => state = null;
}

final NotifierProvider<ActiveMealContext, MealSlot?> activeMealContextProvider =
    NotifierProvider<ActiveMealContext, MealSlot?>(ActiveMealContext.new);

/// Food search controller state: query + optional category chip.
class FoodSearchState {
  const FoodSearchState({this.query = '', this.category});

  final String query;
  final String? category;

  FoodSearchState copyWith({
    String? query,
    String? category,
    bool clearCategory = false,
  }) {
    return FoodSearchState(
      query: query ?? this.query,
      category: clearCategory ? null : category ?? this.category,
    );
  }
}

class FoodSearchController extends Notifier<FoodSearchState> {
  @override
  FoodSearchState build() => const FoodSearchState();

  void setQuery(String query) => state = state.copyWith(query: query);

  void setCategory(String? category) => state = state.copyWith(
    clearCategory: category == null,
    category: category,
  );
}

final NotifierProvider<FoodSearchController, FoodSearchState>
foodSearchControllerProvider =
    NotifierProvider<FoodSearchController, FoodSearchState>(
      FoodSearchController.new,
    );

/// Preference-biased live results for the controller state.
final FutureProvider<List<Food>> foodSearchResultsProvider =
    FutureProvider<List<Food>>((Ref<AsyncValue<List<Food>>> ref) async {
      final FoodSearchState state = ref.watch(foodSearchControllerProvider);
      final UserProfile? user = await ref.watch(currentUserProvider.future);
      return ref
          .watch(foodRepositoryProvider)
          .search(
            state.query,
            category: state.category,
            preference: user?.foodPreference,
          );
    });

/// Selected date for the meal-history strip (LOG-06).
class SelectedHistoryDate extends Notifier<DateTime> {
  @override
  DateTime build() => DateTime.now();

  void set(DateTime date) => state = date;
}

final NotifierProvider<SelectedHistoryDate, DateTime>
selectedHistoryDateProvider = NotifierProvider<SelectedHistoryDate, DateTime>(
  SelectedHistoryDate.new,
);

/// Meals for the history strip's selected date (LOG-06).
final StreamProvider<List<Meal>> historyMealsProvider =
    StreamProvider<List<Meal>>(
      (Ref<AsyncValue<List<Meal>>> ref) {
        final DateTime date = ref.watch(selectedHistoryDateProvider);
        return ref
            .watch(mealRepositoryProvider)
            .watchMealsForDate(dateKeyFor(date));
      },
    );

/// Consumed totals for the selected history date (snapshot sums).
final Provider<NutritionTotals> historyTotalsProvider =
    Provider<NutritionTotals>(
      (Ref<NutritionTotals> ref) =>
          totalsFor(ref.watch(historyMealsProvider).value ?? const <Meal>[]),
    );

/// Constructed in bootstrap (redirect depends on the persisted profile)
/// and injected via `ProviderScope(overrides:)`.
final Provider<GoRouter> routerProvider = Provider<GoRouter>(
  (Ref<GoRouter> ref) =>
      throw UnimplementedError('routerProvider is overridden during bootstrap'),
);
