import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/account_session.dart';
import 'api_catalog_data_source.dart' show apiBaseUrl;

/// Sign-in request timeout. Shorter than the analysis timeout: a person is
/// waiting on this one with the screen open.
const Duration authTimeout = Duration(seconds: 20);

/// An auth failure carrying the server's own error code, so the UI can say
/// something specific ("that code expired") instead of "something went wrong".
class AuthException implements Exception {
  const AuthException(this.message, {required this.code});

  final String message;

  /// The v1 error code (`OTP_EXPIRED`, `SMS_UNAVAILABLE`, …), or `HTTP_<n>` /
  /// `NETWORK` when the failure never reached the envelope.
  final String code;

  @override
  String toString() => 'AuthException($code): $message';
}

/// The account transport (S3, ADR-0008). Lives under `lib/data/sources/` so
/// network egress stays confined to this seam and `lib/data/sync/`.
///
/// Thin by design: it moves the request and the response and reports the
/// server's error code verbatim. It never decides what a phone number is (the
/// server normalizes it, AUTH-01) and never invents a session.
class AuthApi {
  AuthApi({http.Client? client, String baseUrl = apiBaseUrl})
    : this._(client ?? http.Client(), baseUrl);

  AuthApi._(this._client, this._baseUrl);

  final http.Client _client;
  final String _baseUrl;

  /// AUTH-02: ask for a one-time code. The code is never in the response.
  Future<OtpRequestAck> requestOtp(String phone) async {
    final http.Response response = await _send(
      'POST',
      '/v1/auth/otp',
      body: <String, dynamic>{'phone': phone},
    );
    if (response.statusCode != 202) throw _errorFor(response);
    return OtpRequestAck.fromJson(_decode(response));
  }

  /// AUTH-02: exchange the code for a session, creating the account if new.
  Future<SignedInSession> verifyOtp({
    required String phone,
    required String code,
  }) async {
    final http.Response response = await _send(
      'POST',
      '/v1/auth/otp/verify',
      body: <String, dynamic>{'phone': phone, 'code': code},
    );
    if (response.statusCode != 200) throw _errorFor(response);
    final Map<String, dynamic> json = _decode(response);
    return SignedInSession(
      tokens: SessionTokens.fromJson(json['tokens'] as Map<String, dynamic>),
      account: Account.fromJson(json['account'] as Map<String, dynamic>),
    );
  }

  /// AUTH-03: rotate the refresh credential. The old one stops working.
  Future<SessionTokens> refresh(String refreshToken) async {
    final http.Response response = await _send(
      'POST',
      '/v1/auth/refresh',
      body: <String, dynamic>{'refreshToken': refreshToken},
    );
    if (response.statusCode != 200) throw _errorFor(response);
    return SessionTokens.fromJson(
      _decode(response)['tokens'] as Map<String, dynamic>,
    );
  }

  /// AUTH-03: end this device's session. Idempotent — the server answers 204
  /// whether or not the token was still valid, so the app can always clear the
  /// device even with no connectivity to a working session.
  Future<void> logout(String refreshToken) async {
    final http.Response response = await _send(
      'POST',
      '/v1/auth/logout',
      body: <String, dynamic>{'refreshToken': refreshToken},
    );
    if (response.statusCode != 204 && response.statusCode != 401) {
      throw _errorFor(response);
    }
  }

  /// The signed-in user's own record (plan, consent, session count).
  Future<Account> me(String accessToken) async {
    final http.Response response = await _send(
      'GET',
      '/v1/me',
      accessToken: accessToken,
    );
    if (response.statusCode != 200) throw _errorFor(response);
    return Account.fromJson(_decode(response));
  }

  Future<http.Response> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? accessToken,
  }) async {
    final Uri uri = Uri.parse('$_baseUrl$path');
    final Map<String, String> headers = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      if (accessToken != null) 'Authorization': 'Bearer $accessToken',
    };
    try {
      final Future<http.Response> request = method == 'GET'
          ? _client.get(uri, headers: headers)
          : _client.post(uri, headers: headers, body: jsonEncode(body));
      return await request.timeout(authTimeout);
    } on Exception catch (error) {
      // No envelope was reached, so there is no server code to report.
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
      'Sign-in failed (HTTP ${response.statusCode}).',
      code: 'HTTP_${response.statusCode}',
    );
  }
}
