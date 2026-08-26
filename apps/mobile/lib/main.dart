import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'bootstrap/bootstrap.dart';
import 'providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final BootstrapResult result = await bootstrap();
  runApp(
    ProviderScope(
      overrides: <Override>[
        driftDatabaseProvider.overrideWithValue(result.database),
        routerProvider.overrideWithValue(result.router),
        profileNotifierProvider.overrideWithValue(result.profileNotifier),
      ],
      child: const NourishApp(),
    ),
  );
}
