import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/sync_changes.dart';
import '../models/sync_operation.dart';
import 'api_catalog_data_source.dart' show apiBaseUrl;
import 'auth_api_client.dart' show AuthException, authTimeout;

/// The sync transport (OFF-02).
///
/// Fourth and last egress seam. It sends a queue and reads back one outcome per
/// operation: the device is not allowed to assume a push worked, because the
/// server may have decided an operation was stale, already applied, or refused.
class SyncApi {
  SyncApi({http.Client? client, String baseUrl = apiBaseUrl})
    : this._(client ?? http.Client(), baseUrl);

  SyncApi._(this._client, this._baseUrl);

  final http.Client _client;
  final String _baseUrl;

  /// Send queued operations, in order.
  ///
  /// The server answers with two arrays: what it applied (each with an outcome
  /// — `applied`, `ignored-stale` or `unchanged`) and what it refused (each with
  /// a reason). Both become outcomes here, because an operation the device never
  /// hears about would sit in the queue with no explanation.
  Future<SyncPushResult> push({
    required String accessToken,
    required List<SyncOperation> operations,
  }) async {
    final http.Response response = await _post(
      '/v1/sync',
      accessToken: accessToken,
      body: <String, dynamic>{
        'operations': operations
            .map((SyncOperation op) => op.toJson())
            .toList(),
      },
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw _errorFor(response);
    }
    final Map<String, dynamic> json = _decode(response);
    final List<dynamic> applied =
        (json['applied'] as List<dynamic>?) ?? <dynamic>[];
    final List<dynamic> rejected =
        (json['rejected'] as List<dynamic>?) ?? <dynamic>[];
    return SyncPushResult(
      outcomes: <SyncPushOutcome>[
        for (final dynamic entry in applied)
          _outcomeFrom(entry as Map<String, dynamic>),
        for (final dynamic entry in rejected)
          _rejectionFrom(entry as Map<String, dynamic>),
      ],
      serverTime: json['serverTime'] == null
          ? null
          : DateTime.tryParse(json['serverTime'] as String),
    );
  }

  SyncPushOutcome _outcomeFrom(Map<String, dynamic> json) => SyncPushOutcome(
    clientId: (json['clientId'] as String?) ?? '',
    kind: (json['kind'] as String?) ?? '',
    outcome: (json['outcome'] as String?) ?? 'rejected',
    message: json['message'] as String?,
  );

  /// A refusal, in the server's own shape (`reason`, not `message`).
  SyncPushOutcome _rejectionFrom(Map<String, dynamic> json) => SyncPushOutcome(
    clientId: (json['clientId'] as String?) ?? '',
    kind: (json['kind'] as String?) ?? '',
    outcome: 'rejected',
    message: (json['reason'] as String?) ?? 'The server refused this change.',
  );

  /// Read what the server holds that this device has not seen (OFF-02).
  ///
  /// [since] is the cursor from the previous pull ([SyncChanges.serverTime]);
  /// omitting it asks for everything, which is what a fresh install needs —
  /// the restore path rather than the steady-state one.
  Future<SyncChanges> changes({
    required String accessToken,
    DateTime? since,
    int limit = 500,
  }) async {
    final String query = <String>[
      if (since != null)
        'since=${Uri.encodeQueryComponent(since.toUtc().toIso8601String())}',
      'limit=$limit',
    ].join('&');
    final http.Response response;
    try {
      response = await _client
          .get(
            Uri.parse('$_baseUrl/v1/sync/changes?$query'),
            headers: <String, String>{
              'Accept': 'application/json',
              'Authorization': 'Bearer $accessToken',
            },
          )
          .timeout(authTimeout);
    } on Exception catch (error) {
      throw AuthException('Could not reach Nourish ($error)', code: 'NETWORK');
    }
    if (response.statusCode != 200) throw _errorFor(response);
    return SyncChanges.fromJson(_decode(response));
  }

  Future<http.Response> _post(
    String path, {
    required String accessToken,
    required Map<String, dynamic> body,
  }) async {
    final Uri uri = Uri.parse('$_baseUrl$path');
    try {
      return await _client
          .post(
            uri,
            headers: <String, String>{
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': 'Bearer $accessToken',
            },
            body: jsonEncode(body),
          )
          .timeout(authTimeout);
    } on Exception catch (error) {
      throw AuthException('Could not reach Nourish ($error)', code: 'NETWORK');
    }
  }

  Map<String, dynamic> _decode(http.Response response) {
    final Object? decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw const AuthException(
        'The server response was not readable.',
        code: 'UNREADABLE',
      );
    }
    return decoded;
  }

  AuthException _errorFor(http.Response response) {
    try {
      final Object? decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic> && decoded['error'] is Map) {
        final Map<dynamic, dynamic> error =
            decoded['error'] as Map<dynamic, dynamic>;
        final Object? message = error['message'];
        final Object? code = error['code'];
        if (message is String && code is String) {
          return AuthException(message, code: code);
        }
      }
    } catch (_) {
      // Fall through: never surface a raw body to the user.
    }
    return AuthException(
      'Sync failed (HTTP ${response.statusCode}).',
      code: 'HTTP_${response.statusCode}',
    );
  }
}
