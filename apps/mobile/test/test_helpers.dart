import 'package:drift/native.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/seed/seed_importer.dart';

/// Opens an in-memory database with the seed catalog already imported.
Future<AppDatabase> openSeededDb() async {
  final AppDatabase db = AppDatabase(NativeDatabase.memory());
  await SeedImporter(db).run();
  return db;
}
