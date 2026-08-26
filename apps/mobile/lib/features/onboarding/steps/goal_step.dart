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
import '../widgets/option_card.dart';

/// ONB-03 goal selection: 4 cards; Next disabled until a selection
/// exists; single-selection (re-tap never deselects into a no-selection
/// state).
class GoalStepScreen extends ConsumerWidget {
  const GoalStepScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final OnboardingState onboarding = ref.watch(onboardingControllerProvider);
    final OnboardingController controller = ref.read(
      onboardingControllerProvider.notifier,
    );
    final Goal? goal = onboarding.profile?.goal;

    Future<void> nextPressed() async {
      final bool ok = await controller.continueFrom(OnboardingStep.goal);
      if (ok && context.mounted) {
        context.go(AppRoutes.onboardingBody);
      }
    }

    return OnboardingFlow(
      step: OnboardingStep.goal,
      onBack: () => context.go(AppRoutes.onboardingLanguage),
      actionBar: NourishButton(
        label: Strings.nextLabel,
        icon: Icons.arrow_forward,
        onPressed: goal == null || onboarding.isBusy ? null : nextPressed,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            Strings.goalTitle,
            style: NourishTextStyles.headlineLgMobile.copyWith(
              color: NourishColors.onBackground,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            Strings.goalSubtitle,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          OptionCard(
            title: Strings.goalLoseWeight,
            selected: goal == Goal.loseWeight,
            onTap: () => controller.setGoal(Goal.loseWeight),
            leading: _GoalIcon(
              icon: Icons.trending_down,
              color: NourishColors.primary,
              background: NourishColors.primaryContainer.withValues(
                alpha: 0.20,
              ),
            ),
          ),
          const SizedBox(height: NourishSpacing.gutter),
          OptionCard(
            title: Strings.goalBuildMuscle,
            selected: goal == Goal.buildMuscle,
            onTap: () => controller.setGoal(Goal.buildMuscle),
            leading: _GoalIcon(
              icon: Icons.fitness_center,
              color: NourishColors.onSecondaryFixed,
              background: NourishColors.secondaryContainer.withValues(
                alpha: 0.20,
              ),
            ),
          ),
          const SizedBox(height: NourishSpacing.gutter),
          OptionCard(
            title: Strings.goalMaintainWeight,
            selected: goal == Goal.maintainWeight,
            onTap: () => controller.setGoal(Goal.maintainWeight),
            leading: _GoalIcon(
              icon: Icons.monitor_weight,
              color: NourishColors.tertiary,
              background: NourishColors.tertiaryContainer.withValues(
                alpha: 0.20,
              ),
            ),
          ),
          const SizedBox(height: NourishSpacing.gutter),
          OptionCard(
            title: Strings.goalEatHealthier,
            selected: goal == Goal.eatHealthier,
            onTap: () => controller.setGoal(Goal.eatHealthier),
            leading: _GoalIcon(
              icon: Icons.eco,
              color: NourishColors.primary,
              background: NourishColors.surfaceTint.withValues(alpha: 0.10),
            ),
          ),
        ],
      ),
    );
  }
}

class _GoalIcon extends StatelessWidget {
  const _GoalIcon({
    required this.icon,
    required this.color,
    required this.background,
  });

  final IconData icon;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(color: background, shape: BoxShape.circle),
      child: Icon(icon, size: 26, color: color),
    );
  }
}
