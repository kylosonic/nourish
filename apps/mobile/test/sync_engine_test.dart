import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/models/account_session.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/data/repositories/sync_queue_repository.dart';
import 'package:nourish_mobile/data/services/token_store.dart';
import 'package:nourish_mobile/data/sources/auth_api_client.dart';
import 'package:nourish_mobile/data/sources/sync_api_client.dart';
import 'package:nourish_mobile/features/auth/auth_controller.dart';
import 'package:nourish_mobile/features/sync/sync_controller.dart';
import 'package:nourish_mobile/providers.dart';

import 'test_helpers.dart';
import 'widget/seed_helpers.dart';

/// OFF-02: the push engine. It must never lose a queued change, never claim a
/// change was backed up when the server refused it, and never touch the local
/// tables — the device's own records are the working copy.
void main() {
  late AppDatabase db;
  late InMemoryTokenStore store;

  setUp(() async {
    db = await openSeededDb();
    store = InMemoryTokenStore();
    await store.write(
      const SessionTokens(
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresInSeconds: 900,
      ),
    );
  });

  tearDown(() async => db.close());

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

  /// A server that answers `/v1/me` and pushes with [outcomes].
  ///
  /// The reply uses the server's real two-array shape (`applied` plus
  /// `rejected` with a `reason`): a fake that puts refusals in `applied` would
  /// hide exactly the bug the live check found.
  FakeHttpClient server({
    List<Map<String, dynamic>> Function(List<dynamic> operations)? outcomes,
    List<Map<String, dynamic>> Function(List<dynamic> operations)? rejections,
    bool meExpired = false,
  }) {
    bool meCalled = false;
    return FakeHttpClient(
      router: (String path, Map<String, dynamic>? body, Map<String, String> headers) {
        if (path == '/v1/me') {
          if (meExpired && !meCalled) {
            meCalled = true;
            return const FakeReply(401, <String, dynamic>{
              'error': <String, dynamic>{
                'code': 'TOKEN_EXPIRED',
                'message': 'Access token expired.',
                'requestId': 'r-1',
              },
            });
          }
          return FakeReply(200, accountJson());
        }
        if (path == '/v1/auth/refresh') {
          return const FakeReply(200, <String, dynamic>{
            'tokens': <String, dynamic>{
              'accessToken': 'access-rotated',
              'refreshToken': 'refresh-rotated',
              'expiresIn': 900,
              'tokenType': 'Bearer',
            },
          });
        }
        if (path == '/v1/sync') {
          final List<dynamic> operations =
              (body?['operations'] as List<dynamic>?) ?? <dynamic>[];
          return FakeReply(200, <String, dynamic>{
            'applied': outcomes != null
                ? outcomes(operations)
                : operations
                      .map(
                        (dynamic op) => <String, dynamic>{
                          'clientId': (op as Map<String, dynamic>)['clientId'],
                          'kind': op['kind'],
                          'outcome': 'applied',
                        },
                      )
                      .toList(),
            'rejected': rejections == null
                ? <Map<String, dynamic>>[]
                : rejections(operations),
            'serverTime': '2026-09-20T12:00:00.000Z',
          });
        }
        return const FakeReply(404, <String, dynamic>{});
      },
    );
  }

  /// A container with the scripted server, and the launch-time session check
  /// already finished so the controller knows whether it is signed in.
  Future<ProviderContainer> signedInContainer(FakeHttpClient client) async {
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        driftDatabaseProvider.overrideWithValue(db),
        authApiProvider.overrideWithValue(
          AuthApi(client: client, baseUrl: 'http://test'),
        ),
        syncApiProvider.overrideWithValue(
          SyncApi(client: client, baseUrl: 'http://test'),
        ),
        tokenStoreProvider.overrideWithValue(store),
      ],
    );
    addTearDown(container.dispose);

    // Reading the notifier starts the restore; wait for it to settle.
    final AuthState current = container.read(authControllerProvider);
    if (current.restoring) {
      final Completer<AuthState> done = Completer<AuthState>();
      final ProviderSubscription<AuthState> subscription = container.listen(
        authControllerProvider,
        (AuthState? previous, AuthState next) {
          if (!next.restoring && !done.isCompleted) done.complete(next);
        },
        fireImmediately: true,
      );
      await done.future;
      subscription.close();
    }
    return container;
  }

  Future<Meal> logMeal({double kcal = 500}) => MealRepository(db).saveMeal(
    MealSlot.lunch,
    <MealItemDraft>[
      MealItemDraft(
        food: testFood(id: 'engine_food', name: 'Engine Food', kcal: kcal),
        unit: PortionUnit.grams,
        quantity: 1,
      ),
    ],
    dateKey: '2026-09-20',
  );

  test('a queued change is pushed and then forgotten', () async {
    await logMeal();
    await logMeal(kcal: 600);
    final FakeHttpClient client = server();
    final ProviderContainer container = await signedInContainer(client);

    final int applied = await container
        .read(syncControllerProvider.notifier)
        .syncNow();

    expect(applied, 2);
    expect(await SyncQueueRepository(db).pendingCount(), 0);
    expect(container.read(syncControllerProvider).stage, SyncStage.synced);
    // The push carried the wire body, including the meal's items.
    final Map<String, dynamic> body = client.requests
        .firstWhere((RecordedRequest r) => r.path == '/v1/sync')
        .body!;
    final List<dynamic> operations = body['operations'] as List<dynamic>;
    expect(operations, hasLength(2));
    final Map<String, dynamic> first = operations.first as Map<String, dynamic>;
    expect(first['kind'], 'meal');
    expect((first['items'] as List<dynamic>).single, isA<Map<String, dynamic>>());
  });

  test('the local records are untouched by a push', () async {
    await logMeal(kcal: 700);
    final FakeHttpClient client = server();
    final ProviderContainer container = await signedInContainer(client);

    await container.read(syncControllerProvider.notifier).syncNow();

    final List<Meal> meals = await MealRepository(db).allMeals();
    expect(meals, hasLength(1));
    expect(meals.single.items.single.snapshot.kcal, 700);
  });

  test('a refusal keeps the change queued and says so', () async {
    await logMeal();
    final FakeHttpClient client = server(
      outcomes: (List<dynamic> _) => <Map<String, dynamic>>[],
      rejections: (List<dynamic> operations) => <Map<String, dynamic>>[
        <String, dynamic>{
          'clientId': (operations.single as Map<String, dynamic>)['clientId'],
          'kind': 'meal',
          'reason': 'a meal needs at least one item',
        },
      ],
    );
    final ProviderContainer container = await signedInContainer(client);

    await container.read(syncControllerProvider.notifier).syncNow();

    final SyncState state = container.read(syncControllerProvider);
    expect(state.stage, SyncStage.failed);
    expect(state.rejected, 1);
    expect(state.message, contains('refused 1 change'));
    // The operation is kept, with its reason, rather than dropped.
    final List<QueuedOperation> pending = await SyncQueueRepository(db).pending();
    expect(pending, hasLength(1));
    expect(pending.single.lastError, 'a meal needs at least one item');
    expect(pending.single.attempts, 1);
  });

  test('an operation the server already had is not retried forever', () async {
    await logMeal();
    final FakeHttpClient client = server(
      outcomes: (List<dynamic> operations) => <Map<String, dynamic>>[
        <String, dynamic>{
          'clientId': (operations.single as Map<String, dynamic>)['clientId'],
          'kind': 'meal',
          // The server holds something at least as new: retrying is pointless,
          // and it is not a failure.
          'outcome': 'ignored-stale',
        },
      ],
    );
    final ProviderContainer container = await signedInContainer(client);

    await container.read(syncControllerProvider.notifier).syncNow();

    expect(await SyncQueueRepository(db).pendingCount(), 0);
    expect(container.read(syncControllerProvider).stage, SyncStage.synced);
  });

  test('an operation the server did not answer for stays queued', () async {
    await logMeal();
    final FakeHttpClient client = server(
      outcomes: (List<dynamic> _) => <Map<String, dynamic>>[],
    );
    final ProviderContainer container = await signedInContainer(client);

    await container.read(syncControllerProvider.notifier).syncNow();

    expect(
      await SyncQueueRepository(db).pendingCount(),
      1,
      reason: 'silence is not acceptance',
    );
  });

  test('a transport failure reports the reason and keeps the queue', () async {
    await logMeal();
    final FakeHttpClient client = FakeHttpClient(throws: true);
    final ProviderContainer container = await signedInContainer(client);

    await container.read(syncControllerProvider.notifier).syncNow();

    final SyncState state = container.read(syncControllerProvider);
    expect(state.stage, SyncStage.failed);
    expect(state.message, isNotNull);
    expect(await SyncQueueRepository(db).pendingCount(), 1);
  });

  test('an expired access token is refreshed before pushing', () async {
    await logMeal();
    final FakeHttpClient client = server(meExpired: true);
    final ProviderContainer container = await signedInContainer(client);

    final int applied = await container
        .read(syncControllerProvider.notifier)
        .syncNow();

    expect(applied, 1);
    // The push used the rotated token, not the expired one.
    final RecordedRequest push = client.requests.firstWhere(
      (RecordedRequest r) => r.path == '/v1/sync',
    );
    expect(push.headers['Authorization'], 'Bearer access-rotated');
    expect((await store.read())!.accessToken, 'access-rotated');
  });

  test('signed out, the queue simply waits', () async {
    await logMeal();
    // No stored session at all.
    await store.clear();
    final FakeHttpClient client = server();
    final ProviderContainer container = await signedInContainer(client);

    final int applied = await container
        .read(syncControllerProvider.notifier)
        .syncNow();

    expect(applied, 0);
    expect(container.read(syncControllerProvider).stage, SyncStage.signedOut);
    expect(
      await SyncQueueRepository(db).pendingCount(),
      1,
      reason: 'a meal logged before signing in is still backed up later',
    );
  });
}
