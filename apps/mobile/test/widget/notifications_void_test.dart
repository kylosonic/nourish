import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/l10n/strings.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

/// M6: the home notifications icon opens the honest void with DEDICATED
/// notifications copy (not the generic fallback).
void main() {
  group('M6 notifications void copy', () {
    testWidgets('notifications icon renders the dedicated void copy',
        (WidgetTester tester) async {
      final AppDatabase db = await openSeededDb();
      final UserProfile answers = answerProfile();
      await seedTarget(db, answers);

      final AppHarness harness = await pumpApp(
        tester,
        profile: answers,
        db: db,
      );

      await tester.tap(find.byTooltip(Strings.notificationsTitle));
      await tester.pumpAndSettle();

      expect(
        find.text(Strings.honestVoidTitle('notifications')),
        findsWidgets,
      );
      expect(
        find.text(Strings.honestVoidBody('notifications')),
        findsOneWidget,
      );
      // Dedicated copy differs from the generic fallback.
      expect(
        Strings.honestVoidBody('notifications'),
        isNot(Strings.honestVoidBody('unknown-feature')),
      );
      await harness.teardown(tester);
    });
  });
}
