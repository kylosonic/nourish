import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';
import '../../router/routes.dart';

/// ADR-0005 honest void: parametrized, honest "coming soon" copy for
/// not-yet-built features, with a real, working action — "Search food
/// instead" (food lanes) or "Continue without an account" (sign-in).
/// Nothing dead-ends silently.
class HonestVoidScreen extends StatelessWidget {
  const HonestVoidScreen({super.key, required this.featureId});

  /// e.g. `take-photo`; unknown ids render generic copy.
  final String featureId;

  @override
  Widget build(BuildContext context) {
    final bool isSignIn = featureId == 'sign-in';

    return Scaffold(
      appBar: AppBar(title: Text(Strings.honestVoidTitle(featureId))),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(NourishSpacing.containerMargin),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: NourishColors.primary.withValues(alpha: 0.10),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.auto_awesome,
                      size: 32,
                      color: NourishColors.primary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    Strings.honestVoidTitle(featureId),
                    textAlign: TextAlign.center,
                    style: NourishTextStyles.headlineMd.copyWith(
                      color: NourishColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    Strings.honestVoidBody(featureId),
                    textAlign: TextAlign.center,
                    style: NourishTextStyles.bodyMd.copyWith(
                      color: NourishColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 32),
                  NourishButton(
                    label: isSignIn
                        ? Strings.continueWithoutAccount
                        : Strings.searchFoodInstead,
                    icon: isSignIn ? null : Icons.search,
                    onPressed: () => context.go(
                      isSignIn
                          ? AppRoutes.onboardingLanguage
                          : AppRoutes.searchFood,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
