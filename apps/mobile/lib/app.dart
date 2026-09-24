import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import 'l10n/strings.dart';
import 'providers.dart';

/// Root widget: MaterialApp.router with the full Nourish design-system
/// theme (tokens + Inter/Ethiopic font fallback from `nourish_design_system`).
///
/// It also watches the app lifecycle for one reason: "today" is a value the
/// dashboard, water card and meal list all read, and a session left open across
/// midnight must not keep showing the previous day (QA finding 3). Resuming is
/// when a user actually looks again, so that is when the day key is recomputed.
class NourishApp extends ConsumerStatefulWidget {
  const NourishApp({super.key});

  @override
  ConsumerState<NourishApp> createState() => _NourishAppState();
}

class _NourishAppState extends ConsumerState<NourishApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(todayKeyProvider.notifier).refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final GoRouter router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: Strings.appName,
      theme: buildNourishTheme(),
      routerConfig: router,
    );
  }
}
