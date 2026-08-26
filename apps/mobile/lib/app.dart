import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import 'l10n/strings.dart';
import 'providers.dart';

/// Root widget: MaterialApp.router with the full Nourish design-system
/// theme (tokens + Inter/Ethiopic font fallback from `nourish_design_system`).
class NourishApp extends ConsumerWidget {
  const NourishApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final GoRouter router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: Strings.appName,
      theme: buildNourishTheme(),
      routerConfig: router,
    );
  }
}
