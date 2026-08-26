import 'package:drift/drift.dart';
import 'package:nourish_domain/domain.dart';

import '../database.dart';
import '../tables/tables.dart';

part 'target_dao.g.dart';

/// Append-only [DailyTarget] storage: every derivation inserts a new row;
/// the latest row (highest id) is the active target.
@DriftAccessor(tables: [DailyTargets])
class TargetDao extends DatabaseAccessor<AppDatabase> with _$TargetDaoMixin {
  TargetDao(super.db);

  Future<int> insertTarget(DailyTarget target) => into(dailyTargets).insert(
    DailyTargetsCompanion.insert(
      targetKcal: target.targetKcal,
      proteinG: target.proteinG,
      carbsG: target.carbsG,
      fatG: target.fatG,
      bmrKcal: target.bmrKcal,
      tdeeKcal: target.tdeeKcal,
      goalAdjustmentKcal: target.goalAdjustmentKcal,
      activityFactor: target.activityFactor,
      pace: Value(target.pace?.name),
      formulaVersion: target.formulaVersion,
      dateGenerated: target.dateGenerated,
      floorKcal: target.floorKcal,
    ),
  );

  Future<DailyTarget?> latest() async {
    final DailyTargetsRow? row =
        await (select(dailyTargets)
              ..orderBy([(DailyTargets t) => OrderingTerm.desc(t.id)])
              ..limit(1))
            .getSingleOrNull();
    return row == null ? null : _targetFromRow(row);
  }

  Stream<DailyTarget?> watchLatest() =>
      (select(dailyTargets)
            ..orderBy([(DailyTargets t) => OrderingTerm.desc(t.id)])
            ..limit(1))
          .watchSingleOrNull()
          .map(
            (DailyTargetsRow? row) => row == null ? null : _targetFromRow(row),
          );

  /// Full append-only history, oldest first.
  Future<List<DailyTarget>> all() async {
    final List<DailyTargetsRow> rows = await (select(
      dailyTargets,
    )..orderBy([(DailyTargets t) => OrderingTerm.asc(t.id)])).get();
    return rows.map(_targetFromRow).toList();
  }

  DailyTarget _targetFromRow(DailyTargetsRow row) {
    return DailyTarget(
      targetKcal: row.targetKcal,
      proteinG: row.proteinG,
      carbsG: row.carbsG,
      fatG: row.fatG,
      bmrKcal: row.bmrKcal,
      tdeeKcal: row.tdeeKcal,
      goalAdjustmentKcal: row.goalAdjustmentKcal,
      activityFactor: row.activityFactor,
      pace: row.pace == null ? null : Pace.values.byName(row.pace!),
      formulaVersion: row.formulaVersion,
      dateGenerated: row.dateGenerated,
      floorKcal: row.floorKcal,
    );
  }
}
