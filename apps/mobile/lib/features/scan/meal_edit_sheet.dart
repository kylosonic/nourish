import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../data/models/analysis_result.dart';
import '../../l10n/strings.dart';
import '../../providers.dart';
import '../../router/routes.dart';
import 'analysis_controller.dart';

/// SCAN-07: edit before save.
///
/// P-SCAN-1 (no Stitch screen exists) — this bottom sheet is built from the
/// design system and implements exactly the minimum contents the behavior
/// contract requires: per-item identity (swap via search), portion amount and
/// unit, remove, add, and a live-updating total. Tracked as PPA-10 for human
/// sign-off. Portion edits recompute through the domain engines; the AI is
/// never re-invoked.
Future<void> showMealEditSheet(BuildContext context, WidgetRef ref) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: NourishColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
    ),
    builder: (BuildContext sheetContext) => const _MealEditSheet(),
  );
}

class _MealEditSheet extends ConsumerWidget {
  const _MealEditSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AnalysisFlowState state = ref.watch(analysisControllerProvider);
    final AnalysisController controller = ref.read(
      analysisControllerProvider.notifier,
    );
    final AnalysisNutrition totals = state.totals;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: NourishSpacing.containerMargin,
          right: NourishSpacing.containerMargin,
          bottom: MediaQuery.of(context).viewInsets.bottom +
              NourishSpacing.containerMargin,
          top: 12,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Center(
                child: Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: NourishColors.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(Strings.editMealTitle, style: NourishTextStyles.headlineMd),
              const SizedBox(height: 4),
              Text(
                '~ ${totals.kcal.round()} kcal · ${totals.proteinG.round()} P · '
                '${totals.carbsG.round()} C · ${totals.fatG.round()} F',
                style: NourishTextStyles.bodyMd.copyWith(
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: NourishSpacing.gutter),
              for (int i = 0; i < state.items.length; i++)
                _EditableItem(
                  index: i,
                  item: state.items[i],
                  onAmount: (double amount) => controller.setAmount(i, amount),
                  onUnit: (PortionUnit unit) => controller.setUnit(i, unit),
                  onRemove: () => controller.removeItem(i),
                  onReplace: () {
                    Navigator.of(context).pop();
                    context.push(AppRoutes.searchFood);
                  },
                ),
              const SizedBox(height: 8),
              NourishButton(
                label: Strings.addItemLabel,
                variant: NourishButtonVariant.secondary,
                onPressed: () {
                  Navigator.of(context).pop();
                  context.push(AppRoutes.searchFood);
                },
              ),
              const SizedBox(height: 8),
              NourishButton(
                label: Strings.done,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A selectable portion-unit chip. `NourishChip` is a display primitive with no
/// interaction, so the selectable variant is built here from the same tokens.
class _UnitChoice extends StatelessWidget {
  const _UnitChoice({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? NourishColors.primary.withValues(alpha: 0.12)
          : NourishColors.surfaceContainerHigh,
      borderRadius: BorderRadius.circular(NourishRadii.pill),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(NourishRadii.pill),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Text(
            label,
            style: NourishTextStyles.labelCaps.copyWith(
              color: selected ? NourishColors.primary : NourishColors.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}

class _EditableItem extends StatelessWidget {
  const _EditableItem({
    required this.index,
    required this.item,
    required this.onAmount,
    required this.onUnit,
    required this.onRemove,
    required this.onReplace,
  });

  final int index;
  final AnalysisDraftItem item;
  final ValueChanged<double> onAmount;
  final ValueChanged<PortionUnit> onUnit;
  final VoidCallback onRemove;
  final VoidCallback onReplace;

  @override
  Widget build(BuildContext context) {
    final Food? food = item.localFood;
    final List<PortionUnit> units = <PortionUnit>{
      if (food != null) ...food.portions.map((Portion p) => p.unit),
      if (item.portionUnit != null) item.portionUnit!,
    }.toList();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: NourishCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    food?.canonicalName ?? item.displayName,
                    style: NourishTextStyles.bodyLg,
                  ),
                ),
                IconButton(
                  tooltip: Strings.removeItemTooltip,
                  icon: const Icon(Icons.delete_outline, size: 20),
                  color: NourishColors.tertiary,
                  onPressed: onRemove,
                ),
              ],
            ),
            if (!item.isLoggable) ...<Widget>[
              Text(
                Strings.itemUnresolved,
                style: NourishTextStyles.bodyMd.copyWith(
                  color: NourishColors.tertiary,
                ),
              ),
              TextButton(
                onPressed: onReplace,
                child: const Text(Strings.replaceItem),
              ),
            ] else ...<Widget>[
              Text(
                Strings.portionLabel,
                style: NourishTextStyles.labelCaps.copyWith(
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: <Widget>[
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline),
                    onPressed: item.amount > 0.5
                        ? () => onAmount(item.amount - 0.5)
                        : null,
                  ),
                  SizedBox(
                    width: 44,
                    child: Text(
                      item.amount == item.amount.roundToDouble()
                          ? item.amount.round().toString()
                          : item.amount.toString(),
                      textAlign: TextAlign.center,
                      style: NourishTextStyles.bodyLg,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline),
                    onPressed: () => onAmount(item.amount + 0.5),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: <Widget>[
                        for (final PortionUnit unit in units)
                          _UnitChoice(
                            label: unit.name,
                            selected: unit == item.portionUnit,
                            onTap: () => onUnit(unit),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              if (item.grams != null)
                Text(
                  Strings.grams(item.grams!),
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
