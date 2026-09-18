import 'dart:async';
import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_domain/domain.dart';

import '../data/database.dart';
import '../data/repositories/onboarding_repository.dart';
import '../data/seed/seed_importer.dart';
import '../data/sources/api_catalog_data_source.dart';
import '../data/sources/local_catalog_data_source.dart';
import '../data/sync/catalog_sync_service.dart';
import '../router/app_router.dart';

/// Everything `main` needs before `runApp`: an open on-device database
/// with the idempotent seed import run, the fire-and-forget catalog
/// sync, the persisted profile, and a router that resumes onboarding
/// correctly (blueprint §6 bootstrap).
class BootstrapResult {
  const BootstrapResult({
    required this.database,
    required this.router,
    required this.profile,
    required this.profileNotifier,
    required this.catalogSync,
  });

  final AppDatabase database;
  final GoRouter router;
  final UserProfile profile;
  final ValueNotifier<UserProfile> profileNotifier;

  /// The bootstrap-created sync service (main() injects it so the
  /// provider graph mirrors its lifecycle).
  final CatalogSyncService catalogSync;
}

/// Runs the local bootstrap sequence. No network on the critical path:
/// the catalog sync is fired AFTER the seed import and never awaited
/// (OFF-01 — Home must not block on it; failures are logged under
/// `catalog-sync` and the seed catalog stays in place).
Future<BootstrapResult> bootstrap() async {
  developer.log('opening local database', name: 'bootstrap');
  final AppDatabase database = await AppDatabase.open();

  final int imported = await SeedImporter(database).run();
  developer.log('seed import inserted $imported foods', name: 'seed');

  final CatalogSyncService catalogSync = CatalogSyncService(
    local: LocalCatalogDataSource(database),
    api: ApiCatalogDataSource(),
  );
  unawaited(catalogSync.sync());

  final OnboardingRepository repository = OnboardingRepository(database);
  final UserProfile profile = await repository.getOrCreate();
  final ValueNotifier<UserProfile> profileNotifier = ValueNotifier<UserProfile>(
    profile,
  );

  final GoRouter router = buildAppRouter(profileNotifier: profileNotifier);
  developer.log(
    'resuming at ${firstUnansweredRoute(profile)}',
    name: 'bootstrap',
  );

  return BootstrapResult(
    database: database,
    router: router,
    profile: profile,
    profileNotifier: profileNotifier,
    catalogSync: catalogSync,
  );
}
