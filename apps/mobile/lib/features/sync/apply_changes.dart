/// Deciding what to do with the server's rows, without touching a database.
///
/// This is the delicate half of OFF-02: push only sends what the device already
/// wrote, while apply writes into the tables the user is logging into. Keeping
/// the decision pure is what makes the rules testable without a database, and
/// what stops "we'll figure out the merge in the transaction" from becoming the
/// design.
///
/// Three rules, each matching the server's own behaviour:
///
/// 1. **Identity.** A remote row is recognisable by the `clientId` this device
///    minted: `<12-char device id>:<table>:<row id>`. A row carrying this
///    device's prefix is matched to a local row by parsing that id, so no
///    identity column is needed. A row from another device has no local
///    counterpart and is inserted once — the cursor, advanced in the same
///    transaction as the insert, is what stops it being inserted twice.
/// 2. **Tombstones.** A row with `deletedAt` set is an instruction to remove,
///    not an absence. A tombstone for something this device never had is
///    ignored rather than treated as an error.
/// 3. **Authority.** The server merges on the device clock (last write wins), so
///    the device applies the same rule: newer remote wins, older remote is
///    skipped and left for this device's own push to carry.
library;

import '../../data/models/sync_changes.dart';

/// What to do with one remote row.
enum ApplyAction {
  /// The device has never had this row: create it.
  insert,

  /// The device has it and the server's version is newer: take the server's.
  update,

  /// The server says it is gone: remove the local copy.
  remove,

  /// The device's own version is at least as new: leave it alone. The push half
  /// owns sending it, so applying the older remote copy would lose the edit.
  skipNewerLocal,

  /// Nothing to do: a tombstone for a row this device never held.
  ignore,
}

/// One decision, with the row it is about.
class ApplyDecision {
  const ApplyDecision({
    required this.action,
    required this.change,
    this.localRowId,
  });

  final ApplyAction action;
  final RemoteChange change;

  /// The local row the change refers to, when it could be determined from the
  /// `clientId` (this device's rows only). Null for rows created elsewhere.
  final int? localRowId;

  bool get writes => action != ApplyAction.ignore && action != ApplyAction.skipNewerLocal;
}

/// What the device already holds, as the decision needs it.
class LocalIdentity {
  const LocalIdentity({
    required this.knownClientIds,
    required this.updatedAtByClientId,
  });

  /// `clientId`s this device already has a row for, including rows it restored
  /// from another device.
  final Set<String> knownClientIds;

  /// The local last-write time for those rows, keyed by the same ids.
  final Map<String, DateTime> updatedAtByClientId;

  static const LocalIdentity empty = LocalIdentity(
    knownClientIds: <String>{},
    updatedAtByClientId: <String, DateTime>{},
  );
}

/// The local row id encoded in [clientId], when the id belongs to [devicePrefix].
///
/// The scheme is `<device>:<table>:<rowId>`; anything else (another device's row,
/// or a malformed id) returns null and is treated as a row from elsewhere.
int? localRowIdFromClientId(String clientId, String devicePrefix) {
  final List<String> parts = clientId.split(':');
  if (parts.length != 3) return null;
  if (parts[0] != devicePrefix) return null;
  return int.tryParse(parts[2]);
}

/// Decide, for every row the server sent, what the device should do.
///
/// Pure: the same (changes, identity, prefix) always produce the same decisions
/// in the same order, which is what lets the merge rules be pinned by tests.
List<ApplyDecision> decideApply({
  required SyncChanges changes,
  required LocalIdentity local,
  required String devicePrefix,
}) {
  return <ApplyDecision>[
    for (final RemoteChange change in <RemoteChange>[
      ...changes.meals,
      ...changes.water,
      ...changes.weight,
    ])
      _decide(change, local, devicePrefix),
  ];
}

ApplyDecision _decide(
  RemoteChange change,
  LocalIdentity local,
  String devicePrefix,
) {
  final int? localRowId = localRowIdFromClientId(change.clientId, devicePrefix);
  final bool known = local.knownClientIds.contains(change.clientId) ||
      (localRowId != null && local.knownClientIds.contains(change.clientId));

  if (change.isDeleted) {
    // A tombstone for something never held here is not an error: the delete
    // happened before this device existed, or already applied.
    if (!known) {
      return ApplyDecision(
        action: ApplyAction.ignore,
        change: change,
        localRowId: localRowId,
      );
    }
    final DateTime? localUpdatedAt = local.updatedAtByClientId[change.clientId];
    if (localUpdatedAt != null && localUpdatedAt.isAfter(change.updatedAt)) {
      return ApplyDecision(
        action: ApplyAction.skipNewerLocal,
        change: change,
        localRowId: localRowId,
      );
    }
    return ApplyDecision(
      action: ApplyAction.remove,
      change: change,
      localRowId: localRowId,
    );
  }

  if (!known) {
    return ApplyDecision(
      action: ApplyAction.insert,
      change: change,
      localRowId: localRowId,
    );
  }

  final DateTime? localUpdatedAt = local.updatedAtByClientId[change.clientId];
  // Equal timestamps are treated as "already have it": re-applying the same row
  // must not rewrite it, which is what makes a replayed pull a no-op.
  if (localUpdatedAt != null && !change.updatedAt.isAfter(localUpdatedAt)) {
    return ApplyDecision(
      action: ApplyAction.skipNewerLocal,
      change: change,
      localRowId: localRowId,
    );
  }
  return ApplyDecision(
    action: ApplyAction.update,
    change: change,
    localRowId: localRowId,
  );
}

/// A one-line summary of what a plan will do, for the account screen.
class ApplySummary {
  const ApplySummary({
    required this.inserted,
    required this.updated,
    required this.removed,
    required this.kept,
  });

  factory ApplySummary.of(List<ApplyDecision> decisions) {
    int inserted = 0;
    int updated = 0;
    int removed = 0;
    int kept = 0;
    for (final ApplyDecision decision in decisions) {
      switch (decision.action) {
        case ApplyAction.insert:
          inserted++;
        case ApplyAction.update:
          updated++;
        case ApplyAction.remove:
          removed++;
        case ApplyAction.skipNewerLocal:
          kept++;
        case ApplyAction.ignore:
          break;
      }
    }
    return ApplySummary(
      inserted: inserted,
      updated: updated,
      removed: removed,
      kept: kept,
    );
  }

  final int inserted;
  final int updated;
  final int removed;

  /// Rows the device refused to overwrite because its own copy is newer.
  final int kept;

  bool get didNothing => inserted == 0 && updated == 0 && removed == 0;

  int get totalChanges => inserted + updated + removed;
}
