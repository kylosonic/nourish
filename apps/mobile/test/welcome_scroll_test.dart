import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/l10n/strings.dart';

import 'pump_app.dart';

/// M7: the welcome screen scrolls on short viewports so BOTH actions
/// stay reachable at 320×480 (blueprint A21).
void main() {
  group('M7 welcome scroll', () {
    testWidgets('320×480: both buttons are reachable and work',
        (WidgetTester tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 480));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      // A fresh profile routes the app to /welcome.
      final AppHarness harness = await pumpApp(tester);

      expect(find.text(Strings.welcomeTitle), findsOneWidget);

      // Primary action visible at the bottom of the short viewport.
      await tester.ensureVisible(find.text(Strings.getStarted));
      await tester.pumpAndSettle();
      expect(find.text(Strings.getStarted), findsOneWidget);

      // Secondary action starts below the fold — scrolling reveals it, and it
      // opens the real sign-in screen, which needs no local profile.
      await tester.ensureVisible(find.text(Strings.alreadyHaveAccount));
      await tester.pumpAndSettle();
      await tester.tap(find.text(Strings.alreadyHaveAccount));
      await tester.pumpAndSettle();
      expect(find.text(Strings.signInSubtitle), findsWidgets);

      await harness.teardown(tester);
    });
  });
}
