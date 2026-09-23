import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_mobile/data/services/token_store.dart';
import 'package:nourish_mobile/data/sources/auth_api_client.dart';
import 'package:nourish_mobile/features/auth/sign_in_screen.dart';
import 'package:nourish_mobile/features/profile/profile_screen.dart';
import 'package:nourish_mobile/l10n/strings.dart';
import 'package:nourish_mobile/providers.dart';
import 'package:nourish_mobile/router/routes.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

/// S3 sign-in through the real UI: the number goes to the server as typed, the
/// code is exchanged for a session, and every failure is stated instead of
/// leaving the user guessing.
void main() {
  Finder onScreen(Finder finder) =>
      find.descendant(of: find.byType(SignInScreen), matching: finder);

  /// A scripted server for the whole flow.
  FakeHttpClient happyServer() => FakeHttpClient(
    router: (String path, Map<String, dynamic>? body, Map<String, String> _) {
      if (path == '/v1/auth/otp') {
        return const FakeReply(202, <String, dynamic>{
          'phoneE164': '+251911234567',
          'expiresIn': 300,
          'resendAfter': 0,
        });
      }
      if (path == '/v1/auth/otp/verify') {
        return const FakeReply(200, <String, dynamic>{
          'tokens': <String, dynamic>{
            'accessToken': 'access-1',
            'refreshToken': 'refresh-1',
            'expiresIn': 900,
            'tokenType': 'Bearer',
          },
          'account': <String, dynamic>{
            'id': 'acc-1',
            'phoneE164': '+251911234567',
            'onboarded': true,
            'createdAt': '2026-09-20T10:00:00.000Z',
            'plan': 'FREE',
            'planValidUntil': null,
            'aiImprovementConsent': false,
            'activeSessions': 1,
          },
          'created': true,
        });
      }
      return const FakeReply(404, <String, dynamic>{});
    },
  );

  /// Pump the app with sign-in pointed at [client].
  Future<AppHarness> pumpWithServer(
    WidgetTester tester,
    FakeHttpClient client, {
    TokenStore? store,
  }) {
    return pumpApp(
      tester,
      profile: answerProfile(),
      overrides: <Override>[
        authApiProvider.overrideWithValue(
          AuthApi(client: client, baseUrl: 'http://test'),
        ),
        tokenStoreProvider.overrideWithValue(store ?? InMemoryTokenStore()),
      ],
    );
  }

  /// Reach the sign-in screen the way a user does: Profile tab → SIGN IN.
  Future<void> openSignIn(WidgetTester tester) async {
    await tester.tap(find.text(Strings.profileTab));
    await tester.pumpAndSettle();
    await tester.tap(find.text(Strings.accountSignInAction));
    await tester.pumpAndSettle();
  }

  testWidgets('a phone number is sent as typed and the code step follows',
      (WidgetTester tester) async {
    final FakeHttpClient client = happyServer();
    final AppHarness harness = await pumpWithServer(tester, client);

    await openSignIn(tester);

    expect(onScreen(find.text(Strings.signInSubtitle)), findsOneWidget);
    await tester.enterText(
      onScreen(find.byType(TextField)),
      '0911 23 45 67',
    );
    await tester.tap(onScreen(find.text(Strings.signInSendCode)));
    await tester.pumpAndSettle();

    // The server normalizes; the app sends what the user typed (AUTH-01).
    expect(client.requests.single.path, '/v1/auth/otp');
    expect(client.requests.single.body, <String, dynamic>{
      'phone': '0911 23 45 67',
    });
    // And the next step names the number the server decided.
    expect(
      onScreen(find.text(Strings.signInCodeSentTo('+251911234567'))),
      findsOneWidget,
    );

    await harness.teardown(tester);
  });

  testWidgets('a short number is refused before any request is made',
      (WidgetTester tester) async {
    final FakeHttpClient client = happyServer();
    final AppHarness harness = await pumpWithServer(tester, client);

    await openSignIn(tester);
    await tester.enterText(onScreen(find.byType(TextField)), '0911');
    await tester.tap(onScreen(find.text(Strings.signInSendCode)));
    await tester.pumpAndSettle();

    expect(onScreen(find.text(Strings.signInPhoneInvalid)), findsOneWidget);
    expect(
      client.requests,
      isEmpty,
      reason: 'the field is validated before anything is sent',
    );

    await harness.teardown(tester);
  });

  testWidgets('the code completes the sign-in and the account is shown',
      (WidgetTester tester) async {
    final FakeHttpClient client = happyServer();
    final InMemoryTokenStore store = InMemoryTokenStore();
    final AppHarness harness = await pumpWithServer(
      tester,
      client,
      store: store,
    );

    await openSignIn(tester);
    await tester.enterText(
      onScreen(find.byType(TextField)),
      '0911234567',
    );
    await tester.tap(onScreen(find.text(Strings.signInSendCode)));
    await tester.pumpAndSettle();

    await tester.enterText(onScreen(find.byType(TextField)), '123456');
    await tester.tap(onScreen(find.text(Strings.signInVerify)));
    await tester.pumpAndSettle();

    // The session was stored, and the account screen reports it.
    expect((await store.read())!.refreshToken, 'refresh-1');
    expect(find.byType(SignInScreen), findsNothing);
    expect(find.text('+251911234567'), findsOneWidget);
    expect(find.text(Strings.accountPlanFree), findsOneWidget);

    await harness.teardown(tester);
  });

  testWidgets('a rejected code is reported on the code step',
      (WidgetTester tester) async {
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
            'code': 'OTP_EXPIRED',
            'message': 'That code expired.',
            'requestId': 'r-1',
          },
        });
      },
    );
    final AppHarness harness = await pumpWithServer(tester, client);

    await openSignIn(tester);
    await tester.enterText(onScreen(find.byType(TextField)), '0911234567');
    await tester.tap(onScreen(find.text(Strings.signInSendCode)));
    await tester.pumpAndSettle();

    await tester.enterText(onScreen(find.byType(TextField)), '123456');
    await tester.tap(onScreen(find.text(Strings.signInVerify)));
    await tester.pumpAndSettle();

    expect(
      onScreen(find.text('That code expired. Ask for a new one.')),
      findsOneWidget,
    );
    expect(find.byType(SignInScreen), findsOneWidget);

    await harness.teardown(tester);
  });

  testWidgets('a server with no SMS gateway says so and stays on the number',
      (WidgetTester tester) async {
    final FakeHttpClient client = FakeHttpClient(
      statusCode: 503,
      body: <String, dynamic>{
        'error': <String, dynamic>{
          'code': 'SMS_UNAVAILABLE',
          'message': 'No SMS gateway is configured.',
          'requestId': 'r-1',
        },
      },
    );
    final AppHarness harness = await pumpWithServer(tester, client);

    await openSignIn(tester);
    await tester.enterText(onScreen(find.byType(TextField)), '0911234567');
    await tester.tap(onScreen(find.text(Strings.signInSendCode)));
    await tester.pumpAndSettle();

    expect(
      onScreen(find.textContaining('no SMS gateway is configured')),
      findsOneWidget,
    );
    // Still on the phone step, and honest about the local-only behaviour.
    expect(onScreen(find.text(Strings.signInSendCode)), findsOneWidget);
    expect(
      onScreen(find.text(Strings.signInLocalOnly)),
      findsOneWidget,
    );

    await harness.teardown(tester);
  });

  testWidgets('the account screen offers the way back to the number',
      (WidgetTester tester) async {
    final FakeHttpClient client = happyServer();
    final AppHarness harness = await pumpWithServer(tester, client);

    await openSignIn(tester);
    await tester.enterText(onScreen(find.byType(TextField)), '0911234567');
    await tester.tap(onScreen(find.text(Strings.signInSendCode)));
    await tester.pumpAndSettle();

    await tester.tap(onScreen(find.text(Strings.signInChangeNumber)));
    await tester.pumpAndSettle();

    expect(onScreen(find.text(Strings.signInSendCode)), findsOneWidget);

    await harness.teardown(tester);
  });

  testWidgets('signing out returns the account screen to the local-only state',
      (WidgetTester tester) async {
    final FakeHttpClient client = happyServer();
    final AppHarness harness = await pumpWithServer(tester, client);

    await openSignIn(tester);
    await tester.enterText(onScreen(find.byType(TextField)), '0911234567');
    await tester.tap(onScreen(find.text(Strings.signInSendCode)));
    await tester.pumpAndSettle();
    await tester.enterText(onScreen(find.byType(TextField)), '123456');
    await tester.tap(onScreen(find.text(Strings.signInVerify)));
    await tester.pumpAndSettle();

    // The backup panel sits between the account rows and the sign-out control,
    // and the account page is a lazy list: scroll it into existence.
    await tester.scrollUntilVisible(
      find.text(Strings.accountSignOutAction),
      200,
      scrollable: find
          .descendant(
            of: find.byType(ProfileScreen),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text(Strings.accountSignOutAction));
    await tester.pumpAndSettle();

    expect(find.text(Strings.accountSignedOutBody), findsOneWidget);
    expect(find.text('+251911234567'), findsNothing);

    await harness.teardown(tester);
  });

  testWidgets('sign-in is not reachable before onboarding finishes',
      (WidgetTester tester) async {
    // No profile: onboarding has not been completed on this install.
    final AppHarness harness = await pumpApp(tester);

    harness.router.go(AppRoutes.signIn);
    await tester.pumpAndSettle();

    expect(find.byType(SignInScreen), findsNothing);

    await harness.teardown(tester);
  });
}
