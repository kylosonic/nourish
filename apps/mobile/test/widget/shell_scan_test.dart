import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/l10n/strings.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

void main() {
  group('HOME-05 shell', () {
    testWidgets('tabs switch between the four branch pages',
        (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      expect(find.text('CALORIES LEFT'), findsOneWidget);

      await tester.tap(find.text(Strings.progressTab));
      await tester.pumpAndSettle();
      expect(find.text(Strings.progressComingTitle), findsWidgets);
      expect(find.text('CALORIES LEFT'), findsNothing);

      await tester.tap(find.text(Strings.insightsTab));
      await tester.pumpAndSettle();
      expect(find.text(Strings.insightsComingTitle), findsWidgets);

      await tester.tap(find.text(Strings.profileTab));
      await tester.pumpAndSettle();
      expect(find.text(Strings.profileComingTitle), findsWidgets);

      await tester.tap(find.text(Strings.homeTab));
      await tester.pumpAndSettle();
      expect(find.text('CALORIES LEFT'), findsOneWidget);
      await harness.teardown(tester);
    });

    testWidgets('scan center opens the sheet OVER Home; closing restores '
        'state', (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      await tester.tap(find.byIcon(Icons.add_circle));
      await tester.pumpAndSettle();

      // Sheet over Home: both present.
      expect(find.text(Strings.whatDidYouEat), findsOneWidget);
      expect(find.text('CALORIES LEFT'), findsOneWidget);

      // Close → exactly the prior screen, no state change.
      await tester.tap(find.byTooltip(Strings.closeTooltip));
      await tester.pumpAndSettle();
      expect(find.text(Strings.whatDidYouEat), findsNothing);
      expect(find.text('CALORIES LEFT'), findsOneWidget);
      await harness.teardown(tester);
    });
  });

  group('SCAN-01 sheet', () {
    testWidgets('six options; search lane live; other lanes → honest voids '
        'with a working search alternative', (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final AppHarness harness = await pumpApp(tester, profile: answers, db: db);

      await tester.tap(find.byIcon(Icons.add_circle));
      await tester.pumpAndSettle();

      expect(find.text(Strings.scanTakePhoto.toUpperCase()), findsOneWidget);
      expect(find.text(Strings.scanChoosePhoto.toUpperCase()), findsOneWidget);
      expect(find.text(Strings.scanDescribeMeal.toUpperCase()), findsOneWidget);
      expect(find.text(Strings.scanUseVoice.toUpperCase()), findsOneWidget);
      expect(find.text(Strings.scanSearchFood.toUpperCase()), findsOneWidget);
      expect(find.text(Strings.scanBarcode.toUpperCase()), findsOneWidget);

      // Take photo → honest void with honest copy + working alternative.
      await tester.tap(find.text(Strings.scanTakePhoto.toUpperCase()));
      await tester.pumpAndSettle();
      expect(find.text(Strings.honestVoidTitle('take-photo')), findsWidgets);
      expect(find.text(Strings.honestVoidBody('take-photo')), findsOneWidget);

      await tester.tap(find.text(Strings.searchFoodInstead));
      await tester.pumpAndSettle();
      expect(find.text(Strings.searchFoodsTitle), findsOneWidget);
      await harness.teardown(tester);
    });
  });
}
