import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';
import '../../router/routes.dart';

/// ONB-01 welcome: hero art (LOCAL gradient placeholder — zero network),
/// brand mark, headline + subtitle, GET STARTED (primary) and
/// I ALREADY HAVE AN ACCOUNT (secondary → honest void, sign-in).
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: <Widget>[
          // Hero placeholder art: warm gradient with soft blobs (the
          // design's food photography ships with the S1 asset pipeline).
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: <Color>[
                    NourishColors.primaryFixedDim.withValues(alpha: 0.45),
                    NourishColors.secondaryFixed.withValues(alpha: 0.35),
                    NourishColors.background,
                    NourishColors.background,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: -80,
            right: -80,
            child: _Blob(
              size: 320,
              color: NourishColors.primaryFixed.withValues(alpha: 0.25),
            ),
          ),
          Positioned(
            left: -100,
            bottom: 60,
            child: _Blob(
              size: 260,
              color: NourishColors.secondaryFixed.withValues(alpha: 0.30),
            ),
          ),
          // Hero fade into the background behind the content (per the
          // design's hero-gradient).
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.center,
                  end: Alignment.bottomCenter,
                  colors: <Color>[
                    NourishColors.background.withValues(alpha: 0),
                    NourishColors.background.withValues(alpha: 0.85),
                    NourishColors.background,
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            // M7: the content scrolls on short viewports (320×480) so
            // both buttons stay reachable; on tall screens the column
            // keeps its bottom-anchored layout via the min-height
            // constraint + IntrinsicHeight.
            child: LayoutBuilder(
              builder: (BuildContext context, BoxConstraints constraints) {
                return SingleChildScrollView(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight,
                    ),
                    child: IntrinsicHeight(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: NourishSpacing.containerMargin,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: <Widget>[
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: NourishColors.surfaceContainerHighest
                                    .withValues(alpha: 0.8),
                                shape: BoxShape.circle,
                                boxShadow: NourishElevation.level1,
                              ),
                              child: const Icon(
                                Icons.eco,
                                size: 32,
                                color: NourishColors.primary,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              Strings.welcomeTitle,
                              textAlign: TextAlign.center,
                              style: NourishTextStyles.headlineLgMobile
                                  .copyWith(color: NourishColors.onSurface),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              Strings.welcomeSubtitle,
                              textAlign: TextAlign.center,
                              style: NourishTextStyles.bodyLg.copyWith(
                                color: NourishColors.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: NourishSpacing.sectionGap),
                            NourishButton(
                              label: Strings.getStarted,
                              icon: Icons.arrow_forward,
                              onPressed: () => context.go(
                                AppRoutes.onboardingLanguage,
                              ),
                            ),
                            const SizedBox(height: NourishSpacing.base),
                            NourishButton(
                              label: Strings.alreadyHaveAccount,
                              variant: NourishButtonVariant.secondary,
                              onPressed: () => context.go(
                                AppRoutes.honestVoidFor('sign-in'),
                              ),
                            ),
                            const SizedBox(
                              height: NourishSpacing.containerMargin,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _Blob extends StatelessWidget {
  const _Blob({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}
