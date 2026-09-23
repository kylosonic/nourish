// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sync_queue_dao.dart';

// ignore_for_file: type=lint
mixin _$SyncQueueDaoMixin on DatabaseAccessor<AppDatabase> {
  $SyncQueueRowsTable get syncQueueRows => attachedDatabase.syncQueueRows;
  $SeedMetaTable get seedMeta => attachedDatabase.seedMeta;
  SyncQueueDaoManager get managers => SyncQueueDaoManager(this);
}

class SyncQueueDaoManager {
  final _$SyncQueueDaoMixin _db;
  SyncQueueDaoManager(this._db);
  $$SyncQueueRowsTableTableManager get syncQueueRows =>
      $$SyncQueueRowsTableTableManager(_db.attachedDatabase, _db.syncQueueRows);
  $$SeedMetaTableTableManager get seedMeta =>
      $$SeedMetaTableTableManager(_db.attachedDatabase, _db.seedMeta);
}
