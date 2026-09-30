import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/data/models/sync_changes.dart';
import 'package:nourish_mobile/data/sources/auth_api_client.dart';
import 'package:nourish_mobile/data/sources/sync_api_client.dart';

import 'test_helpers.dart';

/// The pull half of OFF-02 at the transport level: the rows the server sends,
/// including the two things an apply step must not get wrong — the `clientId`
/// that identifies a row, and a tombstone that is a row rather than an absence.
void main() {
  Map<String, dynamic> changesBody() => <String, dynamic>{
    'meals': <dynamic>[
      <String, dynamic>{
        'clientId': 'dev1:meal:1',
        'dateKey': '2026-09-20',
        'slot': 'lunch',
        'loggedAt': '2026-09-20T12:00:00.000Z',
        'updatedAt': '2026-09-20T12:00:00.000Z',
        'deletedAt': null,
        'clientSeq': 0,
        'items': <dynamic>[
          <String, dynamic>{
            'clientId': 'dev1:item:1',
            'foodId': 'shiro_wot',
            'foodName': 'Shiro Wot',
            'portionUnit': 'cup',
            'portionQuantity': 1,
            'grams': 240,
            'kcal': 281,
            'proteinG': 12,
            'carbsG': 30,
            'fatG': 11,
            'fiberG': 6.5,
            'sodiumMg': 320,
          },
        ],
      },
      <String, dynamic>{
        'clientId': 'dev1:meal:2',
        'dateKey': '2026-09-19',
        'slot': 'dinner',
        'loggedAt': '2026-09-19T19:00:00.000Z',
        'updatedAt': '2026-09-20T09:00:00.000Z',
        // Removed on another device: a row, not an absence.
        'deletedAt': '2026-09-20T09:00:00.000Z',
        'clientSeq': 0,
        'items': <dynamic>[],
      },
    ],
    'water': <dynamic>[
      <String, dynamic>{
        'clientId': 'dev1:water:1',
        'dateKey': '2026-09-20',
        'amountMl': 250,
        'loggedAt': '2026-09-20T08:00:00.000Z',
        'updatedAt': '2026-09-20T08:00:00.000Z',
        'deletedAt': null,
      },
    ],
    'weight': <dynamic>[
      <String, dynamic>{
        'clientId': 'dev1:weight:1',
        'dateKey': '2026-09-20',
        'weightKg': 68.4,
        'loggedAt': '2026-09-20T07:00:00.000Z',
        'updatedAt': '2026-09-20T07:00:00.000Z',
        'deletedAt': null,
      },
    ],
    'serverTime': '2026-09-20T13:00:00.000Z',
  };

  test('reads every kind, with the ids and tombstones intact', () async {
    final FakeHttpClient client = FakeHttpClient(statusCode: 200, body: changesBody());
    final SyncApi api = SyncApi(client: client, baseUrl: 'http://test');

    final SyncChanges changes = await api.changes(accessToken: 'access-1');

    expect(changes.meals, hasLength(2));
    expect(changes.water, hasLength(1));
    expect(changes.weight, hasLength(1));
    expect(changes.length, 4);
    expect(changes.isEmpty, isFalse);
    expect(changes.serverTime, DateTime.parse('2026-09-20T13:00:00.000Z'));

    final RemoteChange meal = changes.meals.first;
    expect(meal.clientId, 'dev1:meal:1', reason: 'the id is the only link to a '
        'local row, so it must survive verbatim');
    expect(meal.slot, 'lunch');
    expect(meal.items.single.foodId, 'shiro_wot');
    expect(meal.items.single.kcal, 281);
    expect(meal.items.single.fiberG, 6.5);
    expect(meal.items.single.clientId, 'dev1:item:1');

    expect(changes.water.single.amountMl, 250);
    expect(changes.weight.single.weightKg, 68.4);

    // A tombstone is a row with deletedAt set, not a missing row.
    expect(changes.meals.last.isDeleted, isTrue);
    expect(changes.meals.first.isDeleted, isFalse);

    // The call is a bearer-authenticated GET with the documented query.
    final RecordedRequest request = client.requests.single;
    expect(request.method, 'GET');
    expect(request.path, '/v1/sync/changes');
    expect(request.headers['Authorization'], 'Bearer access-1');
  });

  test('a since cursor is sent as an ISO instant', () async {
    final FakeHttpClient client = FakeHttpClient(
      statusCode: 200,
      body: <String, dynamic>{
        'meals': <dynamic>[],
        'water': <dynamic>[],
        'weight': <dynamic>[],
        'serverTime': '2026-09-20T13:00:00.000Z',
      },
    );
    final SyncApi api = SyncApi(client: client, baseUrl: 'http://test');
    // The URL is built by hand rather than by Uri.replace, so assert the shape
    // the server parses rather than trusting the helper.
    await api.changes(
      accessToken: 'access-1',
      since: DateTime.parse('2026-09-20T12:00:00Z'),
      limit: 50,
    );

    final Map<String, String> query = client.requests.single.query;
    expect(query['since'], '2026-09-20T12:00:00.000Z');
    expect(query['limit'], '50');
  });

  test('an empty answer is empty, not an error', () async {
    final SyncApi api = SyncApi(
      client: FakeHttpClient(
        statusCode: 200,
        body: <String, dynamic>{
          'meals': <dynamic>[],
          'water': <dynamic>[],
          'weight': <dynamic>[],
        },
      ),
      baseUrl: 'http://test',
    );

    final SyncChanges changes = await api.changes(accessToken: 'access-1');
    expect(changes.isEmpty, isTrue);
    expect(
      changes.serverTime,
      isNull,
      reason: 'a missing cursor must not be invented: the caller would skip '
          'whatever arrived in between',
    );
  });

  test('a refused pull reports the server code', () async {
    final SyncApi api = SyncApi(
      client: FakeHttpClient(
        statusCode: 401,
        body: <String, dynamic>{
          'error': <String, dynamic>{
            'code': 'TOKEN_EXPIRED',
            'message': 'Access token expired.',
            'requestId': 'r-1',
          },
        },
      ),
      baseUrl: 'http://test',
    );

    await expectLater(
      api.changes(accessToken: 'stale'),
      throwsA(
        isA<AuthException>().having(
          (AuthException e) => e.code,
          'code',
          'TOKEN_EXPIRED',
        ),
      ),
    );
  });
}
