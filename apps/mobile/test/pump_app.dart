import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/app.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/onboarding_repository.dart';
import 'package:nourish_mobile/providers.dart';
import 'package:nourish_mobile/router/app_router.dart';

import 'test_helpers.dart';

/// Full-app harness: seeded in-memory database, live GoRouter and the
/// profile notifier the redirect reads.
class AppHarness {
  AppHarness({
    required this.db,
    required this.profileNotifier,
    required this.router,
  });

  final AppDatabase db;
  final ValueNotifier<UserProfile> profileNotifier;
  final GoRouter router;

  /// The profile the router redirect currently consults.
  UserProfile get profile => profileNotifier.value;

  void updateProfile(UserProfile profile) => profileNotifier.value = profile;

  /// Ends the test cleanly. MUST be the last statement of any widget
  /// test that watched a drift-backed provider: drift schedules a
  /// zero-duration cache timer when a stream subscription cancels, and
  /// flutter_test's pending-timer invariant runs before tearDowns — so
  /// the flush has to happen inside the test body. Unmount → advance the
  /// fake clock (fires the cache timers) → close the database.
  Future<void> teardown(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 100));
    await db.close();
    await tester.pump(const Duration(milliseconds: 100));
  }
}

/// Pumps the whole app (NourishApp + router + seeded DB) and settles.
///
/// Pass [db] when the test needs to seed data (meals, targets) or wrap a
/// repository before the app boots; otherwise a fresh seeded in-memory
/// database is created. Direct `await`s of drift futures are safe in the
/// widget-test zone (drift completes them synchronously over FFI).
Future<AppHarness> pumpApp(
  WidgetTester tester, {
  UserProfile? profile,
  AppDatabase? db,
  List<Override> overrides = const <Override>[],
}) async {
  final AppDatabase database = db ?? await openSeededDb();
  final UserProfile initial =
      profile ?? await OnboardingRepository(database).getOrCreate();
  final ValueNotifier<UserProfile> notifier = ValueNotifier<UserProfile>(
    initial,
  );
  final GoRouter router = buildAppRouter(profileNotifier: notifier);

  await tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[
        driftDatabaseProvider.overrideWithValue(database),
        routerProvider.overrideWithValue(router),
        profileNotifierProvider.overrideWithValue(notifier),
        ...overrides,
      ],
      child: const NourishApp(),
    ),
  );
  await tester.pumpAndSettle();

  return AppHarness(db: database, profileNotifier: notifier, router: router);
}

/// Reads a provider out of the pumped widget tree.
T readProvider<T>(WidgetTester tester, ProviderListenable<T> provider) {
  return ProviderScope.containerOf(
    tester.element(find.byType(MaterialApp)),
    listen: false,
  ).read(provider);
}
