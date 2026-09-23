import 'dart:math' as math;

import '../../core/date_utils.dart';
import '../../core/water_target.dart';
import '../database.dart';
import '../daos/water_dao.dart';
import '../models/sync_operation.dart';
import 'sync_queue_repository.dart';

/// Hydration quick actions and the adjustable daily goal (WW-01).
///
/// Storage convention (consistent approach, per task): logs are signed
/// entries — removals insert a negative row — and the daily total is
/// clamped at 0. The minus button can therefore never produce a negative
/// total, and history keeps an honest audit trail of both adds and
/// removes.
class WaterRepository {
  WaterRepository(this._db);

  final AppDatabase _db;

  /// The documented default goal (3.0 L) used until the user sets their own;
  /// the same number as [defaultWaterTargetMl], not a second copy of it.
  static const int defaultTargetMl = defaultWaterTargetMl;

  WaterDao get _water => _db.waterDao;

  /// Add [amountMl] (default one glass) to [dateKey] (default today), and queue
  /// the change for the server.
  Future<void> addMl({int amountMl = 250, String? dateKey}) async {
    final String key = dateKey ?? todayDateKey();
    final int amount = amountMl.abs();
    final int rowId = await _water.insertLog(dateKey: key, amountMl: amount);
    await SyncQueueRepository(_db).enqueue(
      'water',
      rowId,
      SyncOperation(
        clientId: '',
        kind: SyncKind.water,
        op: SyncOp.upsert,
        updatedAt: DateTime.now(),
        loggedAt: DateTime.now(),
        dateKey: key,
        amountMl: amount,
      ),
    );
  }

  /// Removes up to [amountMl] (default 250) without going below zero.
  Future<void> removeMl({int amountMl = 250, String? dateKey}) async {
    final String key = dateKey ?? todayDateKey();
    final int current = await _water.sumMlForDate(key);
    if (current <= 0) {
      return;
    }
    final int removal = math.min(amountMl.abs(), current);
    if (removal > 0) {
      final int rowId = await _water.insertLog(dateKey: key, amountMl: -removal);
      // The removal is queued as its own negative operation: the server keeps
      // the same signed-entry audit trail the device does.
      await SyncQueueRepository(_db).enqueue(
        'water',
        rowId,
        SyncOperation(
          clientId: '',
          kind: SyncKind.water,
          op: SyncOp.upsert,
          updatedAt: DateTime.now(),
          loggedAt: DateTime.now(),
          dateKey: key,
          amountMl: -removal,
        ),
      );
    }
  }

  /// Daily total clamped at zero.
  Future<int> dailyTotalMl(String dateKey) async =>
      math.max(0, await _water.sumMlForDate(dateKey));

  Stream<int> watchDailyTotalMl(String dateKey) =>
      _water.watchSumMlForDate(dateKey).map((int sum) => math.max(0, sum));
}
