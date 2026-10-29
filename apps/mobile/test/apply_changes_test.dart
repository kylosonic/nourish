import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_mobile/data/models/sync_changes.dart';
import 'package:nourish_mobile/features/sync/apply_changes.dart';

/// The apply rules, pinned without a database.
///
/// These are the rules that decide whether a restore creates, overwrites or
/// deletes a user's own logged data, so each one is named and asserted rather
/// than inferred from the code that happens to call it.
void main() {
  const String device = 'dev1';

  RemoteChange remote({
    required String clientId,
    String updatedAt = '2026-09-20T12:00:00.000Z',
    String? deletedAt,
    int? amountMl,
  }) {
    return RemoteChange(
      clientId: clientId,
      dateKey: '2026-09-20',
      updatedAt: DateTime.parse(updatedAt),
      loggedAt: DateTime.parse(updatedAt),
      deletedAt: deletedAt == null ? null : DateTime.parse(deletedAt),
      amountMl: amountMl,
    );
  }

  SyncChanges changesOf(List<RemoteChange> rows) => SyncChanges(
    meals: const <RemoteChange>[],
    water: rows,
    weight: const <RemoteChange>[],
  );

  LocalIdentity identity({
    Set<String> known = const <String>{},
    Map<String, DateTime> updatedAt = const <String, DateTime>{},
  }) => LocalIdentity(knownClientIds: known, updatedAtByClientId: updatedAt);

  group('identity comes from the id this device minted', () {
    test('a row with this device prefix yields its local row id', () {
      expect(localRowIdFromClientId('dev1:water:42', device), 42);
    });

    test('another device\'s row yields nothing to match against', () {
      expect(localRowIdFromClientId('other:water:42', device), isNull);
    });

    test('a malformed id yields nothing rather than a wrong row', () {
      expect(localRowIdFromClientId('dev1:water', device), isNull);
      expect(localRowIdFromClientId('dev1:water:notanumber', device), isNull);
      expect(localRowIdFromClientId('', device), isNull);
    });
  });

  group('rows the device has never seen', () {
    test('a live row is inserted', () {
      final List<ApplyDecision> plan = decideApply(
        changes: changesOf(<RemoteChange>[
          remote(clientId: 'other:water:1', amountMl: 250),
        ]),
        local: LocalIdentity.empty,
        devicePrefix: device,
      );

      expect(plan.single.action, ApplyAction.insert);
      expect(
        plan.single.localRowId,
        isNull,
        reason: 'a row created elsewhere has no local row to point at',
      );
    });

    test('a tombstone for a row never held here is ignored, not an error', () {
      final List<ApplyDecision> plan = decideApply(
        changes: changesOf(<RemoteChange>[
          remote(
            clientId: 'other:water:1',
            deletedAt: '2026-09-20T13:00:00.000Z',
          ),
        ]),
        local: LocalIdentity.empty,
        devicePrefix: device,
      );

      expect(plan.single.action, ApplyAction.ignore);
    });
  });

  group('last write wins on the device clock', () {
    final DateTime localTime = DateTime.parse('2026-09-20T12:00:00.000Z');

    test('a newer remote row updates the local one', () {
      final List<ApplyDecision> plan = decideApply(
        changes: changesOf(<RemoteChange>[
          remote(
            clientId: 'dev1:water:7',
            updatedAt: '2026-09-20T14:00:00.000Z',
            amountMl: 500,
          ),
        ]),
        local: identity(
          known: <String>{'dev1:water:7'},
          updatedAt: <String, DateTime>{'dev1:water:7': localTime},
        ),
        devicePrefix: device,
      );

      expect(plan.single.action, ApplyAction.update);
      expect(plan.single.localRowId, 7);
    });

    test('an older remote row is skipped so the device edit survives', () {
      final List<ApplyDecision> plan = decideApply(
        changes: changesOf(<RemoteChange>[
          remote(
            clientId: 'dev1:water:7',
            updatedAt: '2026-09-20T09:00:00.000Z',
          ),
        ]),
        local: identity(
          known: <String>{'dev1:water:7'},
          updatedAt: <String, DateTime>{'dev1:water:7': localTime},
        ),
        devicePrefix: device,
      );

      expect(plan.single.action, ApplyAction.skipNewerLocal);
    });

    test('an identical timestamp is treated as already held', () {
      final List<ApplyDecision> plan = decideApply(
        changes: changesOf(<RemoteChange>[remote(clientId: 'dev1:water:7')]),
        local: identity(
          known: <String>{'dev1:water:7'},
          updatedAt: <String, DateTime>{'dev1:water:7': localTime},
        ),
        devicePrefix: device,
      );

      expect(
        plan.single.action,
        ApplyAction.skipNewerLocal,
        reason: 'replaying the same pull must not rewrite the row',
      );
    });

    test('a newer tombstone removes the local row', () {
      final List<ApplyDecision> plan = decideApply(
        changes: changesOf(<RemoteChange>[
          remote(
            clientId: 'dev1:water:7',
            updatedAt: '2026-09-20T15:00:00.000Z',
            deletedAt: '2026-09-20T15:00:00.000Z',
          ),
        ]),
        local: identity(
          known: <String>{'dev1:water:7'},
          updatedAt: <String, DateTime>{'dev1:water:7': localTime},
        ),
        devicePrefix: device,
      );

      expect(plan.single.action, ApplyAction.remove);
      expect(plan.single.localRowId, 7);
    });

    test('an older tombstone does not remove a newer local row', () {
      final List<ApplyDecision> plan = decideApply(
        changes: changesOf(<RemoteChange>[
          remote(
            clientId: 'dev1:water:7',
            updatedAt: '2026-09-20T09:00:00.000Z',
            deletedAt: '2026-09-20T09:00:00.000Z',
          ),
        ]),
        local: identity(
          known: <String>{'dev1:water:7'},
          updatedAt: <String, DateTime>{'dev1:water:7': localTime},
        ),
        devicePrefix: device,
      );

      expect(plan.single.action, ApplyAction.skipNewerLocal);
    });
  });

  group('the plan is a pure function of its inputs', () {
    test('every kind is planned, in a stable order', () {
      final SyncChanges changes = SyncChanges(
        meals: <RemoteChange>[remote(clientId: 'dev1:meal:1')],
        water: <RemoteChange>[remote(clientId: 'dev1:water:1')],
        weight: <RemoteChange>[remote(clientId: 'dev1:weight:1')],
      );

      final List<ApplyDecision> plan = decideApply(
        changes: changes,
        local: LocalIdentity.empty,
        devicePrefix: device,
      );

      expect(plan.map((ApplyDecision d) => d.change.clientId).toList(), <String>[
        'dev1:meal:1',
        'dev1:water:1',
        'dev1:weight:1',
      ]);
      expect(plan.every((ApplyDecision d) => d.action == ApplyAction.insert), isTrue);
    });

    test('an empty answer plans nothing at all', () {
      final List<ApplyDecision> plan = decideApply(
        changes: const SyncChanges(
          meals: <RemoteChange>[],
          water: <RemoteChange>[],
          weight: <RemoteChange>[],
        ),
        local: LocalIdentity.empty,
        devicePrefix: device,
      );

      expect(plan, isEmpty);
      expect(ApplySummary.of(plan).didNothing, isTrue);
    });
  });

  group('the summary says what a restore will do', () {
    test('counts each kind of decision and ignores the no-ops', () {
      final List<ApplyDecision> plan = <ApplyDecision>[
        ApplyDecision(
          action: ApplyAction.insert,
          change: remote(clientId: 'other:water:1'),
        ),
        ApplyDecision(
          action: ApplyAction.update,
          change: remote(clientId: 'dev1:water:2'),
        ),
        ApplyDecision(
          action: ApplyAction.remove,
          change: remote(clientId: 'dev1:water:3'),
        ),
        ApplyDecision(
          action: ApplyAction.skipNewerLocal,
          change: remote(clientId: 'dev1:water:4'),
        ),
        ApplyDecision(
          action: ApplyAction.ignore,
          change: remote(clientId: 'other:water:5'),
        ),
      ];

      final ApplySummary summary = ApplySummary.of(plan);
      expect(summary.inserted, 1);
      expect(summary.updated, 1);
      expect(summary.removed, 1);
      expect(summary.kept, 1);
      expect(summary.totalChanges, 3);
      expect(summary.didNothing, isFalse);
    });
  });
}
