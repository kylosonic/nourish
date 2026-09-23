import 'package:drift/drift.dart';

import '../database.dart';
import '../tables/tables.dart';

part 'sync_queue_dao.g.dart';

/// The offline queue's storage (OFF-02).
///
/// Ordered by insertion, so operations are pushed in the order they happened —
/// the server applies a queue in order, and a delete must never overtake the
/// upsert it removes.
@DriftAccessor(tables: [SyncQueueRows, SeedMeta])
class SyncQueueDao extends DatabaseAccessor<AppDatabase>
    with _$SyncQueueDaoMixin {
  SyncQueueDao(super.db);

  Future<int> enqueue({
    required String clientId,
    required String kind,
    required String op,
    required String payload,
    required DateTime updatedAt,
    DateTime? queuedAt,
  }) => into(syncQueueRows).insert(
    SyncQueueRowsCompanion.insert(
      clientId: clientId,
      kind: kind,
      op: op,
      payload: payload,
      updatedAt: updatedAt,
      queuedAt: queuedAt ?? DateTime.now(),
    ),
  );

  /// The oldest [limit] operations still waiting.
  Future<List<SyncQueueRow>> pending({int limit = 200}) =>
      (select(syncQueueRows)
            ..orderBy([(SyncQueueRows r) => OrderingTerm.asc(r.id)])
            ..limit(limit))
          .get();

  Future<int> pendingCount() async {
    final Expression<int> count = syncQueueRows.id.count();
    final TypedResult row = await (selectOnly(syncQueueRows)
          ..addColumns(<Expression<Object>>[count]))
        .getSingle();
    return row.read(count) ?? 0;
  }

  Stream<int> watchPendingCount() {
    final Expression<int> count = syncQueueRows.id.count();
    return (selectOnly(syncQueueRows)
          ..addColumns(<Expression<Object>>[count]))
        .watchSingle()
        .map((TypedResult row) => row.read(count) ?? 0);
  }

  /// Drop operations the server has taken (applied, or already known).
  Future<void> removeApplied(List<int> ids) async {
    if (ids.isEmpty) return;
    await (delete(syncQueueRows)..where((SyncQueueRows r) => r.id.isIn(ids)))
        .go();
  }

  /// Record a refusal so the operation stays visible instead of disappearing.
  Future<void> recordFailure(int id, String message) async {
    final SyncQueueRow? row = await (select(
      syncQueueRows,
    )..where((SyncQueueRows r) => r.id.equals(id))).getSingleOrNull();
    if (row == null) return;
    await (update(syncQueueRows)..where((SyncQueueRows r) => r.id.equals(id)))
        .write(
          SyncQueueRowsCompanion(
            attempts: Value(row.attempts + 1),
            lastError: Value(message),
          ),
        );
  }

  /// A key/value row from the shared metadata table (device id, counters).
  Future<String?> readSetting(String key) async {
    final SeedMetaRow? row = await (select(
      seedMeta,
    )..where((SeedMeta r) => r.key.equals(key))).getSingleOrNull();
    return row?.value;
  }

  Future<void> writeSetting(String key, String value) =>
      into(seedMeta).insertOnConflictUpdate(
        SeedMetaRow(key: key, value: value),
      );
}
