import 'package:flutter/material.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';

/// Minimal bootstrap splash: the brand mark only, no dead spinner.
/// Route resolution is owned by the GoRouter redirect (bootstrap sets
/// `initialLocation` to the resume point, so this screen is seen only
/// transiently, if at all).
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: NourishColors.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.eco,
                size: 36,
                color: NourishColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              Strings.appName,
              style: NourishTextStyles.headlineLgMobile.copyWith(
                color: NourishColors.primary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              Strings.tagline,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
