import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../l10n/strings.dart';
import '../../../router/routes.dart';
import '../weight_providers.dart';
import '../weight_trend.dart';

/// WW-03 entry point on the Home dashboard: the latest weight and the neutral
/// trend line, opening the dedicated weight screen.
///
/// The value shown is the last thing the user logged. With nothing logged the
/// card says so and offers the first entry — it never shows a default or an
/// estimate.
class WeightCard extends ConsumerWidget {
  const WeightCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<WeightTrend> trend = ref.watch(weightTrendProvider);

    return NourishCard(
      padding: const EdgeInsets.all(NourishSpacing.containerMargin),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  Strings.weightTitle,
                  style: NourishTextStyles.headlineMd,
                ),
              ),
              const Icon(
                Icons.monitor_weight_outlined,
                size: 24,
                color: NourishColors.primary,
              ),
            ],
          ),
          const SizedBox(height: 12),
          trend.when(
            loading: () => const SizedBox(
              height: 32,
              child: Align(
                alignment: Alignment.centerLeft,
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    color: NourishColors.primary,
                  ),
                ),
              ),
            ),
            // An unreadable table is reported as unavailable rather than
            // rendered as "no entries", which would be a false statement.
            error: (Object error, StackTrace stack) => Text(
              Strings.weightUnavailableBody,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            data: (WeightTrend data) => _WeightSummary(trend: data),
          ),
          const SizedBox(height: 12),
          NourishButton(
            variant: NourishButtonVariant.secondary,
            label: trend.value?.isEmpty ?? true
                ? Strings.weightLogTitle.toUpperCase()
                : Strings.weightViewAction,
            onPressed: () => context.push(AppRoutes.weight),
          ),
        ],
      ),
    );
  }
}

class _WeightSummary extends StatelessWidget {
  const _WeightSummary({required this.trend});

  final WeightTrend trend;

  @override
  Widget build(BuildContext context) {
    if (trend.latestKg == null) {
      return Text(
        Strings.weightNoEntries,
        style: NourishTextStyles.bodyMd.copyWith(
          color: NourishColors.onSurfaceVariant,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          Strings.weightKgValue(trend.latestKg!.toStringAsFixed(1)),
          style: NourishTextStyles.metricXl,
        ),
        const SizedBox(height: 4),
        Text(
          trend.isWithinNoise
              ? Strings.weightWithinNoise
              : describeWeightChange(trend),
          style: NourishTextStyles.bodyMd.copyWith(
            fontSize: 13,
            color: NourishColors.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
