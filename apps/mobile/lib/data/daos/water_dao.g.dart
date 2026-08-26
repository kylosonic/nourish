// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'water_dao.dart';

// ignore_for_file: type=lint
mixin _$WaterDaoMixin on DatabaseAccessor<AppDatabase> {
  $WaterLogsTable get waterLogs => attachedDatabase.waterLogs;
  WaterDaoManager get managers => WaterDaoManager(this);
}

class WaterDaoManager {
  final _$WaterDaoMixin _db;
  WaterDaoManager(this._db);
  $$WaterLogsTableTableManager get waterLogs =>
      $$WaterLogsTableTableManager(_db.attachedDatabase, _db.waterLogs);
}
