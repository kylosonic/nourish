import 'dart:convert';
import 'dart:developer' as developer;

import 'package:http/http.dart' as http;

import '../models/release_metadata.dart';

/// Where the release metadata lives. Compile-time configurable so a staging
/// build can point somewhere else without a code change.
const String releaseMetadataUrl = String.fromEnvironment(
  'RELEASE_METADATA_URL',
  defaultValue: 'https://downloads.nourish.app/metadata/latest.json',
);

/// How long the update check may take before it is abandoned silently.
const Duration updateCheckTimeout = Duration(seconds: 8);

/// The update-check transport (REL-03). Lives under `lib/data/sources/` so the
/// app's network egress stays confined to this seam.
///
/// Failure is not an error state: an unreachable or unreadable document returns
/// null and the user is simply not bothered (REL-03 failure outcome).
class ReleaseMetadataSource {
  ReleaseMetadataSource({http.Client? client, String url = releaseMetadataUrl})
      : this._(client ?? http.Client(), url);

  ReleaseMetadataSource._(this._client, this._url);

  final http.Client _client;
  final String _url;

  Future<ReleaseMetadata?> fetch() async {
    try {
      final http.Response response = await _client
          .get(Uri.parse(_url), headers: <String, String>{'Accept': 'application/json'})
          .timeout(updateCheckTimeout);
      if (response.statusCode != 200) {
        developer.log(
          'update check: HTTP ${response.statusCode} — no notice shown',
          name: 'update-check',
        );
        return null;
      }
      return mapReleaseMetadata(jsonDecode(response.body));
    } catch (error) {
      developer.log(
        'update check failed — no notice shown',
        name: 'update-check',
        error: error,
      );
      return null;
    }
  }
}
