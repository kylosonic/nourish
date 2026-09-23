import 'dart:math';

import '../daos/sync_queue_dao.dart';
import '../database.dart';
import '../models/sync_operation.dart';

/// Queued operations and the install's sync identity (OFF-02).
///
/// The identity matters as much as the queue: the server makes an operation
/// idempotent by `clientId`, so a device that minted the same ids as another
/// device would have its rows silently treated as that device's. Every id
/// therefore carries a per-install prefix generated once and kept in the local
/// database.
class SyncQueueRepository {
  SyncQueueRepository(this._db);

  final AppDatabase _db;

  static const String deviceIdKey = 'sync.deviceId';
  static const String _alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

  SyncQueueDao get _queue => _db.syncQueueDao;

  /// The install's own prefix, generated on first use.
  ///
  /// Not a secret and not a user identifier: it only has to be unique among one
  /// person's devices, which a 12-character random suffix is.
  Future<String> deviceId() async {
    final String? existing = await _queue.readSetting(deviceIdKey);
    if (existing != null && existing.isNotEmpty) return existing;
    final Random random = Random.secure();
    final String generated = List<String>.generate(
      12,
      (_) => _alphabet[random.nextInt(_alphabet.length)],
    ).join();
    await _queue.writeSetting(deviceIdKey, generated);
    return generated;
  }

  /// The stable id for one local row: `<device>:<table>:<rowId>`.
  Future<String> clientIdFor(String table, int rowId) async =>
      '${await deviceId()}:$table:$rowId';

  /// Queue one operation, filling in the install-scoped client id so no caller
  /// can invent its own scheme (a colliding id would make another device's row
  /// look like this one's).
  ///
  /// [table] names the local table the row lives in; [rowId] is its local id.
  Future<int> enqueue(String table, int rowId, SyncOperation operation) async {
    final String clientId = await clientIdFor(table, rowId);
    final SyncOperation withId = operation.withClientId(clientId);
    return _queue.enqueue(
      clientId: clientId,
      kind: withId.kind.name,
      op: withId.op.name,
      payload: withId.encode(),
      updatedAt: withId.updatedAt,
    );
  }

  /// The oldest [limit] operations still waiting, in the order they happened.
  Future<List<QueuedOperation>> pending({int limit = 200}) async {
    final List<SyncQueueRow> rows = await _queue.pending(limit: limit);
    return rows
        .map(
          (SyncQueueRow row) => QueuedOperation(
            id: row.id,
            clientId: row.clientId,
            kind: row.kind,
            op: row.op,
            operation: SyncOperation.decode(row.payload),
            attempts: row.attempts,
            lastError: row.lastError,
          ),
        )
        .toList();
  }

  Future<int> pendingCount() => _queue.pendingCount();

  Stream<int> watchPendingCount() => _queue.watchPendingCount();

  /// Forget operations the server has taken.
  Future<void> markDone(List<int> ids) => _queue.removeApplied(ids);

  /// Keep a refused operation and record why, so it stays visible.
  Future<void> recordFailure(int id, String message) =>
      _queue.recordFailure(id, message);
}

/// A queued operation as the engine sees it.
class QueuedOperation {
  const QueuedOperation({
    required this.id,
    required this.clientId,
    required this.kind,
    required this.op,
    required this.operation,
    required this.attempts,
    this.lastError,
  });

  final int id;
  final String clientId;
  final String kind;
  final String op;

  /// The decoded body, identical to what will be sent.
  final SyncOperation operation;

  final int attempts;
  final String? lastError;
}
