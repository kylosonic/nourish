import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_mobile/core/app_info.dart';
import 'package:nourish_mobile/core/update_launcher.dart';
import 'package:nourish_mobile/data/models/release_metadata.dart';

/// S5: the in-app update check (REL-03) and the version constant it compares
/// against. The comparison rules matter — a downgraded release document must
/// never prompt — and the version constant must not drift from pubspec.yaml.
void main() {
  group('app version constant', () {
    test('matches the version declared in pubspec.yaml', () {
      final String pubspec = File('pubspec.yaml').readAsStringSync();
      final RegExpMatch? match =
          RegExp(r'^version:\s*([0-9]+\.[0-9]+\.[0-9]+)\+([0-9]+)\s*$', multiLine: true)
              .firstMatch(pubspec);
      expect(match, isNotNull, reason: 'pubspec.yaml must declare version: x.y.z+n');
      expect(
        match!.group(1),
        appVersion,
        reason: 'appVersion (lib/core/app_info.dart) must match pubspec.yaml',
      );
      expect(match.group(2), appBuildNumber);
    });
  });

  group('release metadata mapping', () {
    test('maps a published Android release', () {
      final ReleaseMetadata? metadata = mapReleaseMetadata(<String, dynamic>{
        'published': true,
        'version': '1.1.0',
        'release_date': '2026-10-01',
        'android': <String, dynamic>{
          'available': true,
          'apk': <String, dynamic>{
            'url': 'https://downloads.nourish.app/android/Nourish-v1.1.0-arm64.apk',
            'sha256': 'a' * 64,
            'size_bytes': 100,
          },
        },
        'ios': <String, dynamic>{'available': false, 'installable': false, 'ipa': null},
        'github_release': 'https://github.com/nourish-app/nourish/releases/tag/v1.1.0',
      });
      expect(metadata, isNotNull);
      expect(metadata!.version, '1.1.0');
      expect(metadata.canUpdateOnAndroid, isTrue);
      expect(metadata.iosInstallable, isFalse);
    });

    test('ignores an installable iOS claim with no signed asset', () {
      final ReleaseMetadata? metadata = mapReleaseMetadata(<String, dynamic>{
        'published': true,
        'version': '1.1.0',
        'ios': <String, dynamic>{'available': true, 'installable': true, 'ipa': null},
      });
      expect(metadata!.iosInstallable, isFalse);
    });

    test('an unusable document maps to null rather than throwing', () {
      expect(mapReleaseMetadata(null), isNull);
      expect(mapReleaseMetadata('nope'), isNull);
      expect(mapReleaseMetadata(<String, dynamic>{}), isNotNull);
      expect(
        mapReleaseMetadata(<String, dynamic>{})!.canUpdateOnAndroid,
        isFalse,
        reason: 'an empty document must not offer an update',
      );
    });
  });

  group('semantic version comparison (REL-03)', () {
    test('a newer version prompts; the same or an older one does not', () {
      expect(isNewerVersion('1.1.0', '1.0.0'), isTrue);
      expect(isNewerVersion('1.0.1', '1.0.0'), isTrue);
      expect(isNewerVersion('1.10.0', '1.9.0'), isTrue, reason: 'not string comparison');
      expect(isNewerVersion('2.0.0', '1.9.9'), isTrue);
      expect(isNewerVersion('1.0.0', '1.0.0'), isFalse);
      expect(isNewerVersion('0.9.0', '1.0.0'), isFalse, reason: 'a downgrade must not prompt');
    });

    test('malformed versions never prompt', () {
      expect(isNewerVersion(null, '1.0.0'), isFalse);
      expect(isNewerVersion('1.1', '1.0.0'), isFalse);
      expect(isNewerVersion('not-a-version', '1.0.0'), isFalse);
      expect(isNewerVersion('1.1.0', null), isFalse);
    });
  });

  group('update launcher', () {
    test('refuses a non-http(s) scheme (a document cannot launch arbitrary apps)',
        () async {
      const SystemUpdateLauncher launcher = SystemUpdateLauncher();
      expect(await launcher.open('file:///etc/passwd'), isFalse);
      expect(await launcher.open('myapp://do-something'), isFalse);
      expect(await launcher.open('not a url'), isFalse);
    });
  });
}
