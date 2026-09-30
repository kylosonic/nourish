import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/data/services/token_store.dart';
import 'package:nourish_mobile/data/sources/auth_api_client.dart';
import 'package:nourish_mobile/data/sources/sync_api_client.dart';
import 'package:nourish_mobile/features/profile/profile_screen.dart';
import 'package:nourish_mobile/l10n/strings.dart';
import 'package:nourish_mobile/providers.dart';

import '../pump_app.dart';
import '../test_helpers.dart';
import 'seed_helpers.dart';

/// OFF-02 through the UI: the account screen shows what is actually waiting,
/// backs it up when asked, and never claims a backup that did not happen.
void main() {
  Finder onScreen(Finder finder) =>
      find.descendant(of: find.byType(ProfileScreen), matching: finder);

  Map<String, dynamic> accountJson() => <String, dynamic>{
    'id': 'acc-1',
    'phoneE164': '+251911234567',
    'onboarded': true,
    'createdAt': '2026-09-20T10:00:00.000Z',
    'plan': 'FREE',
    'planValidUntil': null,
    'aiImprovementConsent': false,
    'activeSessions': 1,
  };

  /// A server that signs a session in and accepts pushes.
  FakeHttpClient server({bool rejectPush = false}) => FakeHttpClient(
    router: (String path, Map<String, dynamic>? body, Map<String, String> _) {
      if (path == '/v1/me') return FakeReply(200, accountJson());
      if (path == '/v1/auth/otp') {
        return const FakeReply(202, <String, dynamic>{
          'phoneE164': '+251911234567',
          'expiresIn': 300,
          'resendAfter': 0,
        });
      }
      if (path == '/v1/auth/otp/verify') {
        return FakeReply(200, <String, dynamic>{
          'tokens': <String, dynamic>{
            'accessToken': 'access-1',
            'refreshToken': 'refresh-1',
            'expiresIn': 900,
            'tokenType': 'Bearer',
          },
          'account': accountJson(),
          'created': false,
        });
      }
      if (path == '/v1/sync') {
        final List<dynamic> operations =
            (body?['operations'] as List<dynamic>?) ?? <dynamic>[];
        // The server's real shape: applied outcomes in one array, refusals with
        // a `reason` in the other.
        return FakeReply(200, <String, dynamic>{
          'applied': rejectPush
              ? <Map<String, dynamic>>[]
              : operations
                    .map(
                      (dynamic op) => <String, dynamic>{
                        'clientId': (op as Map<String, dynamic>)['clientId'],
                        'kind': op['kind'],
                        'outcome': 'applied',
                      },
                    )
                    .toList(),
          'rejected': rejectPush
              ? operations
                    .map(
                      (dynamic op) => <String, dynamic>{
                        'clientId': (op as Map<String, dynamic>)['clientId'],
                        'kind': op['kind'],
                        'reason': 'a meal needs at least one item',
                      },
                    )
                    .toList()
              : <Map<String, dynamic>>[],
          'serverTime': '2026-09-20T12:00:00.000Z',
        });
      }
      if (path == '/v1/auth/logout') return const FakeReply(204);
      return const FakeReply(404, <String, dynamic>{});
    },
  );

  Future<AppHarness> pumpInstall(
    WidgetTester tester, {
    required FakeHttpClient client,
    TokenStore? store,
  }) async {
    final AppDatabase db = await openSeededDb();
    final UserProfile answers = answerProfile();
    return pumpApp(
      tester,
      profile: answers,
      db: db,
      overrides: <Override>[
        authApiProvider.overrideWithValue(
          AuthApi(client: client, baseUrl: 'http://test'),
        ),
        syncApiProvider.overrideWithValue(
          SyncApi(client: client, baseUrl: 'http://test'),
        ),
        tokenStoreProvider.overrideWithValue(store ?? InMemoryTokenStore()),
      ],
    );
  }

  /// Log one meal, so there is something in the queue.
  Future<void> logMeal(AppDatabase db) => MealRepository(db).saveMeal(
    MealSlot.lunch,
    <MealItemDraft>[
      MealItemDraft(
        food: testFood(id: 'panel_food', name: 'Panel Food', kcal: 400),
        unit: PortionUnit.grams,
        quantity: 1,
      ),
    ],
    dateKey: '2026-09-20',
  );

  Future<void> openProfile(WidgetTester tester) async {
    await tester.tap(find.text(Strings.profileTab));
    await tester.pumpAndSettle();
  }

  Future<void> scrollTo(WidgetTester tester, Finder finder) async {
    await tester.scrollUntilVisible(
      finder,
      200,
      scrollable: find
          .descendant(
            of: find.byType(ProfileScreen),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await tester.pumpAndSettle();
  }

  testWidgets('signed out, the panel says the data stays on the device',
      (WidgetTester tester) async {
    final AppHarness harness = await pumpInstall(tester, client: server());
    await logMeal(harness.db);

    await openProfile(tester);

    expect(onScreen(find.text(Strings.syncTitle)), findsOneWidget);
    expect(
      onScreen(find.text(Strings.syncPendingSignedOut(1))),
      findsOneWidget,
      reason: 'a queued change with no account is a reason to sign in rather '
          'than a failure, and the count is the user\'s own data',
    );

    await harness.teardown(tester);
  });

  testWidgets('queued changes are counted, then backed up on request',
      (WidgetTester tester) async {
    final FakeHttpClient client = server();
    final AppHarness harness = await pumpInstall(tester, client: client);
    await logMeal(harness.db);
    await logMeal(harness.db);

    await openProfile(tester);
    await scrollTo(tester, find.text(Strings.syncNowAction));
    expect(
      onScreen(find.text(Strings.syncPendingSignedOut(2))),
      findsOneWidget,
      reason: 'the queue is the source of truth for the count',
    );

    // The panel is only reachable signed in; sign in first, then back up.
    await scrollTo(tester, find.text(Strings.accountSignInAction));
    await tester.tap(find.text(Strings.accountSignInAction));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).last, '0911234567');
    await tester.tap(find.text(Strings.signInSendCode));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).last, '123456');
    await tester.tap(find.text(Strings.signInVerify));
    await tester.pumpAndSettle();

    await scrollTo(tester, find.text(Strings.syncNowAction));
    await tester.tap(find.text(Strings.syncNowAction));
    await tester.pumpAndSettle();

    expect(onScreen(find.text(Strings.syncDone(2))), findsOneWidget);
    // The queue really is empty afterwards.
    expect(
      client.requests.where((RecordedRequest r) => r.path == '/v1/sync'),
      hasLength(1),
    );

    await harness.teardown(tester);
  });

  testWidgets('a refused change is reported and stays queued',
      (WidgetTester tester) async {
    final FakeHttpClient client = server(rejectPush: true);
    final AppHarness harness = await pumpInstall(tester, client: client);
    await logMeal(harness.db);

    await openProfile(tester);
    await scrollTo(tester, find.text(Strings.accountSignInAction));
    await tester.tap(find.text(Strings.accountSignInAction));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).last, '0911234567');
    await tester.tap(find.text(Strings.signInSendCode));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).last, '123456');
    await tester.tap(find.text(Strings.signInVerify));
    await tester.pumpAndSettle();

    await scrollTo(tester, find.text(Strings.syncNowAction));
    await tester.tap(find.text(Strings.syncNowAction));
    await tester.pumpAndSettle();

    expect(
      onScreen(find.textContaining('refused 1 change')),
      findsOneWidget,
    );
    // Still waiting, and still counted.
    expect(onScreen(find.text(Strings.syncRefused(1))), findsOneWidget);
    expect(onScreen(find.text(Strings.syncPendingCount(1))), findsNothing);

    await harness.teardown(tester);
  });
}


