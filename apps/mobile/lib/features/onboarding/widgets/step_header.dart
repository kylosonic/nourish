import 'package:flutter/material.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../l10n/strings.dart';

/// Onboarding step header: back control, centered `STEP n OF T` label and
/// a skip slot (blueprint §10: runtime-computed counters, welcome and
/// daily-target carry none).
class StepHeader extends StatelessWidget {
  const StepHeader({
    super.key,
    this.onBack,
    required this.label,
    this.skip,
  });

  final VoidCallback? onBack;

  /// e.g. `STEP 2 OF 6`.
  final String label;

  /// Skip control (pace step only); hidden elsewhere.
  final Widget? skip;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        NourishSpacing.gutter,
        NourishSpacing.base,
        NourishSpacing.gutter,
        0,
      ),
      child: Row(
        children: <Widget>[
          IconButton(
            tooltip: Strings.backTooltip,
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back),
            style: IconButton.styleFrom(
              backgroundColor: NourishColors.surfaceContainer,
              foregroundColor: NourishColors.onSurface,
            ),
          ),
          Expanded(
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: NourishTextStyles.labelCaps.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
          ),
          SizedBox(width: 40, height: 40, child: Center(child: skip)),
        ],
      ),
    );
  }
}
