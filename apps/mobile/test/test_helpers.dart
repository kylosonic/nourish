import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:nourish_mobile/core/update_launcher.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/models/release_metadata.dart';
import 'package:nourish_mobile/data/seed/seed_importer.dart';
import 'package:nourish_mobile/data/sources/release_metadata_source.dart';
import 'package:nourish_mobile/features/update/update_controller.dart';

/// Opens an in-memory database with the seed catalog already imported.
Future<AppDatabase> openSeededDb() async {
  final AppDatabase db = AppDatabase(NativeDatabase.memory());
  await SeedImporter(db).run();
  return db;
}

/// A scripted release-metadata source: no sockets, ever.
///
/// By default it returns null, which is the "update check could not run" path —
/// so every widget test that pumps the app stays offline unless it explicitly
/// asks for a newer release.
class FakeReleaseMetadataSource implements ReleaseMetadataSource {
  FakeReleaseMetadataSource({this.metadata});

  ReleaseMetadata? metadata;
  int calls = 0;

  @override
  Future<ReleaseMetadata?> fetch() async {
    calls++;
    return metadata;
  }
}

/// Records the URLs the app would open instead of launching a browser.
class FakeUpdateLauncher implements UpdateLauncher {
  final List<String> opened = <String>[];
  bool result = true;

  @override
  Future<bool> open(String url) async {
    opened.add(url);
    return result;
  }
}

/// The overrides every pumped app needs so no test reaches the network for a
/// release document. Tests that care about the update notice pass their own.
List<Override> offlineUpdateOverrides({
  ReleaseMetadata? metadata,
  FakeUpdateLauncher? launcher,
}) {
  return <Override>[
    releaseMetadataSourceProvider.overrideWithValue(
      FakeReleaseMetadataSource(metadata: metadata),
    ),
    updateLauncherProvider.overrideWithValue(launcher ?? FakeUpdateLauncher()),
  ];
}
