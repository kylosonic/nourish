// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'weight_dao.dart';

// ignore_for_file: type=lint
mixin _$WeightDaoMixin on DatabaseAccessor<AppDatabase> {
  $WeightLogsTable get weightLogs => attachedDatabase.weightLogs;
  WeightDaoManager get managers => WeightDaoManager(this);
}

class WeightDaoManager {
  final _$WeightDaoMixin _db;
  WeightDaoManager(this._db);
  $$WeightLogsTableTableManager get weightLogs =>
      $$WeightLogsTableTableManager(_db.attachedDatabase, _db.weightLogs);
}
