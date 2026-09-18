import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../models/analysis_result.dart';
import 'api_catalog_data_source.dart' show apiBaseUrl;

/// Catalog/analysis request timeout.
const Duration analysisTimeout = Duration(seconds: 30);

/// The analysis transport (S2). Lives under `lib/data/sources/` so network
/// egress stays confined to this seam and `lib/data/sync/` (zero-egress rule).
///
/// The client is deliberately thin: it converts bytes/text into the wire
/// request and the response into [AnalysisResult]; every decision about what the
/// numbers mean belongs to the server pipeline and the local domain engines.
class AnalysisApi {
  AnalysisApi({http.Client? client, String baseUrl = apiBaseUrl})
      : this._(client ?? http.Client(), baseUrl);

  AnalysisApi._(this._client, this._baseUrl);

  final http.Client _client;
  final String _baseUrl;

  /// Analyse a meal described in words (LOG-01).
  Future<AnalysisResult> analyzeText(String text) =>
      _post(<String, dynamic>{'text': text});

  /// Analyse a meal photo. The caller must already have downscaled and stripped
  /// metadata from [bytes] (SCAN-03).
  Future<AnalysisResult> analyzePhoto(Uint8List bytes) =>
      _post(<String, dynamic>{'imageBase64': base64Encode(bytes)});

  Future<AnalysisResult> _post(Map<String, dynamic> body) async {
    final Uri uri = Uri.parse('$_baseUrl/v1/analyses');
    late http.Response response;
    try {
      response = await _client
          .post(
            uri,
            headers: <String, String>{
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode(body),
          )
          .timeout(analysisTimeout);
    } on Exception catch (error) {
      throw AnalysisException('Could not reach the analysis service ($error)');
    }

    if (response.statusCode != 201) {
      throw _errorFor(response);
    }
    final Object? decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw AnalysisException('The analysis response was not readable');
    }
    return mapAnalysisResult(decoded);
  }

  /// Report user corrections (SAFE-07). Best-effort by contract: the server
  /// answers 204 even when it cannot store the record, and a transport failure
  /// here must never break saving the meal, so the caller ignores errors.
  Future<void> reportCorrections({
    required String analysisId,
    required List<Map<String, dynamic>> items,
  }) async {
    final Uri uri = Uri.parse('$_baseUrl/v1/analyses/$analysisId/corrections');
    await _client
        .post(
          uri,
          headers: <String, String>{'Content-Type': 'application/json'},
          body: jsonEncode(<String, dynamic>{'items': items}),
        )
        .timeout(analysisTimeout);
  }

  AnalysisException _errorFor(http.Response response) {
    String? code;
    String? message;
    try {
      final Object? decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic> && decoded['error'] is Map) {
        final Map<dynamic, dynamic> error = decoded['error'] as Map<dynamic, dynamic>;
        code = error['code'] is String ? error['code'] as String : null;
        message = error['message'] is String ? error['message'] as String : null;
      }
    } catch (_) {
      // Fall through to the generic message: never surface a raw body.
    }
    return AnalysisException(
      message ?? 'Analysis failed (HTTP ${response.statusCode})',
      code: code ?? 'HTTP_${response.statusCode}',
    );
  }
}
