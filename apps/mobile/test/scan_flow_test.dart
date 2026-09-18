import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';
import 'package:nourish_mobile/data/models/analysis_result.dart';
import 'package:nourish_mobile/data/sources/analysis_api_client.dart';
import 'package:nourish_mobile/features/scan/analysis_controller.dart';
import 'package:nourish_mobile/l10n/strings.dart';
import 'package:nourish_mobile/providers.dart';
import 'package:nourish_mobile/router/routes.dart';

import 'pump_app.dart';
import 'widget/seed_helpers.dart';

/// A scripted analysis transport — no sockets, ever (the S1 egress rule holds
/// for the S2 client too).
class _FakeAnalysisApi implements AnalysisApi {
  _FakeAnalysisApi({this.result, this.error});

  AnalysisResult? result;
  AnalysisException? error;
  int calls = 0;
  String? lastText;
  List<Map<String, dynamic>>? corrections;

  @override
  Future<AnalysisResult> analyzeText(String text) async {
    calls++;
    lastText = text;
    if (error != null) throw error!;
    return result!;
  }

  @override
  Future<AnalysisResult> analyzePhoto(covariant Object bytes) async {
    calls++;
    if (error != null) throw error!;
    return result!;
  }

  @override
  Future<void> reportCorrections({
    required String analysisId,
    required List<Map<String, dynamic>> items,
  }) async {
    corrections = items;
  }
}

AnalysisItemResult _item({
  required String displayName,
  required String? foodId,
  required String? sourceFoodCode,
  double amount = 1,
  String unit = 'cup',
  double grams = 240,
  bool unresolved = false,
}) {
  return AnalysisItemResult(
    id: 'it_$displayName',
    displayName: displayName,
    foodId: foodId,
    sourceFoodCode: sourceFoodCode,
    canonicalName: displayName,
    matchKind: foodId == null ? 'none' : 'alias',
    amount: amount,
    unit: unit,
    grams: grams,
    portionEstimated: false,
    confidence: unresolved ? 0.3 : 0.91,
    unresolved: unresolved,
    nutrition: unresolved
        ? null
        : const AnalysisNutrition(
            kcal: 526,
            proteinG: 16,
            carbsG: 12,
            fatG: 44,
            fiberG: 7,
            sodiumMg: 796.8,
          ),
  );
}

AnalysisResult _result({
  required List<AnalysisItemResult> items,
  String confidenceState = 'High',
  List<AnalysisCandidateResult> candidates = const <AnalysisCandidateResult>[],
}) {
  return AnalysisResult(
    id: 'an_1',
    inputKind: 'text',
    confidenceState: confidenceState,
    overallConfidence: confidenceState == 'High' ? 0.9 : 0.4,
    items: items,
    totals: const AnalysisNutrition(kcal: 526, proteinG: 16, carbsG: 12, fatG: 44),
    candidates: candidates,
    notes: const <String>[],
  );
}

