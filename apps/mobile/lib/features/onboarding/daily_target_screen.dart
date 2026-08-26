import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../core/formatters.dart';
import '../../l10n/strings.dart';
import '../../providers.dart';
import '../../router/routes.dart';
import 'onboarding_controller.dart';

/// ONB-08 daily target summary: renders the persisted/derived
/// [DailyTarget] (engine output, never hardcoded numbers) with P/C/F
/// macro tiles; START TRACKING marks onboarding complete and lands on
/// Home. Carries NO step counter.
class DailyTargetScreen extends ConsumerWidget {
  const DailyTargetScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<DailyTarget?> target = ref.watch(
      activeDailyTargetProvider,
    );
    final OnboardingController controller = ref.read(
      onboardingControllerProvider.notifier,
    );
    final OnboardingState onboarding = ref.watch(onboardingControllerProvider);

    Future<void> startTracking() async {
      final bool ok = await controller.completeOnboarding();
      if (ok && context.mounted) {
        context.go(AppRoutes.home);
      }
    }

    return Scaffold(
      body: SafeArea(
        child: target.when(
          loading: () => const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                SizedBox(
                  width: 40,
                  height: 40,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    color: NourishColors.primary,
                  ),
                ),
                SizedBox(height: 16),
                Text(Strings.targetLoading),
              ],
            ),
          ),
          error: (Object error, StackTrace stack) =>
              _Unavailable(onBackToPrefs: () => _backToPrefs(context)),
          data: (DailyTarget? value) => value == null
              ? _Unavailable(onBackToPrefs: () => _backToPrefs(context))
              : _Summary(
                  target: value,
                  onStartTracking: startTracking,
                  isBusy: onboarding.isBusy,
                ),
        ),
      ),
    );
  }

  void _backToPrefs(BuildContext context) {
    context.go(AppRoutes.onboardingFoodPreference);
  }
}

class _Summary extends StatelessWidget {
  const _Summary({
    required this.target,
    required this.onStartTracking,
    required this.isBusy,
  });

  final DailyTarget target;
  final VoidCallback onStartTracking;
  final bool isBusy;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(NourishSpacing.containerMargin),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              const SizedBox(height: 8),
              // Local gradient hero placeholder (no food photography in
              // S0 — blueprint §18 risk 5).
              Container(
                height: 160,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(NourishRadii.image),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: <Color>[
                      NourishColors.primaryFixedDim,
                      NourishColors.secondaryContainer,
                    ],
                  ),
                ),
                child: const Icon(
                  Icons.restaurant,
                  size: 56,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: NourishSpacing.sectionGap),
              Text(
                Strings.yourDailyTarget,
                textAlign: TextAlign.center,
                style: NourishTextStyles.labelCaps.copyWith(
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: <Widget>[
                  Text(
                    formatKcalInt(target.targetKcal),
                    style: NourishTextStyles.displayLg.copyWith(
                      color: NourishColors.primary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    Strings.kcalUnit,
                    style: NourishTextStyles.headlineMd.copyWith(
                      color: NourishColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: NourishSpacing.sectionGap),
              Row(
                children: <Widget>[
                  Expanded(
                    child: _MacroTile(
                      label: Strings.macroProtein,
                      grams: target.proteinG,
                      // Decorative: per-macro share of target calories
                      // (25% protein / 45% carbs / 30% fat, blueprint §8).
                      fraction: 0.25,
                      color: NourishColors.primary,
                    ),
                  ),
                  const SizedBox(width: NourishSpacing.gutter),
                  Expanded(
                    child: _MacroTile(
                      label: Strings.macroCarbs,
                      grams: target.carbsG,
                      fraction: 0.45,
                      color: NourishColors.secondaryContainer,
                    ),
                  ),
                  const SizedBox(width: NourishSpacing.gutter),
                  Expanded(
                    child: _MacroTile(
                      label: Strings.macroFat,
                      grams: target.fatG,
                      fraction: 0.30,
                      color: NourishColors.tertiaryContainer,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: NourishSpacing.sectionGap),
              NourishButton(
                label: Strings.startTracking,
                onPressed: isBusy ? null : onStartTracking,
              ),
              const SizedBox(height: 16),
              Text(
                Strings.adjustNote,
                textAlign: TextAlign.center,
                style: NourishTextStyles.bodyMd.copyWith(
                  color: NourishColors.onSurfaceVariant.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MacroTile extends StatelessWidget {
  const _MacroTile({
    required this.label,
    required this.grams,
    required this.fraction,
    required this.color,
  });

  final String label;
  final int grams;
  final double fraction;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: <Widget>[
          Text(
            label,
            style: NourishTextStyles.labelCaps.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${grams}g',
            style: NourishTextStyles.headlineMd.copyWith(
              color: NourishColors.onBackground,
            ),
          ),
          const SizedBox(height: 12),
          NourishProgressBar(value: fraction, color: color, height: 6),
        ],
      ),
    );
  }
}

class _Unavailable extends StatelessWidget {
  const _Unavailable({required this.onBackToPrefs});

  final VoidCallback onBackToPrefs;

  @override
  Widget build(BuildContext context) {
    // Honest failure state: never show a fabricated number (ONB-08).
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(NourishSpacing.containerMargin),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Icon(
              Icons.error_outline,
              size: 40,
              color: NourishColors.tertiary,
            ),
            const SizedBox(height: 16),
            Text(
              Strings.targetUnavailableTitle,
              textAlign: TextAlign.center,
              style: NourishTextStyles.headlineMd.copyWith(
                color: NourishColors.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              Strings.targetUnavailableBody,
              textAlign: TextAlign.center,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            NourishButton(
              label: Strings.goBackLabel,
              onPressed: onBackToPrefs,
            ),
          ],
        ),
      ),
    );
  }
}
