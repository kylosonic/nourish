// Manual live check for the S3 sync client (OFF-02).
//
// Not part of the test suite: it talks to a real API over a real socket, which
// is exactly what the suite must never do. It exists so the push wire shape can
// be checked against the running server instead of only against a fake — the
// place a mismatch would otherwise hide until a user's first backup.
//
//   # with the API running (SMS_PROVIDER=console) and Docker up:
//   dart run tool/auth_live_check.dart request +251911000123
//   # read the code from the API log, then:
//   dart run tool/sync_live_check.dart +251911000123 123456
//
// It signs in, pushes a meal, a water log, a weight entry and one deliberately
// incomplete meal (which the server must refuse per-operation), then reads the
// changes back so the stored rows can be compared with what was sent.

import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:nourish_domain/domain.dart';
import 'package:nourish_mobile/data/models/account_session.dart';
import 'package:nourish_mobile/data/models/sync_operation.dart';
import 'package:nourish_mobile/data/sources/auth_api_client.dart';
import 'package:nourish_mobile/data/sources/sync_api_client.dart';

Future<void> main(List<String> args) async {
  if (args.length < 2) {
    stderr.writeln('usage: sync_live_check.dart <phone> <code>');
    exit(64);
  }

  final String baseUrl =
      Platform.environment['NOURISH_API_BASE_URL'] ?? 'http://127.0.0.1:3000';
  final String phone = args[0];
  final String code = args[1];
  final AuthApi auth = AuthApi(baseUrl: baseUrl);
  final SyncApi sync = SyncApi(baseUrl: baseUrl);
  stdout.writeln('base=$baseUrl phone=$phone');

  try {
    final SignedInSession session = await auth.verifyOtp(
      phone: phone,
      code: code,
    );
    final String token = session.tokens.accessToken;
    stdout.writeln('signed in as ${session.account.phoneE164}');

    // A distinct device prefix per run, so repeated runs do not collide.
    final String device =
        'live${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}';
    final DateTime now = DateTime.now();

    final List<SyncOperation> queue = <SyncOperation>[
      SyncOperation(
        clientId: '$device:meal:1',
        kind: SyncKind.meal,
        op: SyncOp.upsert,
        updatedAt: now,
        loggedAt: now,
        dateKey: _key(now),
        slot: MealSlot.lunch,
        items: <SyncOperationItem>[
          SyncOperationItem(
            clientId: '$device:item:1',
            foodId: 'shiro_wot',
            foodName: 'Shiro Wot',
            portionUnit: 'cup',
            portionQuantity: 1,
            grams: 240,
            kcal: 281,
            proteinG: 12,
            carbsG: 30,
            fatG: 11,
            fiberG: 6.5,
            sodiumMg: 320,
          ),
        ],
      ),
      SyncOperation(
        clientId: '$device:water:1',
        kind: SyncKind.water,
        op: SyncOp.upsert,
        updatedAt: now,
        loggedAt: now,
        dateKey: _key(now),
        amountMl: 250,
      ),
      SyncOperation(
        clientId: '$device:weight:1',
        kind: SyncKind.weight,
        op: SyncOp.upsert,
        updatedAt: now,
        loggedAt: now,
        dateKey: _key(now),
        weightKg: 68.4,
      ),
      // Deliberately incomplete: a meal with no items must come back rejected,
      // and the other three must still be applied.
      SyncOperation(
        clientId: '$device:meal:2',
        kind: SyncKind.meal,
        op: SyncOp.upsert,
        updatedAt: now,
        loggedAt: now,
        dateKey: _key(now),
        slot: MealSlot.dinner,
      ),
    ];

    final SyncPushResult result = await sync.push(
      accessToken: token,
      operations: queue,
    );
    stdout.writeln('push: ${result.outcomes.length} outcomes, '
        '${result.applied} applied, ${result.rejected} rejected');
    for (final SyncPushOutcome outcome in result.outcomes) {
      stdout.writeln(
        '  ${outcome.clientId.split(':').sublist(1).join(':').padRight(10)} '
        '${outcome.outcome}${outcome.message == null ? '' : ' — ${outcome.message}'}',
      );
    }
    stdout.writeln('push serverTime: ${result.serverTime?.toIso8601String()}');

    // Read back what the server holds, using the same bearer token the app has.
    final http.Response changes = await http.get(
      Uri.parse('$baseUrl/v1/sync/changes?limit=50'),
      headers: <String, String>{'Authorization': 'Bearer $token'},
    );
    if (changes.statusCode != 200) {
      stdout.writeln('changes: HTTP ${changes.statusCode} ${changes.body}');
      exit(1);
    }
    final Map<String, dynamic> body =
        jsonDecode(changes.body) as Map<String, dynamic>;
    // The server answers three arrays: meals (each with its items), water and
    // weight.
    final List<dynamic> meals = (body['meals'] as List<dynamic>?) ?? <dynamic>[];
    final List<dynamic> water = (body['water'] as List<dynamic>?) ?? <dynamic>[];
    final List<dynamic> weight = (body['weight'] as List<dynamic>?) ?? <dynamic>[];

    final List<Map<String, dynamic>> mine = <Map<String, dynamic>>[
      for (final dynamic entry in meals)
        if (((entry as Map<String, dynamic>)['clientId'] ?? '')
            .toString()
            .startsWith(device))
          entry,
      for (final dynamic entry in <dynamic>[...water, ...weight])
        if (((entry as Map<String, dynamic>)['clientId'] ?? '')
            .toString()
            .startsWith(device))
          entry,
    ];
    stdout.writeln('changes: ${mine.length} rows from this run');
    for (final Map<String, dynamic> row in mine) {
      stdout.writeln(
        '  ${row['clientId']} dateKey=${row['dateKey']} '
        'value=${row['amountMl'] ?? row['weightKg'] ?? 'meal'} '
        'items=${(row['items'] as List<dynamic>?)?.length ?? 0}',
      );
    }

    final bool mealStored = mine.any(
      (Map<String, dynamic> row) => row['clientId'] == '$device:meal:1',
    );
    final bool waterStored = mine.any(
      (Map<String, dynamic> row) => row['clientId'] == '$device:water:1',
    );
    final bool weightStored = mine.any(
      (Map<String, dynamic> row) => row['clientId'] == '$device:weight:1',
    );
    final bool incompleteRefused = result.outcomes.any(
      (SyncPushOutcome outcome) =>
          outcome.clientId == '$device:meal:2' && outcome.isRejected,
    );

    stdout.writeln(
      'meal=$mealStored water=$waterStored weight=$weightStored '
      'incomplete-refused=$incompleteRefused',
    );
    stdout.writeln(
      mealStored && waterStored && weightStored && incompleteRefused
          ? 'result: PASS'
          : 'result: FAIL',
    );
    await auth.logout(session.tokens.refreshToken);
    exit(mealStored && waterStored && weightStored && incompleteRefused ? 0 : 1);
  } on AuthException catch (error) {
    stdout.writeln('refused: ${error.code} — ${error.message}');
    exit(1);
  }
}

/// The device's own `yyyy-MM-dd` key for an instant.
String _key(DateTime at) {
  final String month = at.month.toString().padLeft(2, '0');
  final String day = at.day.toString().padLeft(2, '0');
  return '${at.year}-$month-$day';
}
