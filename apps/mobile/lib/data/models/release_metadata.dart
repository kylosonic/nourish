import 'dart:developer' as developer;

/// Release metadata as published by the release pipeline (REL-01 / REL-03).
///
/// The mapper is total: an unreadable document yields `null` rather than an
/// exception, because "we could not check for updates" must never be an error
/// the user sees — it is simply no notice.
class ReleaseMetadata {
  const ReleaseMetadata({
    required this.published,
    required this.version,
    required this.releaseDate,
    required this.androidAvailable,
    required this.androidApkUrl,
    required this.androidApkSha256,
    required this.iosInstallable,
    required this.githubReleaseUrl,
  });

  final bool published;
  final String? version;
  final String? releaseDate;
  final bool androidAvailable;
  final String? androidApkUrl;
  final String? androidApkSha256;

  /// True only for a genuinely signed Apple distribution build (master §65).
  final bool iosInstallable;
  final String? githubReleaseUrl;

  /// The document offers an Android download we could send the user to.
  bool get canUpdateOnAndroid =>
      published && androidAvailable && (androidApkUrl?.isNotEmpty ?? false);
}

/// Parse a `latest.json` document. Returns null when it cannot be trusted.
ReleaseMetadata? mapReleaseMetadata(Object? decoded) {
  if (decoded is! Map<String, dynamic>) {
    developer.log('release metadata is not a JSON object', name: 'update-check');
    return null;
  }
  final Map<String, dynamic> android =
      decoded['android'] is Map<String, dynamic>
          ? decoded['android'] as Map<String, dynamic>
          : const <String, dynamic>{};
  final Map<String, dynamic> ios = decoded['ios'] is Map<String, dynamic>
      ? decoded['ios'] as Map<String, dynamic>
      : const <String, dynamic>{};

  final Map<String, dynamic>? apk =
      android['apk'] is Map<String, dynamic>
          ? android['apk'] as Map<String, dynamic>
          : null;

  return ReleaseMetadata(
    published: decoded['published'] == true,
    version: decoded['version'] is String ? decoded['version'] as String : null,
    releaseDate:
        decoded['release_date'] is String ? decoded['release_date'] as String : null,
    androidAvailable: android['available'] == true,
    androidApkUrl: apk?['url'] is String ? apk!['url'] as String : null,
    androidApkSha256: apk?['sha256'] is String ? apk!['sha256'] as String : null,
    // An installable iOS claim without a signed asset is ignored, not trusted.
    iosInstallable: ios['installable'] == true && ios['ipa'] is Map,
    githubReleaseUrl: decoded['github_release'] is String
        ? decoded['github_release'] as String
        : null,
  );
}

/// Semantic version comparison (REL-03). Never string-based, so "1.10.0" is
/// correctly newer than "1.9.0", and a downgraded document never prompts.
bool isNewerVersion(String? latest, String? installed) {
  final List<int> a = _parse(latest);
  final List<int> b = _parse(installed);
  if (a.length < 3 || b.length < 3) return false;
  for (int i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}

List<int> _parse(String? value) {
  if (value == null) return const <int>[];
  final List<String> parts = value.split(RegExp(r'[.+-]'));
  if (parts.length < 3) return const <int>[];
  return parts
      .take(3)
      .map((String part) => int.tryParse(part) ?? -1)
      .toList(growable: false);
}
