import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_mobile/data/models/account_session.dart';
import 'package:nourish_mobile/data/services/token_store.dart';
import 'package:nourish_mobile/data/sources/auth_api_client.dart';
import 'package:nourish_mobile/features/auth/auth_controller.dart';
import 'package:nourish_mobile/providers.dart';

import 'test_helpers.dart';

/// The auth controller against a scripted API: the app must never show a
/// session it does not have, must store what the server issued, and must be
/// able to sign out even with no connectivity.
void main() {
  Map<String, dynamic> tokensJson({
    String access = 'access-1',
    String refresh = 'refresh-1',
  }) => <String, dynamic>{
    'accessToken': access,
    'refreshToken': refresh,
    'expiresIn': 900,
    'tokenType': 'Bearer',
  };

  Map<String, dynamic> accountJson({String plan = 'FREE'}) => <String, dynamic>{
    'id': 'acc-1',
    'phoneE164': '+251911234567',
    'onboarded': false,
    'createdAt': '2026-09-20T10:00:00.000Z',
    'plan': plan,
    'planValidUntil': null,
    'aiImprovementConsent': false,
    'activeSessions': 1,
  };

  /// A container wired to [client] with an in-memory token store.
  ProviderContainer containerWith({
    required FakeHttpClient client,
    TokenStore? store,
  }) {
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        authApiProvider.overrideWithValue(
          AuthApi(client: client, baseUrl: 'http://test'),
        ),
        tokenStoreProvider.overrideWithValue(store ?? InMemoryTokenStore()),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  /// Wait until the launch-time session check has finished.
  Future<AuthState> settled(ProviderContainer container) async {
    final AuthState current = container.read(authControllerProvider);
    if (!current.restoring) return current;
    final Completer<AuthState> done = Completer<AuthState>();
    final ProviderSubscription<AuthState> subscription = container.listen(
      authControllerProvider,
      (AuthState? previous, AuthState next) {
        if (!next.restoring && !done.isCompleted) done.complete(next);
      },
      fireImmediately: true,
    );
    final AuthState state = await done.future;
    subscription.close();
    return state;
  }

  test('starts signed out once the stored session is checked', () async {
    final ProviderContainer container = containerWith(
      client: FakeHttpClient(throws: true),
    );
    // The first state is "restoring": the app does not yet know.
    expect(container.read(authControllerProvider).restoring, isTrue);

    final AuthState state = await settled(container);
    expect(state.isSignedIn, isFalse);
    expect(state.stage, SignInStage.phone);
  });

  test('requesting a code moves to the code step with the normalized number',
      () async {
    final FakeHttpClient client = FakeHttpClient(
      statusCode: 202,
      body: <String, dynamic>{
        'phoneE164': '+251911234567',
        'expiresIn': 300,
        'resendAfter': 0,
      },
    );
    final ProviderContainer container = containerWith(client: client);
    await container
        .read(authControllerProvider.notifier)
        .requestCode('0911 23 45 67');

    final AuthState state = container.read(authControllerProvider);
    expect(state.stage, SignInStage.code);
    expect(state.phoneE164, '+251911234567');
    expect(state.requestingCode, isFalse);
    expect(state.errorMessage, isNull);
  });

  test('verifying stores the tokens the server issued and reports the account',
      () async {
    final FakeHttpClient client = FakeHttpClient(
      statusCode: 200,
      body: <String, dynamic>{
        'tokens': tokensJson(),
        'account': accountJson(plan: 'PREMIUM'),
        'created': false,
      },
    );
    final InMemoryTokenStore store = InMemoryTokenStore();
    final ProviderContainer container = containerWith(
      client: client,
      store: store,
    );
    final AuthController controller = container.read(
      authControllerProvider.notifier,
    );

    await controller.requestCode('0911234567');
    await controller.verifyCode('123456');

    final AuthState state = container.read(authControllerProvider);
    expect(state.isSignedIn, isTrue);
    expect(state.account!.plan, AccountPlan.premium);
    final SessionTokens? stored = await store.read();
    expect(stored!.accessToken, 'access-1');
    expect(stored.refreshToken, 'refresh-1');
  });

  test('a wrong code leaves the user signed out, with the server message',
      () async {
    final InMemoryTokenStore store = InMemoryTokenStore();
    final FakeHttpClient client = FakeHttpClient(
      router: (String path, Map<String, dynamic>? body, Map<String, String> _) {
        if (path == '/v1/auth/otp') {
          return const FakeReply(202, <String, dynamic>{
            'phoneE164': '+251911234567',
            'expiresIn': 300,
            'resendAfter': 0,
          });
        }
        return const FakeReply(401, <String, dynamic>{
          'error': <String, dynamic>{
            'code': 'OTP_INVALID',
            // The server counts the attempts down; that count is more useful
            // than any copy the app could write, so it is surfaced verbatim.
            'message': 'That code is not valid. 4 attempts left.',
            'requestId': 'r-1',
          },
        });
      },
    );
    final ProviderContainer container = containerWith(
      client: client,
      store: store,
    );
    final AuthController controller = container.read(
      authControllerProvider.notifier,
    );

    await controller.requestCode('0911234567');
    await controller.verifyCode('000000');

    final AuthState state = container.read(authControllerProvider);
    expect(state.isSignedIn, isFalse);
    expect(state.stage, SignInStage.code);
    expect(state.errorMessage, contains('4 attempts left'));
    expect(await store.read(), isNull);
  });

  test('an SMS-less server is reported in the app\'s own words', () async {
    final ProviderContainer container = containerWith(
      client: FakeHttpClient(
        statusCode: 503,
        body: <String, dynamic>{
          'error': <String, dynamic>{
            'code': 'SMS_UNAVAILABLE',
            'message': 'No SMS gateway is configured.',
            'requestId': 'r-1',
          },
        },
      ),
    );
    await container
        .read(authControllerProvider.notifier)
        .requestCode('0911234567');

    final AuthState state = container.read(authControllerProvider);
    expect(state.stage, SignInStage.phone);
    expect(state.errorMessage, contains('no SMS gateway is configured'));
    expect(state.isSignedIn, isFalse);
  });

  test('an expired access token is rotated once and the session continues',
      () async {
    final InMemoryTokenStore store = InMemoryTokenStore();
    await store.write(
      const SessionTokens(
        accessToken: 'expired',
        refreshToken: 'refresh-1',
        expiresInSeconds: 900,
      ),
    );
    bool refreshed = false;
    final FakeHttpClient client = FakeHttpClient(
      router: (String path, Map<String, dynamic>? body, Map<String, String> headers) {
        if (path == '/v1/auth/refresh') {
          refreshed = true;
          return const FakeReply(200, <String, dynamic>{
            'tokens': <String, dynamic>{
              'accessToken': 'access-rotated',
              'refreshToken': 'refresh-rotated',
              'expiresIn': 900,
              'tokenType': 'Bearer',
            },
          });
        }
        if (path == '/v1/me' && headers['Authorization'] != 'Bearer access-rotated') {
          return const FakeReply(401, <String, dynamic>{
            'error': <String, dynamic>{
              'code': 'TOKEN_EXPIRED',
              'message': 'Access token expired.',
              'requestId': 'r-1',
            },
          });
        }
        return FakeReply(200, accountJson());
      },
    );
    final ProviderContainer container = containerWith(
      client: client,
      store: store,
    );

    final AuthState state = await settled(container);

    expect(state.isSignedIn, isTrue);
    expect(refreshed, isTrue);
    final SessionTokens? stored = await store.read();
    expect(stored!.accessToken, 'access-rotated');
    expect(stored.refreshToken, 'refresh-rotated');
  });

  test('a session the server has revoked is cleared, not left unconfirmed',
      () async {
    final InMemoryTokenStore store = InMemoryTokenStore();
    await store.write(
      const SessionTokens(
        accessToken: 'a',
        refreshToken: 'r',
        expiresInSeconds: 900,
      ),
    );
    final ProviderContainer container = containerWith(
      client: FakeHttpClient(
        statusCode: 401,
        body: <String, dynamic>{
          'error': <String, dynamic>{
            'code': 'TOKEN_REUSED',
            'message': 'Token reuse detected.',
            'requestId': 'r-1',
          },
        },
      ),
      store: store,
    );

    final AuthState state = await settled(container);
    // Both the access token and its rotation were refused: the session is over,
    // so the dead tokens go rather than sitting there as "unconfirmed".
    expect(state.isSignedIn, isFalse);
    expect(state.sessionStored, isFalse);
    expect(state.errorMessage, contains('session ended'));
    expect(await store.read(), isNull);
  });

  test('a network failure keeps the session, unconfirmed', () async {
    final InMemoryTokenStore store = InMemoryTokenStore();
    await store.write(
      const SessionTokens(
        accessToken: 'a',
        refreshToken: 'r',
        expiresInSeconds: 900,
      ),
    );
    final ProviderContainer container = containerWith(
      client: FakeHttpClient(throws: true),
      store: store,
    );

    final AuthState state = await settled(container);
    expect(state.isSignedIn, isFalse);
    expect(
      state.isUnconfirmed,
      isTrue,
      reason: 'an offline device still has a session; saying otherwise would be '
          'false',
    );
    expect(await store.read(), isNotNull);
  });

  test('signOut clears the device even when the server cannot be reached',
      () async {
    final InMemoryTokenStore store = InMemoryTokenStore();
    await store.write(
      const SessionTokens(
        accessToken: 'a',
        refreshToken: 'r',
        expiresInSeconds: 900,
      ),
    );
    final ProviderContainer container = containerWith(
      client: FakeHttpClient(throws: true),
      store: store,
    );
    await settled(container);

    final bool endedOnServer = await container
        .read(authControllerProvider.notifier)
        .signOut();

    expect(endedOnServer, isFalse);
    expect(await store.read(), isNull);
    expect(container.read(authControllerProvider).isSignedIn, isFalse);
  });
}
