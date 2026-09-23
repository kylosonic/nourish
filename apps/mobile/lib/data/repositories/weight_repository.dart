import '../../core/date_utils.dart';
import '../../features/weight/weight_trend.dart';
import '../database.dart';
import '../daos/weight_dao.dart';
import '../models/sync_operation.dart';
import 'sync_queue_repository.dart';

/// Weight logging and trend (WW-03).
///
/// Append-only by design: an entry is a record of what the scale said. Nothing
/// here updates or deletes a row, so history cannot be quietly rewritten.
///
/// Nothing is seeded from the onboarding answers either: the history holds
/// weigh-ins the user actually made, so a trend never starts from a number they
/// never entered on this screen.
class WeightRepository {
  WeightRepository(this._db);

  final AppDatabase _db;

  WeightDao get _weights => _db.weightDao;

  /// Persist one entry. [dateKey] defaults to today; passing an earlier date
  /// back-fills a historical entry, which keeps the date it was given.
  Future<int> log({
    required double weightKg,
    String? dateKey,
    DateTime? loggedAt,
  }) async {
    final String? problem = validateWeightInput(weightKg.toString());
    if (problem != null) {
      throw ArgumentError(problem);
    }
    final DateTime at = loggedAt ?? DateTime.now();
    final String key = dateKey ?? dateKeyFor(at);
    final int rowId = await _weights.insertEntry(
      dateKey: key,
      weightKg: weightKg,
      loggedAt: at,
    );
    // Queue the entry with both its measured day and its timestamp: the server
    // would otherwise file a back-filled entry under the day it was typed.
    await SyncQueueRepository(_db).enqueue(
      'weight',
      rowId,
      SyncOperation(
        clientId: '',
        kind: SyncKind.weight,
        op: SyncOp.upsert,
        updatedAt: at,
        loggedAt: at,
        dateKey: key,
        weightKg: weightKg,
      ),
    );
    return rowId;
  }

  /// Newest entry first (history list and "current weight").
  Future<List<WeightEntry>> history() async {
    final List<WeightLogsRow> rows = await _weights.allEntries();
    return rows
        .map(
          (WeightLogsRow row) => WeightEntry(
            dateKey: row.dateKey,
            weightKg: row.weightKg,
            loggedAt: row.loggedAt,
          ),
        )
        .toList();
  }

  Stream<List<WeightEntry>> watchHistory() => _weights.watchAllEntries().map(
    (List<WeightLogsRow> rows) => rows
        .map(
          (WeightLogsRow row) => WeightEntry(
            dateKey: row.dateKey,
            weightKg: row.weightKg,
            loggedAt: row.loggedAt,
          ),
        )
        .toList(),
  );

  /// The trend over the trailing [days] calendar days (weekly or monthly view).
  ///
  /// [at] is the instant the window ends at; callers pass the injectable clock
  /// (M3) so a fixed clock pins the window in tests.
  Future<WeightTrend> trend({
    int days = 30,
    double? targetKg,
    DateTime? at,
  }) async {
    final DateTime today = dateOnly(at ?? DateTime.now());
    final String startKey = dateKeyFor(today.subtract(Duration(days: days - 1)));
    final String endKey = dateKeyFor(today);
    final List<WeightLogsRow> rows = await _weights.entriesInRange(startKey, endKey);
    return computeWeightTrend(
      entries: rows
          .map(
            (WeightLogsRow row) => WeightEntry(
              dateKey: row.dateKey,
              weightKg: row.weightKg,
              loggedAt: row.loggedAt,
            ),
          )
          .toList(),
      targetKg: targetKg,
    );
  }

  /// The most recent entry, or null when nothing has been logged.
  Future<WeightEntry?> latest() async {
    final List<WeightEntry> all = await history();
    return all.isEmpty ? null : all.first;
  }
}
