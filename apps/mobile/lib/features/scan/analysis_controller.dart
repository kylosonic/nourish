import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_domain/domain.dart';

import '../../data/models/analysis_result.dart';
import '../../data/repositories/food_repository.dart';
import '../../data/repositories/meal_repository.dart';
import '../../data/sources/analysis_api_client.dart';
import '../../providers.dart';

/// Lifecycle of one scan/log run (SCAN-04 → SCAN-05/06 → save).
enum AnalysisPhase { idle, running, ready, failed, saving, saved }

/// One editable line of the analysis (SCAN-07).
///
/// [localFood] is the app's own catalog row for this item, resolved at intake.
/// It is what makes the item *loggable*: grams and the nutrition snapshot are
/// always recomputed locally by the deterministic domain engines, never taken
/// from the server or from the model. An item with no local food cannot be
/// saved — it must be swapped for a searchable food or removed.
class AnalysisDraftItem {
  const AnalysisDraftItem({
    required this.displayName,
    required this.localFood,
    required this.unit,
    required this.amount,
    required this.confidence,
    required this.portionEstimated,
    this.serverNutrition,
  });

  final String displayName;
  final Food? localFood;
  final String unit;
  final double amount;
  final double confidence;
  final bool portionEstimated;

  /// Shown only while an item has no local food (it cannot be saved).
  final AnalysisNutrition? serverNutrition;

  bool get isLoggable => localFood != null && amount > 0;

  PortionUnit? get portionUnit => _unitByName(unit);

  /// Deterministic grams from the food's own portion table; null when the item
  /// cannot be resolved locally — including when the food has no entry for this
  /// unit, which the portion engine reports by throwing.
  double? get grams {
    final Food? food = localFood;
    final PortionUnit? unit = portionUnit;
    if (food == null || unit == null) return null;
    try {
      return portionToGrams(food.portions, unit, amount);
    } on Object {
      return null;
    }
  }

  /// The nutrition the app will actually record (local engine, not the wire).
  AnalysisNutrition? get nutrition {
    final Food? food = localFood;
    final double? g = grams;
    if (food == null || g == null) return serverNutrition;
    try {
      final NutritionSnapshot snapshot = nutritionFor(food.per100g, g);
      return AnalysisNutrition(
        kcal: snapshot.kcal.toDouble(),
        proteinG: snapshot.proteinG.toDouble(),
        carbsG: snapshot.carbsG.toDouble(),
        fatG: snapshot.fatG.toDouble(),
        fiberG: snapshot.fiberG,
        sodiumMg: snapshot.sodiumMg,
      );
    } on Object {
      return serverNutrition;
    }
  }

  AnalysisDraftItem copyWith({String? unit, double? amount, Food? localFood, String? displayName}) {
    return AnalysisDraftItem(
      displayName: displayName ?? this.displayName,
      localFood: localFood ?? this.localFood,
      unit: unit ?? this.unit,
      amount: amount ?? this.amount,
      confidence: confidence,
      portionEstimated: portionEstimated,
      serverNutrition: serverNutrition,
    );
  }
}

/// The whole scan flow state. The screen switches on [phase]; the result and
/// low-confidence views read [items] and [result].
@immutable
class AnalysisFlowState {
  const AnalysisFlowState({
    this.phase = AnalysisPhase.idle,
    this.result,
    this.items = const <AnalysisDraftItem>[],
    this.errorCode,
    this.errorMessage,
    this.savedMealId,
  });

  final AnalysisPhase phase;
  final AnalysisResult? result;
  final List<AnalysisDraftItem> items;
  final String? errorCode;
  final String? errorMessage;
  final String? savedMealId;

  bool get isLowConfidence => result?.isLowConfidence ?? false;
  bool get hasUnloggableItems => items.any((AnalysisDraftItem i) => !i.isLoggable);
  bool get canConfirm => items.isNotEmpty && !hasUnloggableItems;

  AnalysisNutrition get totals {
    double kcal = 0;
    double protein = 0;
    double carbs = 0;
    double fat = 0;
    double? fiber;
    double? sodium;
    for (final AnalysisDraftItem item in items) {
      final AnalysisNutrition? n = item.nutrition;
      if (n == null) continue;
      kcal += n.kcal;
      protein += n.proteinG;
      carbs += n.carbsG;
      fat += n.fatG;
      if (n.fiberG != null) fiber = (fiber ?? 0) + n.fiberG!;
      if (n.sodiumMg != null) sodium = (sodium ?? 0) + n.sodiumMg!;
    }
    return AnalysisNutrition(
      kcal: kcal,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      fiberG: fiber,
      sodiumMg: sodium,
    );
  }

