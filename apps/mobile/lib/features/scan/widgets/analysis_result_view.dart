import 'package:flutter/material.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../../data/models/analysis_result.dart';
import '../../../l10n/strings.dart';
import '../analysis_controller.dart';

/// SCAN-05: the AI result and confirmation.
///
/// Every number shown here is either the deterministic engine's output for the
/// current portion (recomputed locally as the user edits) or, for an item the
/// local catalog could not resolve, nothing at all — such an item is flagged
/// and CONFIRM stays disabled until it is replaced or removed (SCAN-07).
class AnalysisResultView extends StatelessWidget {
  const AnalysisResultView({
    super.key,
    required this.state,
    required this.slot,
    required this.onCancel,
    required this.onEdit,
    required this.onSearchFood,
    required this.onConfirm,
  });

  final AnalysisFlowState state;
  final MealSlot slot;
  final VoidCallback onCancel;
  final VoidCallback onEdit;
  final VoidCallback onSearchFood;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    final AnalysisNutrition totals = state.totals;
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
                  Strings.scanComplete,
                  style: NourishTextStyles.labelCaps.copyWith(
                    color: NourishColors.primary,
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
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      Strings.confidenceLine(
                        state.result!.confidenceState,
                        percent,
                      ),
                      style: NourishTextStyles.labelCaps.copyWith(
                        color: NourishColors.onSurfaceVariant,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: onEdit,
                    child: const Text(Strings.adjust),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                Strings.mealSummary,
                style: NourishTextStyles.headlineMd,
              ),
              const SizedBox(height: 8),
              NourishCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: <Widget>[
                        Text(
                          '~ ${totals.kcal.round()}',
                          style: NourishTextStyles.metricXl,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'kcal',
                          style: NourishTextStyles.bodyMd.copyWith(
                            color: NourishColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _MacroBar(
                      label: 'Protein',
                      grams: totals.proteinG,
                      color: NourishColors.primary,
                    ),
                    _MacroBar(
                      label: 'Carbs',
                      grams: totals.carbsG,
                      color: NourishColors.secondaryContainer,
                    ),
                    _MacroBar(
                      label: 'Fat',
                      grams: totals.fatG,
                      color: NourishColors.tertiaryContainer,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: NourishSpacing.sectionGap),
              Text(
                Strings.detectedIngredients,
                style: NourishTextStyles.labelCaps.copyWith(
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              for (int i = 0; i < state.items.length; i++)
                _IngredientRow(
                  item: state.items[i],
                  onReplace: onSearchFood,
                ),
              for (final String note in state.result!.notes)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              NourishButton(
                label: state.phase == AnalysisPhase.saving
                    ? Strings.saving
                    : Strings.confirmMeal,
                onPressed:
                    state.canConfirm && state.phase != AnalysisPhase.saving
                        ? onConfirm
                        : null,
              ),
              const SizedBox(height: 8),
              NourishButton(
                label: Strings.edit,
                variant: NourishButtonVariant.secondary,
                onPressed: onEdit,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _IngredientRow extends StatelessWidget {
  const _IngredientRow({required this.item, required this.onReplace});

  final AnalysisDraftItem item;
  final VoidCallback onReplace;

  @override
  Widget build(BuildContext context) {
    final AnalysisNutrition? nutrition = item.nutrition;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: NourishCard(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    item.localFood?.canonicalName ?? item.displayName,
                    style: NourishTextStyles.bodyLg,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _portionLabel(item),
                    style: NourishTextStyles.bodyMd.copyWith(
                      color: NourishColors.onSurfaceVariant,
                    ),
                  ),
                  if (!item.isLoggable) ...<Widget>[
                    const SizedBox(height: 6),
                    Text(
                      Strings.itemUnresolved,
                      style: NourishTextStyles.bodyMd.copyWith(
                        color: NourishColors.tertiary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    TextButton(
                      onPressed: onReplace,
                      child: const Text(Strings.replaceItem),
                    ),
                  ],
                ],
              ),
            ),
            if (nutrition != null)
              Flexible(
                child: Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: Text(
                    Strings.approximateKcal(nutrition.kcal.round()),
                    textAlign: TextAlign.right,
                    overflow: TextOverflow.ellipsis,
                    style: NourishTextStyles.bodyMd.copyWith(
                      color: NourishColors.onSurface,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _portionLabel(AnalysisDraftItem item) {
    final double? grams = item.grams;
    final String portion =
        '${_trim(item.amount)} ${item.unit}';
    final String estimated = item.portionEstimated ? ' (estimated)' : '';
    return grams == null ? portion + estimated : '$portion · ${Strings.grams(grams)}$estimated';
  }

  static String _trim(double value) =>
      value == value.roundToDouble() ? value.round().toString() : value.toString();
}

class _MacroBar extends StatelessWidget {
  const _MacroBar({required this.label, required this.grams, required this.color});

  final String label;
  final double grams;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: <Widget>[
          SizedBox(
            width: 64,
            child: Text(
              label,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (grams / 120).clamp(0.0, 1.0),
                minHeight: 8,
                backgroundColor: NourishColors.surfaceContainerHigh,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 48,
            child: Text(
              '${grams.round()} g',
              textAlign: TextAlign.right,
              style: NourishTextStyles.bodyMd,
            ),
          ),
        ],
      ),
    );
  }
}
