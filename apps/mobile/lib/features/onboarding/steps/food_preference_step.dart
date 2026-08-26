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

/// ONB-07 food preference: 3 image cards with LOCAL gradient/icon art
/// (no food photography in S0 — blueprint §18 risk 5). Ethiopian
/// pre-selected. Continue persists, derives the daily target and opens
/// the summary.
class FoodPreferenceStepScreen extends ConsumerWidget {
  const FoodPreferenceStepScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final OnboardingState onboarding = ref.watch(onboardingControllerProvider);
    final OnboardingController controller = ref.read(
      onboardingControllerProvider.notifier,
    );
    final Goal? goal = onboarding.profile?.goal;
    final FoodPreference preference =
        onboarding.profile?.foodPreference ?? FoodPreference.ethiopian;

    Future<void> continuePressed() async {
      final bool ok = await controller.continueFrom(
        OnboardingStep.foodPreference,
      );
      if (ok && context.mounted) {
        context.go(AppRoutes.onboardingDailyTarget);
      }
    }

    return OnboardingFlow(
      step: OnboardingStep.foodPreference,
      onBack: () => context.go(
        goal == Goal.loseWeight
            ? AppRoutes.onboardingPace
            : AppRoutes.onboardingActivity,
      ),
      actionBar: NourishButton(
        label: Strings.continueLabel,
        icon: Icons.arrow_forward,
        onPressed: onboarding.isBusy ? null : continuePressed,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            Strings.foodPrefTitle,
            style: NourishTextStyles.headlineLgMobile.copyWith(
              color: NourishColors.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            Strings.foodPrefSubtitle,
            style: NourishTextStyles.bodyLg.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          OptionCard(
            title: Strings.prefEthiopian,
            subtitle: Strings.prefEthiopianDesc,
            selected: preference == FoodPreference.ethiopian,
            onTap: () => controller.setFoodPreference(FoodPreference.ethiopian),
            leading: _PreferenceArt(
              colors: const <Color>[
                NourishColors.secondaryContainer,
                NourishColors.primaryContainer,
              ],
              icon: Icons.restaurant,
            ),
            trailing: _SelectedCheck(
              selected: preference == FoodPreference.ethiopian,
            ),
          ),
          const SizedBox(height: NourishSpacing.gutter),
          OptionCard(
            title: Strings.prefMixed,
            subtitle: Strings.prefMixedDesc,
            selected: preference == FoodPreference.mixed,
            onTap: () => controller.setFoodPreference(FoodPreference.mixed),
            leading: const _PreferenceArt(
              colors: <Color>[
                NourishColors.primaryContainer,
                NourishColors.primaryFixedDim,
              ],
              icon: Icons.blender,
            ),
            trailing: _SelectedCheck(
              selected: preference == FoodPreference.mixed,
            ),
          ),
          const SizedBox(height: NourishSpacing.gutter),
          OptionCard(
            title: Strings.prefInternational,
            subtitle: Strings.prefInternationalDesc,
            selected: preference == FoodPreference.international,
            onTap: () =>
                controller.setFoodPreference(FoodPreference.international),
            leading: const _PreferenceArt(
              colors: <Color>[
                NourishColors.tertiaryContainer,
                NourishColors.secondaryFixed,
              ],
              icon: Icons.public,
            ),
            trailing: _SelectedCheck(
              selected: preference == FoodPreference.international,
            ),
          ),
        ],
      ),
    );
  }
}

/// 88×88 local gradient + icon placeholder (design's remote food
/// photography is replaced by art until the S1 asset pipeline).
class _PreferenceArt extends StatelessWidget {
  const _PreferenceArt({required this.colors, required this.icon});

  final List<Color> colors;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 88,
      height: 88,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(NourishRadii.thumbnail),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
      ),
      child: Icon(icon, size: 36, color: Colors.white),
    );
  }
}

class _SelectedCheck extends StatelessWidget {
  const _SelectedCheck({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected ? NourishColors.primary : Colors.transparent,
        border: Border.all(
          color: selected
              ? NourishColors.primary
              : NourishColors.outlineVariant,
          width: 2,
        ),
      ),
      child: selected
          ? const Icon(Icons.check, size: 16, color: NourishColors.onPrimary)
          : null,
    );
  }
}
