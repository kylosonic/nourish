// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'target_dao.dart';

// ignore_for_file: type=lint
mixin _$TargetDaoMixin on DatabaseAccessor<AppDatabase> {
  $DailyTargetsTable get dailyTargets => attachedDatabase.dailyTargets;
  TargetDaoManager get managers => TargetDaoManager(this);
}

class TargetDaoManager {
  final _$TargetDaoMixin _db;
  TargetDaoManager(this._db);
  $$DailyTargetsTableTableManager get dailyTargets =>
      $$DailyTargetsTableTableManager(_db.attachedDatabase, _db.dailyTargets);
}
