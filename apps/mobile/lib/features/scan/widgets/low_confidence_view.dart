import 'package:flutter/material.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../l10n/strings.dart';
import '../analysis_controller.dart';

/// SCAN-06: low-confidence resolution.
///
/// Candidates come from the catalog (never from the model), and the escape
/// hatch is always reachable: with no candidates the screen offers only the
/// manual search, and the result view's edit sheet remains the fallback.
class LowConfidenceView extends StatelessWidget {
  const LowConfidenceView({
    super.key,
    required this.state,
    required this.onCancel,
    required this.onSearchManually,
  });

  final AnalysisFlowState state;
  final VoidCallback onCancel;
  final VoidCallback onSearchManually;

  @override
  Widget build(BuildContext context) {
    final int percent = (state.result!.overallConfidence * 100).round();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(
            NourishSpacing.containerMargin,
            8,
            NourishSpacing.containerMargin,
            0,
          ),
          child: Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  '${Strings.lowConfidenceBadge} · $percent%',
                  style: NourishTextStyles.labelCaps.copyWith(
                    color: NourishColors.tertiary,
                  ),
                ),
              ),
              IconButton(
                tooltip: Strings.closeTooltip,
                icon: const Icon(Icons.close),
                color: NourishColors.onSurfaceVariant,
                onPressed: onCancel,
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(
              horizontal: NourishSpacing.containerMargin,
            ),
            children: <Widget>[
              const SizedBox(height: 8),
              Text(Strings.lowConfidenceTitle, style: NourishTextStyles.headlineMd),
              const SizedBox(height: 8),
              Text(
                Strings.lowConfidenceBody,
                style: NourishTextStyles.bodyMd.copyWith(
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: NourishSpacing.gutter),
              if (state.result!.candidates.isEmpty)
                Text(
                  Strings.noCandidates,
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
              for (final candidate in state.result!.candidates)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: NourishCard(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            candidate.displayName,
                            style: NourishTextStyles.bodyLg,
                          ),
                        ),
                        TextButton(
                          onPressed: onSearchManually,
                          child: const Text(Strings.select),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: NourishSpacing.gutter),
              for (final String note in state.result!.notes)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    note,
                    style: NourishTextStyles.bodyMd.copyWith(
                      color: NourishColors.onSurfaceVariant,
                    ),
                  ),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(NourishSpacing.containerMargin),
          child: NourishButton(
            label: Strings.searchManually,
            onPressed: onSearchManually,
          ),
        ),
      ],
    );
  }
}
