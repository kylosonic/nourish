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

/// ONB-02 language selection: English pre-selected; Amharic renders via
/// the Noto Sans Ethiopic fallback; selection persists on Continue;
/// back exits onboarding to welcome.
class LanguageStepScreen extends ConsumerWidget {
  const LanguageStepScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final OnboardingState onboarding = ref.watch(onboardingControllerProvider);
    final OnboardingController controller = ref.read(
      onboardingControllerProvider.notifier,
    );
    final AppLanguage language =
        onboarding.profile?.language ?? AppLanguage.en;

    Future<void> continuePressed() async {
      final bool ok = await controller.continueFrom(OnboardingStep.language);
      if (ok && context.mounted) {
        context.go(AppRoutes.onboardingGoal);
      }
    }

    return OnboardingFlow(
      step: OnboardingStep.language,
      onBack: () => context.go(AppRoutes.welcome),
      actionBar: NourishButton(
        label: Strings.continueLabel,
        icon: Icons.arrow_forward,
        onPressed: onboarding.isBusy ? null : continuePressed,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            Strings.languageTitle,
            style: NourishTextStyles.headlineLgMobile.copyWith(
              color: NourishColors.onBackground,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            Strings.languageSubtitle,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          RadioSelector<AppLanguage>(
            options: const <RadioSelectorOption<AppLanguage>>[
              RadioSelectorOption<AppLanguage>(
                value: AppLanguage.en,
                title: Strings.languageEnglish,
                subtitle: Strings.languageEnglish,
              ),
              RadioSelectorOption<AppLanguage>(
                value: AppLanguage.am,
                title: Strings.languageAmharic,
                subtitle: Strings.languageAmharicRoman,
              ),
              RadioSelectorOption<AppLanguage>(
                value: AppLanguage.om,
                title: Strings.languageOromo,
                subtitle: Strings.languageOromoRoman,
              ),
            ],
            value: language,
            onChanged: controller.setLanguage,
          ),
        ],
      ),
    );
  }
}
