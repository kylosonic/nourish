import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../../l10n/strings.dart';
import '../../../providers.dart';
import '../../../router/routes.dart';
import '../onboarding_controller.dart';
import '../onboarding_flow.dart';

/// ONB-06 preferred pace: reachable only for the lose-weight goal.
/// Conservative tagged "Recommended", Moderate pre-selected, Aggressive
/// red "Requires discipline" and never pre-selected. Skip advances
/// without recording a pace (the target engine applies its moderate
/// default).
class PaceStepScreen extends ConsumerWidget {
  const PaceStepScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final OnboardingState onboarding = ref.watch(onboardingControllerProvider);
    final OnboardingController controller = ref.read(
      onboardingControllerProvider.notifier,
    );
    final Goal? goal = onboarding.profile?.goal;

    // Guard: pace is a weight-loss-only concept (PPA-2). A direct visit
    // with any other goal is bounced to food preference.
    if (onboarding.isLoaded && goal != null && goal != Goal.loseWeight) {
      WidgetsBinding.instance.addPostFrameCallback((Duration _) {
        if (context.mounted) {
          context.go(AppRoutes.onboardingFoodPreference);
        }
      });
      return const SizedBox.shrink();
    }

    final Pace pace = onboarding.profile?.pace ?? Pace.moderate;

    Future<void> advance() async {
      final bool ok = await controller.continueFrom(OnboardingStep.pace);
      if (ok && context.mounted) {
        context.go(AppRoutes.onboardingFoodPreference);
      }
    }

    return OnboardingFlow(
      step: OnboardingStep.pace,
      onBack: () => context.go(AppRoutes.onboardingActivity),
      skip: TextButton(
        onPressed: onboarding.isBusy
            ? null
            : () async {
                controller.skipPace();
                await advance();
              },
        child: const Text(Strings.skipLabel),
      ),
      actionBar: NourishButton(
        label: Strings.continueLabel,
        onPressed: onboarding.isBusy ? null : advance,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            Strings.paceTitle,
            style: NourishTextStyles.headlineLgMobile.copyWith(
              color: NourishColors.onBackground,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            Strings.paceSubtitle,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          RadioSelector<Pace>(
            options: <RadioSelectorOption<Pace>>[
              RadioSelectorOption<Pace>(
                value: Pace.conservative,
                title: Strings.paceConservative,
                tag: Strings.paceRecommended,
                tagColor: NourishColors.primary,
                metric: '-0.25',
                metricSuffix: Strings.paceKgPerWeek,
                subtitle: Strings.paceConservativeDesc,
              ),
              RadioSelectorOption<Pace>(
                value: Pace.moderate,
                title: Strings.paceModerate,
                metric: '-0.5',
                metricSuffix: Strings.paceKgPerWeek,
                subtitle: Strings.paceModerateDesc,
              ),
              RadioSelectorOption<Pace>(
                value: Pace.aggressive,
                title: Strings.paceAggressive,
                tag: Strings.paceRequiresDiscipline,
                tagColor: NourishColors.tertiary,
                metric: '-1.0',
                metricSuffix: Strings.paceKgPerWeek,
                subtitle: Strings.paceAggressiveDesc,
              ),
            ],
            value: pace,
            onChanged: controller.setPace,
          ),
        ],
      ),
    );
  }
}
