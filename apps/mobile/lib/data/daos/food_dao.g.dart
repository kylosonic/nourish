// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'food_dao.dart';

// ignore_for_file: type=lint
mixin _$FoodDaoMixin on DatabaseAccessor<AppDatabase> {
  $FoodsTable get foods => attachedDatabase.foods;
  $FoodAliasesTable get foodAliases => attachedDatabase.foodAliases;
  $FoodPortionsTable get foodPortions => attachedDatabase.foodPortions;
  FoodDaoManager get managers => FoodDaoManager(this);
}

class FoodDaoManager {
  final _$FoodDaoMixin _db;
  FoodDaoManager(this._db);
  $$FoodsTableTableManager get foods =>
      $$FoodsTableTableManager(_db.attachedDatabase, _db.foods);
  $$FoodAliasesTableTableManager get foodAliases =>
      $$FoodAliasesTableTableManager(_db.attachedDatabase, _db.foodAliases);
  $$FoodPortionsTableTableManager get foodPortions =>
      $$FoodPortionsTableTableManager(_db.attachedDatabase, _db.foodPortions);
}