  AnalysisFlowState copyWith({
    AnalysisPhase? phase,
    AnalysisResult? result,
    List<AnalysisDraftItem>? items,
    String? errorCode,
    String? errorMessage,
    String? savedMealId,
  }) {
    return AnalysisFlowState(
      phase: phase ?? this.phase,
      result: result ?? this.result,
      items: items ?? this.items,
      errorCode: errorCode,
      errorMessage: errorMessage,
      savedMealId: savedMealId ?? this.savedMealId,
    );
  }
}

/// Drives one scan/log run: submit → resolve against the local catalog →
/// edit → save. Nothing is written until the user confirms (SCAN-05).
class AnalysisController extends Notifier<AnalysisFlowState> {
  @override
  AnalysisFlowState build() => const AnalysisFlowState();

  AnalysisApi get _api => ref.read(analysisApiProvider);
  FoodRepository get _foods => ref.read(foodRepositoryProvider);
  MealRepository get _meals => ref.read(mealRepositoryProvider);

  /// SCAN-04: run the pipeline and resolve the outcome against the local cache.
  Future<void> runText(String text) => _run(() => _api.analyzeText(text.trim()));

  /// SCAN-04: photo path. [bytes] must already be prepared (SCAN-03).
  Future<void> runPhoto(Uint8List bytes) => _run(() => _api.analyzePhoto(bytes));

  Future<void> _run(Future<AnalysisResult> Function() submit) async {
    state = const AnalysisFlowState(phase: AnalysisPhase.running);
    try {
      final AnalysisResult result = await submit();
      final List<AnalysisDraftItem> items = await _resolveItems(result);
      state = AnalysisFlowState(
        phase: AnalysisPhase.ready,
        result: result,
        items: items,
      );
    } on AnalysisException catch (error) {
      state = AnalysisFlowState(
        phase: AnalysisPhase.failed,
        errorCode: error.code,
        errorMessage: error.message,
      );
    }
  }

  /// Retry the same input after a failure (SCAN-04's RETRY).
  Future<void> retryWithText(String text) => runText(text);

  /// Map each server item onto the local catalog. The id namespaces differ
  /// (server slug vs the app's `fct-<code>`/seed slug), so the source food code
  /// is the bridge; a name match is the documented fallback.
  Future<List<AnalysisDraftItem>> _resolveItems(AnalysisResult result) async {
    final List<Food> local = await _foods.allFoods();
    final Map<String, Food> byId = <String, Food>{
      for (final Food food in local) food.id: food,
    };
    final Map<String, Food> byCode = <String, Food>{
      for (final Food food in local)
        if (food.source.foodCode != null) food.source.foodCode!: food,
    };

    return result.items.map((AnalysisItemResult item) {
      Food? food;
      final String? code = item.sourceFoodCode;
      if (code != null) food = byCode[code];
      food ??= item.foodId == null ? null : byId[item.foodId!];
      if (food == null) {
        final String wanted = (item.canonicalName ?? item.displayName).toLowerCase();
        for (final Food candidate in local) {
          if (candidate.canonicalName.toLowerCase() == wanted) {
            food = candidate;
            break;
          }
        }
      }
      return AnalysisDraftItem(
        displayName: item.displayName,
        localFood: food,
        unit: item.unit,
        amount: item.amount,
        confidence: item.confidence,
        portionEstimated: item.portionEstimated,
        serverNutrition: item.nutrition,
      );
    }).toList();
  }

  /// SCAN-07: change an item's portion. Deterministic — never re-invokes the AI.
  void setAmount(int index, double amount) {
    if (index < 0 || index >= state.items.length || amount <= 0) return;
    final List<AnalysisDraftItem> items = <AnalysisDraftItem>[...state.items];
    items[index] = items[index].copyWith(amount: amount);
    state = state.copyWith(items: items);
  }

  /// SCAN-07: change an item's unit (the food's own portion table decides grams).
  void setUnit(int index, PortionUnit unit) {
    if (index < 0 || index >= state.items.length) return;
    final List<AnalysisDraftItem> items = <AnalysisDraftItem>[...state.items];
    items[index] = items[index].copyWith(unit: unit.name);
    state = state.copyWith(items: items);
  }

