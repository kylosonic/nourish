import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../providers.dart';

/// LOG-06 Daily Summary cards: Calories (with "OF target" progress) and
/// P/C/F totals for the selected date. Totals come from the immutable
/// snapshots of the day's meals, not the live catalog.
class DailySummaryCards extends ConsumerWidget {
  const DailySummaryCards({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Meal>> meals = ref.watch(historyMealsProvider);
    final NutritionTotals totals = ref.watch(historyTotalsProvider);
    final DailyTarget? target = ref.watch(activeDailyTargetProvider).value;

    final bool loading = meals.isLoading;

    final double calorieFraction = target == null || target.targetKcal <= 0
        ? 0
        : (totals.kcal / target.targetKcal).clamp(0.0, 1.0);
    final double proteinFraction = target == null || target.proteinG <= 0
        ? 0
        : (totals.protein / target.proteinG).clamp(0.0, 1.0);
    final double carbsFraction = target == null || target.carbsG <= 0
        ? 0
        : (totals.carbs / target.carbsG).clamp(0.0, 1.0);
    final double fatFraction = target == null || target.fatG <= 0
        ? 0
        : (totals.fat / target.fatG).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          Strings.dailySummary,
          style: NourishTextStyles.headlineMd.copyWith(
            color: NourishColors.onSurface,
          ),
        ),
        const SizedBox(height: NourishSpacing.gutter),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Expanded(
              flex: 2,
              child: NourishCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            Strings.caloriesCaps,
                            style: NourishTextStyles.labelCaps.copyWith(
                              color: NourishColors.onSurfaceVariant,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.local_fire_department,
                          size: 20,
                          color: NourishColors.primaryContainer,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: <Widget>[
                        Text(
                          loading
                              ? '—'
                              : formatKcalInt(totals.kcal.round()),
                          style: NourishTextStyles.metricXl.copyWith(
                            color: NourishColors.onSurface,
                            fontSize: 32,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          Strings.kcalUnit,
                          style: NourishTextStyles.bodyMd.copyWith(
                            color: NourishColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    NourishProgressBar(
                      value: calorieFraction,
                      color: NourishColors.primaryContainer,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      target == null
                          ? '—'
                          : Strings.ofTarget(formatKcalInt(target.targetKcal)),
                      textAlign: TextAlign.right,
                      style: NourishTextStyles.labelCaps.copyWith(
                        color: NourishColors.outline,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: NourishSpacing.gutter),
            Expanded(
              child: _MacroSummaryCard(
                label: Strings.macroProtein,
                grams: totals.protein,
                fraction: proteinFraction,
                color: NourishColors.primaryFixedDim,
                loading: loading,
              ),
            ),
          ],
        ),
        const SizedBox(height: NourishSpacing.gutter),
        Row(
          children: <Widget>[
            Expanded(
              child: _MacroSummaryCard(
                label: Strings.macroCarbs,
                grams: totals.carbs,
                fraction: carbsFraction,
                color: NourishColors.secondaryContainer,
                loading: loading,
              ),
            ),
            const SizedBox(width: NourishSpacing.gutter),
            Expanded(
              child: _MacroSummaryCard(
                label: Strings.macroFat,
                grams: totals.fat,
                fraction: fatFraction,
                color: NourishColors.tertiaryContainer,
                loading: loading,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _MacroSummaryCard extends StatelessWidget {
  const _MacroSummaryCard({
    required this.label,
    required this.grams,
    required this.fraction,
    required this.color,
    required this.loading,
  });

  final String label;
  final double grams;
  final double fraction;
  final Color color;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            label,
            style: NourishTextStyles.labelCaps.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            loading ? '—' : '${formatGrams(grams)}g',
            style: NourishTextStyles.headlineLgMobile.copyWith(
              color: NourishColors.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          NourishProgressBar(value: fraction, color: color, height: 6),
        ],
      ),
    );
  }
}
