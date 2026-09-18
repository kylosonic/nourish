import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_mobile/data/models/analysis_result.dart';
import 'package:nourish_mobile/data/services/image_acquisition_service.dart';
import 'package:nourish_mobile/data/sources/analysis_api_client.dart';
import 'package:nourish_mobile/features/scan/analysis_controller.dart';
import 'package:nourish_mobile/l10n/strings.dart';
import 'package:nourish_mobile/providers.dart';
import 'package:nourish_mobile/router/routes.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

/// A scripted analysis transport that records the bytes it was given.
class _RecordingAnalysisApi implements AnalysisApi {
  Uint8List? lastPhoto;

  @override
  Future<AnalysisResult> analyzeText(String text) async {
    throw UnimplementedError('the photo lane must not send text');
  }

  @override
  Future<AnalysisResult> analyzePhoto(covariant Object bytes) async {
    lastPhoto = bytes as Uint8List;
    return AnalysisResult(
      id: 'an_photo',
      inputKind: 'photo',
      confidenceState: 'High',
      overallConfidence: 0.9,
      items: <AnalysisItemResult>[
        AnalysisItemResult(
          id: 'it_1',
          displayName: 'injera',
          foodId: 'injera',
          sourceFoodCode: '010109',
          canonicalName: 'Enjera, teff, mixed',
          matchKind: 'alias',
          amount: 1,
          unit: 'injera',
          grams: 150,
          portionEstimated: false,
          confidence: 0.9,
          unresolved: false,
          nutrition: const AnalysisNutrition(kcal: 228, proteinG: 6, carbsG: 44, fatG: 2),
        ),
      ],
      totals: const AnalysisNutrition(kcal: 228, proteinG: 6, carbsG: 44, fatG: 2),
      candidates: const <AnalysisCandidateResult>[],
      notes: const <String>[],
    );
  }

  @override
  Future<void> reportCorrections({
    required String analysisId,
    required List<Map<String, dynamic>> items,
  }) async {}
}

/// SCAN-01 → SCAN-03: the CHOOSE PHOTO lane picks an image, prepares it, and
/// hands it to the same pipeline the text lane uses.
void main() {
  final Uint8List preparedBytes = Uint8List.fromList(<int>[1, 2, 3, 4, 5]);

  testWidgets('a chosen photo is analysed and reaches the result screen',
      (WidgetTester tester) async {
    final _RecordingAnalysisApi api = _RecordingAnalysisApi();
    final FakeImageAcquisitionService picker = FakeImageAcquisitionService(
      photo: PreparedPhoto(bytes: preparedBytes, source: MealPhotoSource.gallery),
    );
    final AppHarness harness = await pumpApp(
      tester,
      profile: answerProfile(),
      overrides: <Override>[
        ...offlineUpdateOverrides(imagePicker: picker),
        analysisApiProvider.overrideWithValue(api),
      ],
    );

    harness.router.go(AppRoutes.photoCapture);
    await tester.pumpAndSettle();

    expect(picker.calls, 1);
    expect(picker.lastSource, MealPhotoSource.gallery);
    expect(api.lastPhoto, preparedBytes, reason: 'the prepared bytes are uploaded');
    expect(find.text(Strings.scanComplete), findsOneWidget);
    await harness.teardown(tester);
  });

  testWidgets('cancelling the picker leaves no trace and returns to the origin',
      (WidgetTester tester) async {
    final _RecordingAnalysisApi api = _RecordingAnalysisApi();
    // No photo configured → the fake reports "cancelled".
    final FakeImageAcquisitionService picker = FakeImageAcquisitionService();
    final AppHarness harness = await pumpApp(
      tester,
      profile: answerProfile(),
      overrides: <Override>[
        ...offlineUpdateOverrides(imagePicker: picker),
        analysisApiProvider.overrideWithValue(api),
      ],
    );

    harness.router.go(AppRoutes.home);
    await tester.pumpAndSettle();
    harness.router.push(AppRoutes.photoCapture);
    await tester.pumpAndSettle();

    expect(picker.calls, 1);
    expect(api.lastPhoto, isNull, reason: 'nothing may be uploaded after a cancel');
    expect(
      readProvider<AnalysisFlowState>(tester, analysisControllerProvider).phase,
      AnalysisPhase.idle,
      reason: 'a cancelled pick changes no state (SCAN-01 edge case)',
    );
    expect(find.text(Strings.scanComplete), findsNothing);
    await harness.teardown(tester);
  });

  testWidgets('the scan sheet routes CHOOSE PHOTO into the photo lane',
      (WidgetTester tester) async {
    final FakeImageAcquisitionService picker = FakeImageAcquisitionService();
    final AppHarness harness = await pumpApp(
      tester,
      profile: answerProfile(),
      overrides: <Override>[
        ...offlineUpdateOverrides(imagePicker: picker),
        analysisApiProvider.overrideWithValue(_RecordingAnalysisApi()),
      ],
    );

    harness.router.go(AppRoutes.home);
    await tester.pumpAndSettle();

    // Open the sheet from the scan centre button, then take the photo lane.
    await tester.tap(find.byIcon(Icons.add_circle).first);
    await tester.pumpAndSettle();
    expect(find.text(Strings.scanChoosePhoto.toUpperCase()), findsOneWidget);
    await tester.tap(find.text(Strings.scanChoosePhoto.toUpperCase()));
    await tester.pumpAndSettle();

    expect(
      picker.calls,
      1,
      reason: 'the lane must reach the picker, not an honest void',
    );
    await harness.teardown(tester);
  });
}