  /// SCAN-06/07: swap an item for a food the user picked from search.
  void replaceItem(int index, Food food, {double? amount, PortionUnit? unit}) {
    if (index < 0 || index >= state.items.length) return;
    final List<AnalysisDraftItem> items = <AnalysisDraftItem>[...state.items];
    final AnalysisDraftItem previous = items[index];
    items[index] = previous.copyWith(
      displayName: food.canonicalName,
      localFood: food,
      unit: (unit ?? portionUnitFor(food)).name,
      amount: amount ?? 1,
    );
    state = state.copyWith(items: items);
  }

  /// SCAN-07: add an item the analysis missed.
  void addItem(Food food, {double amount = 1, PortionUnit? unit}) {
    final List<AnalysisDraftItem> items = <AnalysisDraftItem>[
      ...state.items,
      AnalysisDraftItem(
        displayName: food.canonicalName,
        localFood: food,
        unit: (unit ?? portionUnitFor(food)).name,
        amount: amount,
        confidence: 1,
        portionEstimated: false,
      ),
    ];
    state = state.copyWith(items: items);
  }

  /// SCAN-07: remove an item.
  void removeItem(int index) {
    if (index < 0 || index >= state.items.length) return;
    final List<AnalysisDraftItem> items = <AnalysisDraftItem>[...state.items]
      ..removeAt(index);
    state = state.copyWith(items: items);
  }

  /// SCAN-05: save the confirmed meal with its nutrition snapshot (TGT-04) and
  /// report the user's edits as corrections (SAFE-07, best-effort).
  Future<String?> confirm(MealSlot slot) async {
    final AnalysisFlowState current = state;
    if (!current.canConfirm) return null;
    state = current.copyWith(phase: AnalysisPhase.saving);
    try {
      final Meal saved = await _meals.saveMeal(
        slot,
        current.items
            .where((AnalysisDraftItem item) => item.isLoggable)
            .map(
              (AnalysisDraftItem item) => MealItemDraft(
                food: item.localFood!,
                unit: item.portionUnit!,
                quantity: item.amount,
              ),
            )
            .toList(),
      );
      state = state.copyWith(phase: AnalysisPhase.saved, savedMealId: saved.id);
      await _reportCorrections(current);
      return saved.id;
    } catch (error) {
      state = state.copyWith(
        phase: AnalysisPhase.ready,
        errorMessage: 'Could not save the meal: $error',
      );
      return null;
    }
  }

  /// Discard the run (SCAN-05's discard prompt path).
  void reset() => state = const AnalysisFlowState();

  Future<void> _reportCorrections(AnalysisFlowState current) async {
    final AnalysisResult? result = current.result;
    if (result == null) return;
    final List<Map<String, dynamic>> changes = <Map<String, dynamic>>[];
    for (int i = 0; i < current.items.length; i++) {
      final AnalysisDraftItem item = current.items[i];
      final AnalysisItemResult? original =
          i < result.items.length ? result.items[i] : null;
      if (original == null) {
        changes.add(<String, dynamic>{
          'action': 'add',
          'chosenFoodId': item.localFood?.id,
          'chosenAmount': item.amount,
          'chosenUnit': item.unit,
        });
        continue;
      }
      if (item.localFood?.id != original.foodId) {
        changes.add(<String, dynamic>{
          'itemId': original.id,
          'action': 'swap',
          'predictedLabel': original.displayName,
          'chosenFoodId': item.localFood?.id,
        });
      } else if (item.amount != original.amount || item.unit != original.unit) {
        changes.add(<String, dynamic>{
          'itemId': original.id,
          'action': 'portion',
          'predictedLabel': original.displayName,
          'chosenAmount': item.amount,
          'chosenUnit': item.unit,
        });
      }
    }
    if (changes.isEmpty) return;
    try {
      await _api.reportCorrections(analysisId: result.id, items: changes);
    } catch (_) {
      // Best-effort by contract: never surface a correction-capture failure.
    }
  }
}

PortionUnit? _unitByName(String name) {
  for (final PortionUnit unit in PortionUnit.values) {
    if (unit.name == name) return unit;
  }
  return null;
}

/// The food's default unit when the user adds/swaps an item.
PortionUnit portionUnitFor(Food food) {
  final PortionUnit direct = food.defaultPortion.unit;
  for (final Portion portion in food.portions) {
    if (portion.unit == direct) return direct;
  }
  return food.portions.isEmpty ? direct : food.portions.first.unit;
}
