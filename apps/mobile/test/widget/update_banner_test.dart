import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_mobile/data/models/release_metadata.dart';
import 'package:nourish_mobile/l10n/strings.dart';
import 'package:nourish_mobile/router/routes.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

/// REL-03 acceptance: a newer Android release produces the notice, the action
/// opens the download URL in the browser, and the app never installs anything.
void main() {
  ReleaseMetadata newerRelease({bool installableIos = false}) {
    return ReleaseMetadata(
      published: true,
      version: '9.9.9',
      releaseDate: '2026-10-01',
      androidAvailable: true,
      androidApkUrl: 'https://downloads.nourish.app/android/Nourish-v9.9.9-arm64.apk',
      androidApkSha256: 'a' * 64,
      iosInstallable: installableIos,
      githubReleaseUrl: 'https://github.com/nourish-app/nourish/releases/tag/v9.9.9',
    );
  }

  testWidgets('a newer release shows the notice and DOWNLOAD UPDATE opens the URL',
      (WidgetTester tester) async {
    final FakeUpdateLauncher launcher = FakeUpdateLauncher();
    final AppHarness harness = await pumpApp(
      tester,
      profile: answerProfile(),
      overrides: <Override>[
        ...offlineUpdateOverrides(metadata: newerRelease(), launcher: launcher),
      ],
    );

    harness.router.go(AppRoutes.home);
    await tester.pumpAndSettle();

    expect(find.text(Strings.updateAvailableTitle('9.9.9')), findsOneWidget);
    expect(find.text(Strings.downloadUpdate), findsOneWidget);

    await tester.tap(find.text(Strings.downloadUpdate));
    await tester.pumpAndSettle();

    expect(launcher.opened, <String>[
      'https://downloads.nourish.app/android/Nourish-v9.9.9-arm64.apk',
    ]);
    await harness.teardown(tester);
  });

  testWidgets('the notice can be dismissed and does not come back',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpApp(
      tester,
      profile: answerProfile(),
      overrides: <Override>[...offlineUpdateOverrides(metadata: newerRelease())],
    );

    harness.router.go(AppRoutes.home);
    await tester.pumpAndSettle();
    expect(find.text(Strings.updateAvailableTitle('9.9.9')), findsOneWidget);

    await tester.tap(find.byTooltip(Strings.dismissTooltip));
    await tester.pumpAndSettle();
    expect(find.text(Strings.updateAvailableTitle('9.9.9')), findsNothing);

    await harness.teardown(tester);
  });

  testWidgets('an unreachable release document shows nothing at all',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpApp(
      tester,
      profile: answerProfile(),
      // metadata omitted → the source returns null, the failure outcome.
      overrides: <Override>[...offlineUpdateOverrides()],
    );

    harness.router.go(AppRoutes.home);
    await tester.pumpAndSettle();

    expect(find.textContaining('New version available'), findsNothing);
    expect(find.text(Strings.downloadUpdate), findsNothing);
    await harness.teardown(tester);
  });

  testWidgets('a release that is not newer than the installed build shows nothing',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpApp(
      tester,
      profile: answerProfile(),
      overrides: <Override>[
        ...offlineUpdateOverrides(
          metadata: ReleaseMetadata(
            published: true,
            version: '0.1.0', // older than appVersion
            releaseDate: '2026-01-01',
            androidAvailable: true,
            androidApkUrl: 'https://downloads.nourish.app/android/old.apk',
            androidApkSha256: 'b' * 64,
            iosInstallable: false,
            githubReleaseUrl: null,
          ),
        ),
      ],
    );

    harness.router.go(AppRoutes.home);
    await tester.pumpAndSettle();

    expect(find.textContaining('New version available'), findsNothing);
    await harness.teardown(tester);
  });
}
