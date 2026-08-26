import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/core/date_utils.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/water_repository.dart';
import 'package:nourish_mobile/l10n/strings.dart';
import 'package:nourish_mobile/providers.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

/// Persistence-failing repository: the stream never emits the change, so
/// the UI must not move — revert + snackbar (HOME-04).
class _FailingWaterRepository extends WaterRepository {
  _FailingWaterRepository(super.db);

  @override
  Future<void> addMl({int amountMl = 250, String? dateKey}) async {
    throw Exception('simulated persistence failure');
  }
}

void main() {
  group('HOME-04 / WW-01 hydration card', () {
    testWidgets('add 250ml, remove, floor at 0 (no error)',
        (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      // Start: 0.0 / 3.0 L.
      expect(find.text('0.0'), findsOneWidget);
      expect(find.text('/ 3.0 L'), findsOneWidget);

      // Add 250 ml twice → 0.5 L (card sits below the fold).
      await tester.ensureVisible(find.text(Strings.add250ml.toUpperCase()));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.add250ml.toUpperCase()));
      await tester.pumpAndSettle();
      expect(find.text('0.25'), findsOneWidget);
      await tester.tap(find.text(Strings.add250ml.toUpperCase()));
      await tester.pumpAndSettle();
      expect(find.text('0.5'), findsOneWidget);

      // Remove → 0.25 L.
      await tester.ensureVisible(find.byTooltip(Strings.removeWaterTooltip));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip(Strings.removeWaterTooltip));
      await tester.pumpAndSettle();
      expect(find.text('0.25'), findsOneWidget);

      // Remove to the floor: never below zero, no error snackbar.
      await tester.tap(find.byTooltip(Strings.removeWaterTooltip));
      await tester.pumpAndSettle();
      expect(find.text('0.0'), findsOneWidget);
      expect(find.byType(SnackBar), findsNothing);

      // At the floor the remove control is disabled.
      final IconButton removeButton = tester.widget<IconButton>(
        find.ancestor(
          of: find.byTooltip(Strings.removeWaterTooltip),
          matching: find.byType(IconButton),
        ),
      );
      expect(removeButton.onPressed, isNull);

      // Persisted total matches the UI.
      final int persisted = await WaterRepository(db).dailyTotalMl(
        todayDateKey(),
      );
      expect(persisted, 0);
      await harness.teardown(tester);
    });

    testWidgets('persistence failure: UI reverts + error snackbar',
        (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final AppHarness harness = await pumpApp(
        tester,
        profile: answers,
        db: db,
        overrides: <Override>[
          waterRepositoryProvider.overrideWithValue(
            _FailingWaterRepository(db),
          ),
        ],
      );

      expect(find.text('0.0'), findsOneWidget);
      await tester.ensureVisible(find.text(Strings.add250ml.toUpperCase()));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.add250ml.toUpperCase()));
      await tester.pumpAndSettle();

      // Reverted: liters unchanged, failure surfaced honestly.
      expect(find.text('0.0'), findsOneWidget);
      expect(find.text(Strings.waterSaveFailed), findsOneWidget);
      await harness.teardown(tester);
    });
  });
}
