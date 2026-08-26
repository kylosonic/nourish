import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../l10n/strings.dart';
import '../../providers.dart';
import 'onboarding_controller.dart';
import 'widgets/progress_bar.dart';
import 'widgets/step_header.dart';

/// Transactional wizard scaffold shared by every counted onboarding step:
/// step header (back / `STEP n OF T` / skip slot), computed progress
/// bar, scrollable content and a fixed bottom action bar. The navigation
/// shell is suppressed (no app bar, no bottom nav).
class OnboardingFlow extends ConsumerStatefulWidget {
  const OnboardingFlow({
    super.key,
    required this.step,
    this.onBack,
    this.skip,
    required this.actionBar,
    required this.child,
  });

  final OnboardingStep step;
  final VoidCallback? onBack;
  final Widget? skip;
  final Widget actionBar;
  final Widget child;

  @override
  ConsumerState<OnboardingFlow> createState() => _OnboardingFlowState();
}

class _OnboardingFlowState extends ConsumerState<OnboardingFlow> {
  @override
  void initState() {
    super.initState();
    // Hydrate the draft from persistence (ONB-09 resume). Idempotent:
    // load() no-ops once the state is loaded.
    Future<void>.microtask(() async {
      await ref.read(onboardingControllerProvider.notifier).load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final OnboardingState onboarding = ref.watch(onboardingControllerProvider);
    final Goal? goal = onboarding.profile?.goal;
    final int n = OnboardingController.stepNumber(widget.step, goal);
    final int total = OnboardingController.totalStepsFor(goal);

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            StepHeader(
              onBack: widget.onBack,
              label: Strings.stepOf(n, total),
              skip: widget.skip,
            ),
            const SizedBox(height: 16),
            OnboardingProgressBar(step: n, total: total),
            const SizedBox(height: 24),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: NourishSpacing.containerMargin,
                ),
                child: widget.child,
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(
                NourishSpacing.containerMargin,
                NourishSpacing.base,
                NourishSpacing.containerMargin,
                NourishSpacing.gutter,
              ),
              decoration: BoxDecoration(
                color: NourishColors.background.withValues(alpha: 0.9),
                border: const Border(
                  top: BorderSide(color: NourishColors.surfaceContainer),
                ),
              ),
              child: widget.actionBar,
            ),
          ],
        ),
      ),
    );
  }
}
