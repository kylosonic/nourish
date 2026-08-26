import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_domain/domain.dart';

import '../data/database.dart';
import '../data/repositories/onboarding_repository.dart';
import '../data/seed/seed_importer.dart';
import '../router/app_router.dart';

/// Everything `main` needs before `runApp`: an open on-device database
/// with the idempotent seed import run, the persisted profile, and a
/// router that resumes onboarding correctly (blueprint §6 bootstrap).
class BootstrapResult {
  const BootstrapResult({
    required this.database,
    required this.router,
    required this.profile,
    required this.profileNotifier,
  });

  final AppDatabase database;
  final GoRouter router;
  final UserProfile profile;
  final ValueNotifier<UserProfile> profileNotifier;
}

/// Runs the local bootstrap sequence. No network, no secrets.
Future<BootstrapResult> bootstrap() async {
  developer.log('opening local database', name: 'bootstrap');
  final AppDatabase database = await AppDatabase.open();

  final int imported = await SeedImporter(database).run();
  developer.log('seed import inserted $imported foods', name: 'seed');

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
  );
}
