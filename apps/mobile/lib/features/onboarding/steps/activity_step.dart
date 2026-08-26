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

/// ONB-05 activity level: 5 options, Moderate pre-selected. Continue
/// routes to pace (loss goal) or straight to food preference.
class ActivityStepScreen extends ConsumerWidget {
  const ActivityStepScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final OnboardingState onboarding = ref.watch(onboardingControllerProvider);
    final OnboardingController controller = ref.read(
      onboardingControllerProvider.notifier,
    );
    final Goal? goal = onboarding.profile?.goal;
    final Activity activity = onboarding.profile?.activity ?? Activity.moderate;

    Future<void> continuePressed() async {
      final bool ok = await controller.continueFrom(OnboardingStep.activity);
      if (ok && context.mounted) {
        context.go(
          goal == Goal.loseWeight
              ? AppRoutes.onboardingPace
              : AppRoutes.onboardingFoodPreference,
        );
      }
    }

    return OnboardingFlow(
      step: OnboardingStep.activity,
      onBack: () => context.go(AppRoutes.onboardingBody),
      actionBar: NourishButton(
        label: Strings.continueLabel,
        icon: Icons.arrow_forward,
        onPressed: onboarding.isBusy ? null : continuePressed,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            Strings.activityTitle,
            style: NourishTextStyles.headlineLgMobile.copyWith(
              color: NourishColors.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            Strings.activitySubtitle,
            style: NourishTextStyles.bodyLg.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          RadioSelector<Activity>(
            options: const <RadioSelectorOption<Activity>>[
              RadioSelectorOption<Activity>(
                value: Activity.sedentary,
                title: Strings.activitySedentary,
                subtitle: Strings.activitySedentaryDesc,
              ),
              RadioSelectorOption<Activity>(
                value: Activity.light,
                title: Strings.activityLight,
                subtitle: Strings.activityLightDesc,
              ),
              RadioSelectorOption<Activity>(
                value: Activity.moderate,
                title: Strings.activityModerate,
                subtitle: Strings.activityModerateDesc,
              ),
              RadioSelectorOption<Activity>(
                value: Activity.veryActive,
                title: Strings.activityVeryActive,
                subtitle: Strings.activityVeryActiveDesc,
              ),
              RadioSelectorOption<Activity>(
                value: Activity.athlete,
                title: Strings.activityAthlete,
                subtitle: Strings.activityAthleteDesc,
              ),
            ],
            value: activity,
            onChanged: controller.setActivity,
          ),
        ],
      ),
    );
  }
}
