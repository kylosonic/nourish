import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_mobile/data/models/account_session.dart';
import 'package:nourish_mobile/data/services/token_store.dart';
import 'package:nourish_mobile/data/sources/auth_api_client.dart';

import 'test_helpers.dart';

/// The API client is the only place sign-in talks to the network, so its job is
/// narrow and worth pinning: send the documented shape, read the server's own
/// error code verbatim, and never invent a session from a failure.
void main() {
  group('AuthApi', () {
    test('requestOtp posts the number as typed and reads the ack', () async {
      final FakeHttpClient client = FakeHttpClient(
        statusCode: 202,
        body: <String, dynamic>{
          'phoneE164': '+251911234567',
          'expiresIn': 300,
          'resendAfter': 60,
        },
      );
      final AuthApi api = AuthApi(client: client, baseUrl: 'http://localhost');

      final OtpRequestAck ack = await api.requestOtp('0911 23 45 67');

      expect(client.requests.single.method, 'POST');
      expect(client.requests.single.path, '/v1/auth/otp');
      expect(client.requests.single.body, <String, dynamic>{
        'phone': '0911 23 45 67',
      });
      expect(ack.phoneE164, '+251911234567');
      expect(ack.expiresInSeconds, 300);
      expect(ack.resendAfterSeconds, 60);
    });

    test('verifyOtp returns the tokens and the account the server sent',
        () async {
      final FakeHttpClient client = FakeHttpClient(
        statusCode: 200,
        body: <String, dynamic>{
          'tokens': <String, dynamic>{
            'accessToken': 'access-1',
            'refreshToken': 'refresh-1',
            'expiresIn': 900,
            'tokenType': 'Bearer',
          },
          'account': <String, dynamic>{
            'id': 'acc-1',
            'phoneE164': '+251911234567',
            'onboarded': false,
            'createdAt': '2026-09-20T10:00:00.000Z',
            'plan': 'FREE',
            'planValidUntil': null,
            'aiImprovementConsent': false,
            'activeSessions': 1,
          },
          'created': true,
        },
      );
      final AuthApi api = AuthApi(client: client, baseUrl: 'http://localhost');

      final SignedInSession session = await api.verifyOtp(
        phone: '0911234567',
        code: '123456',
      );

      expect(client.requests.single.path, '/v1/auth/otp/verify');
      expect(session.tokens.accessToken, 'access-1');
      expect(session.tokens.refreshToken, 'refresh-1');
      expect(session.tokens.expiresInSeconds, 900);
      expect(session.account.id, 'acc-1');
      expect(session.account.phoneE164, '+251911234567');
      expect(session.account.plan, AccountPlan.free);
      expect(session.account.aiImprovementConsent, isFalse);
      expect(session.account.activeSessions, 1);
    });

    test('a premium plan is read as premium', () async {
      final FakeHttpClient client = FakeHttpClient(
        statusCode: 200,
        body: <String, dynamic>{
          'id': 'acc-1',
          'phoneE164': '+251911234567',
          'onboarded': true,
          'createdAt': '2026-09-20T10:00:00.000Z',
          'plan': 'PREMIUM',
          'planValidUntil': '2026-10-20T10:00:00.000Z',
          'aiImprovementConsent': true,
          'activeSessions': 2,
        },
      );
      final AuthApi api = AuthApi(client: client, baseUrl: 'http://localhost');

      final Account account = await api.me('access-1');

      expect(account.plan, AccountPlan.premium);
      expect(account.aiImprovementConsent, isTrue);
      expect(account.planValidUntil, DateTime.parse('2026-10-20T10:00:00.000Z'));
      expect(client.requests.single.headers['Authorization'], 'Bearer access-1');
    });

    test('the server error code is surfaced, not replaced by a generic one',
        () async {
      final FakeHttpClient client = FakeHttpClient(
        statusCode: 401,
        body: <String, dynamic>{
          'error': <String, dynamic>{
            'code': 'OTP_EXPIRED',
            'message': 'That code expired.',
            'requestId': 'r-1',
          },
        },
      );
      final AuthApi api = AuthApi(client: client, baseUrl: 'http://localhost');

      await expectLater(
        api.verifyOtp(phone: '0911234567', code: '000000'),
        throwsA(
          isA<AuthException>()
              .having((AuthException e) => e.code, 'code', 'OTP_EXPIRED')
              .having((AuthException e) => e.message, 'message', 'That code expired.'),
        ),
      );
    });

    test('a body that is not the documented envelope does not leak to the user',
        () async {
      final FakeHttpClient client = FakeHttpClient(
        statusCode: 500,
        body: 'not json at all',
        rawBody: true,
      );
      final AuthApi api = AuthApi(client: client, baseUrl: 'http://localhost');

      await expectLater(
        api.requestOtp('0911234567'),
        throwsA(
          isA<AuthException>().having(
            (AuthException e) => e.code,
            'code',
            'HTTP_500',
          ),
        ),
      );
    });

    test('a network failure is reported as NETWORK, never as a session',
        () async {
      final FakeHttpClient client = FakeHttpClient(throws: true);
      final AuthApi api = AuthApi(client: client, baseUrl: 'http://localhost');

      await expectLater(
        api.requestOtp('0911234567'),
        throwsA(
          isA<AuthException>().having((AuthException e) => e.code, 'code', 'NETWORK'),
        ),
      );
    });

    test('logout treats an already-dead token as success', () async {
      // The user asked to sign out; a 401 means the session is already gone,
      // which is the outcome they wanted.
      final FakeHttpClient client = FakeHttpClient(
        statusCode: 401,
        body: <String, dynamic>{
          'error': <String, dynamic>{
            'code': 'TOKEN_REUSED',
            'message': 'Token reuse detected.',
            'requestId': 'r-1',
          },
        },
      );
      final AuthApi api = AuthApi(client: client, baseUrl: 'http://localhost');

      await api.logout('refresh-1');
      expect(client.requests.single.path, '/v1/auth/logout');
    });
  });

  group('InMemoryTokenStore', () {
    test('starts empty, remembers a session, and forgets it on clear', () async {
      final TokenStore store = InMemoryTokenStore();
      expect(await store.read(), isNull);

      const SessionTokens tokens = SessionTokens(
        accessToken: 'a',
        refreshToken: 'r',
        expiresInSeconds: 900,
      );
      await store.write(tokens);
      final SessionTokens? read = await store.read();
      expect(read?.accessToken, 'a');
      expect(read?.refreshToken, 'r');
      expect(read?.expiresInSeconds, 900);

      await store.clear();
      expect(await store.read(), isNull);
    });
  });
}