void main() {
  group('analysis mapper (defensive)', () {
    test('maps a well-formed payload', () {
      final AnalysisResult result = mapAnalysisResult(<String, dynamic>{
        'id': 'an_1',
        'inputKind': 'photo',
        'confidenceState': 'High',
        'overallConfidence': 0.87,
        'items': <Map<String, dynamic>>[
          <String, dynamic>{
            'id': 'it_1',
            'displayName': 'doro wet',
            'foodId': 'doro_wot',
            'sourceFoodCode': '070152',
            'matchKind': 'alias',
            'portion': <String, dynamic>{
              'amount': 1,
              'unit': 'cup',
              'grams': 240,
              'estimated': false,
            },
            'nutrition': <String, dynamic>{
              'kcal': 526,
              'proteinG': 16,
              'carbsG': 12,
              'fatG': 44,
            },
            'confidence': 0.86,
            'unresolved': false,
          },
        ],
        'totals': <String, dynamic>{'kcal': 526},
        'candidates': <dynamic>[],
        'notes': <String>['ok'],
      });
      expect(result.items, hasLength(1));
      expect(result.items.single.foodId, 'doro_wot');
      expect(result.items.single.sourceFoodCode, '070152');
      expect(result.items.single.nutrition!.kcal, 526);
      expect(result.isLowConfidence, isFalse);
    });

    test('rejects a payload with no id or no items', () {
      expect(
        () => mapAnalysisResult(<String, dynamic>{'items': <dynamic>[]}),
        throwsA(isA<AnalysisException>()),
      );
      expect(
        () => mapAnalysisResult(<String, dynamic>{'id': 'an_1'}),
        throwsA(isA<AnalysisException>()),
      );
    });

    test('skips unusable items instead of crashing', () {
      final AnalysisResult result = mapAnalysisResult(<String, dynamic>{
        'id': 'an_1',
        'items': <dynamic>[
          'not an object',
          <String, dynamic>{'id': 'it_1'}, // no displayName
          <String, dynamic>{'id': 'it_2', 'displayName': 'injera'},
        ],
      });
      expect(result.items, hasLength(1));
      expect(result.items.single.displayName, 'injera');
      // A missing portion/nutrition block must not invent numbers.
      expect(result.items.single.grams, 0);
      expect(result.items.single.nutrition, isNull);
      expect(result.items.single.isLoggable, isFalse);
    });
  });

  group('scan flow (LOG-01 → SCAN-04 → SCAN-05)', () {
    testWidgets('describes a meal, reviews the result and saves it',
        (WidgetTester tester) async {
      final _FakeAnalysisApi api = _FakeAnalysisApi(
        result: _result(
          items: <AnalysisItemResult>[
            _item(displayName: 'injera', foodId: 'injera', sourceFoodCode: '010109', unit: 'injera', grams: 150),
            _item(displayName: 'shiro', foodId: 'shiro_wot', sourceFoodCode: '030088', unit: 'cup', grams: 240),
          ],
        ),
      );
      final AppHarness harness = await pumpApp(
        tester,
        profile: answerProfile(),
        overrides: <Override>[analysisApiProvider.overrideWithValue(api)],
      );

      harness.router.go(AppRoutes.home);
      await tester.pumpAndSettle();

      // DESCRIBE MEAL routes into text logging (the lane is live in S2).
      harness.router.go(AppRoutes.textLog);
      await tester.pumpAndSettle();
      expect(find.text(Strings.describeMealTitle), findsOneWidget);
      await tester.enterText(find.byType(TextField).first, '2 injera with shiro');
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.analyseMeal));
      await tester.pumpAndSettle();

      expect(api.calls, 1);
      expect(api.lastText, '2 injera with shiro');
      expect(find.text(Strings.scanComplete), findsOneWidget);
      expect(find.text(Strings.confirmMeal), findsOneWidget);

      await tester.tap(find.text(Strings.confirmMeal));
      await tester.pumpAndSettle();

      // The meal was saved locally through the domain engines, and the user is
      // back on Home with the update applied.
      final List<Meal> meals = await harness.db.mealDao.allMeals();
      expect(meals, hasLength(1));
      expect(meals.single.items, hasLength(2));
      await harness.teardown(tester);
    });

    testWidgets('an unresolved item blocks CONFIRM until it is removed',
        (WidgetTester tester) async {
      final _FakeAnalysisApi api = _FakeAnalysisApi(
        result: _result(
          items: <AnalysisItemResult>[
            _item(displayName: 'injera', foodId: 'injera', sourceFoodCode: '010109'),
            _item(
              displayName: 'mystery stew',
              foodId: null,
              sourceFoodCode: null,
              unresolved: true,
            ),
          ],
        ),
      );
      final AppHarness harness = await pumpApp(
        tester,
        profile: answerProfile(),
        overrides: <Override>[analysisApiProvider.overrideWithValue(api)],
      );

      await readProvider<AnalysisController>(tester, analysisControllerProvider.notifier)
          .runText('injera and something');
      harness.router.go(AppRoutes.scanFlow);
      await tester.pumpAndSettle();

      // The flagged item may sit below the fold on the test surface.
      await tester.scrollUntilVisible(
        find.text(Strings.itemUnresolved),
        120,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();
      expect(find.text(Strings.itemUnresolved), findsOneWidget);
      final AnalysisFlowState state =
          readProvider<AnalysisFlowState>(tester, analysisControllerProvider);
      expect(state.canConfirm, isFalse);

      // Removing it makes the run saveable: nothing was invented for it.
      readProvider<AnalysisController>(tester, analysisControllerProvider.notifier).removeItem(1);
      await tester.pumpAndSettle();
      expect(
        readProvider<AnalysisFlowState>(tester, analysisControllerProvider).canConfirm,
        isTrue,
      );
      await harness.teardown(tester);
    });

    testWidgets('a low-confidence run shows the resolution screen',
        (WidgetTester tester) async {
      final _FakeAnalysisApi api = _FakeAnalysisApi(
        result: _result(
          confidenceState: 'Low',
          items: <AnalysisItemResult>[
            _item(displayName: 'shiro', foodId: 'shiro_wot', sourceFoodCode: '030088'),
          ],
          candidates: const <AnalysisCandidateResult>[
            AnalysisCandidateResult(
              displayName: 'Misir Wot',
              foodId: 'misir_wot',
              confidence: 0.4,
            ),
          ],
        ),
      );
      final AppHarness harness = await pumpApp(
        tester,
        profile: answerProfile(),
        overrides: <Override>[analysisApiProvider.overrideWithValue(api)],
      );

      await readProvider<AnalysisController>(tester, analysisControllerProvider.notifier)
          .runText('some stew');
      harness.router.go(AppRoutes.scanFlow);
      await tester.pumpAndSettle();

      expect(find.text(Strings.lowConfidenceTitle), findsOneWidget);
      expect(find.text('Misir Wot'), findsOneWidget);
      // The escape hatch is always reachable.
      expect(find.text(Strings.searchManually), findsOneWidget);
      await harness.teardown(tester);
    });

    testWidgets('a provider failure is reported honestly and saves nothing',
        (WidgetTester tester) async {
      final _FakeAnalysisApi api = _FakeAnalysisApi(
        error: AnalysisException('no provider', code: 'AI_UNAVAILABLE'),
      );
      final AppHarness harness = await pumpApp(
        tester,
        profile: answerProfile(),
        overrides: <Override>[analysisApiProvider.overrideWithValue(api)],
      );

      await readProvider<AnalysisController>(tester, analysisControllerProvider.notifier)
          .runText('injera');
      harness.router.go(AppRoutes.scanFlow);
      await tester.pumpAndSettle();

      expect(find.text(Strings.analysisFailedTitle), findsOneWidget);
      expect(find.text(Strings.analysisUnavailable), findsOneWidget);
      expect(await harness.db.mealDao.allMeals(), isEmpty);
      await harness.teardown(tester);
    });
  });
}
