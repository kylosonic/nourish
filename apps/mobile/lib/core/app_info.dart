/// The installed app version.
///
/// Kept as a constant rather than pulled from a platform plugin so the update
/// check has no extra native dependency. `test/app_info_test.dart` reads
/// `pubspec.yaml` and fails if this drifts from the declared version, which is
/// what makes the duplication safe.
const String appVersion = '1.0.0';

/// Build number, as declared after the `+` in pubspec.yaml.
const String appBuildNumber = '1';
