import 'package:flutter/material.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

/// Onboarding progress bar with the blueprint §10 counter strategy:
/// fraction = step / total over counted steps only (T = 6 with pace,
/// 5 without). Supersedes the design's inconsistent percentages.
class OnboardingProgressBar extends StatelessWidget {
  const OnboardingProgressBar({
    super.key,
    required this.step,
    required this.total,
  });

  /// 1-based current step.
  final int step;

  /// Total counted steps for the current goal.
  final int total;

  @override
  Widget build(BuildContext context) {
    final double fraction = total <= 0 ? 0 : step / total;
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: NourishSpacing.containerMargin,
      ),
      child: NourishProgressBar(value: fraction),
    );
  }
}
