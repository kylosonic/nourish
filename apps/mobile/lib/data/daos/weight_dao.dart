import 'package:drift/drift.dart';

import '../database.dart';
import '../tables/tables.dart';

part 'weight_dao.g.dart';

/// Weight entries (WW-03). Append-only: an entry is a record of what the scale
/// said, so nothing here updates or deletes a row — correcting a mistake means
/// logging the right value, exactly as on paper.
@DriftAccessor(tables: [WeightLogs])
class WeightDao extends DatabaseAccessor<AppDatabase> with _$WeightDaoMixin {
  WeightDao(super.db);

  Future<int> insertEntry({
    required String dateKey,
    required double weightKg,
    DateTime? loggedAt,
  }) => into(weightLogs).insert(
    WeightLogsCompanion.insert(
      dateKey: dateKey,
      weightKg: weightKg,
      loggedAt: loggedAt ?? DateTime.now(),
    ),
  );

  /// Newest first in measured time: by calendar day, then by the timestamp
  /// inside that day. A back-filled entry for an old date sits at that date
  /// rather than on top of the list (WW-03 edge case).
  Future<List<WeightLogsRow>> allEntries() => (select(weightLogs)..orderBy([
        (WeightLogs w) => OrderingTerm.desc(w.dateKey),
        (WeightLogs w) => OrderingTerm.desc(w.loggedAt),
      ]))
      .get();

  /// Entries inside an inclusive `yyyy-MM-dd` window, oldest first — the order
  /// a trend is read in. The key is a fixed-width ISO string, so a
  /// lexicographic range is a date range.
  Future<List<WeightLogsRow>> entriesInRange(String startKey, String endKey) =>
      (select(weightLogs)
            ..where(
              (WeightLogs w) =>
                  w.dateKey.isBiggerOrEqualValue(startKey) &
                  w.dateKey.isSmallerOrEqualValue(endKey),
            )
            ..orderBy([(WeightLogs w) => OrderingTerm.asc(w.loggedAt)]))
          .get();

  Stream<List<WeightLogsRow>> watchAllEntries() => (select(weightLogs)..orderBy([
        (WeightLogs w) => OrderingTerm.desc(w.dateKey),
        (WeightLogs w) => OrderingTerm.desc(w.loggedAt),
      ]))
      .watch();
}
