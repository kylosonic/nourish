import 'package:drift/drift.dart';

import '../database.dart';
import '../tables/tables.dart';

part 'water_dao.g.dart';

/// Water logs. Entries are signed: removals are stored as negative
/// amounts and the daily sum is clamped at zero by `WaterRepository`.
@DriftAccessor(tables: [WaterLogs])
class WaterDao extends DatabaseAccessor<AppDatabase> with _$WaterDaoMixin {
  WaterDao(super.db);

  Future<int> insertLog({
    required String dateKey,
    required int amountMl,
    DateTime? loggedAt,
  }) => into(waterLogs).insert(
    WaterLogsCompanion.insert(
      dateKey: dateKey,
      amountMl: amountMl,
      loggedAt: loggedAt ?? DateTime.now(),
    ),
  );

  /// Raw signed sum for the date (may be negative only if the caller
  /// bypasses the repository clamp).
  Future<int> sumMlForDate(String dateKey) async {
    final Expression<int> sum = waterLogs.amountMl.sum();
    final query = selectOnly(waterLogs)
      ..addColumns([sum])
      ..where(waterLogs.dateKey.equals(dateKey));
    final row = await query.getSingle();
    return row.read(sum) ?? 0;
  }

  Stream<int> watchSumMlForDate(String dateKey) {
    final Expression<int> sum = waterLogs.amountMl.sum();
    final query = selectOnly(waterLogs)
      ..addColumns([sum])
      ..where(waterLogs.dateKey.equals(dateKey));
    return query.watchSingle().map((row) => row.read(sum) ?? 0);
  }

  Future<List<WaterLogsRow>> rawLogsForDate(String dateKey) =>
      (select(waterLogs)
            ..where((WaterLogs w) => w.dateKey.equals(dateKey))
            ..orderBy([(WaterLogs w) => OrderingTerm.asc(w.loggedAt)]))
          .get();
}
