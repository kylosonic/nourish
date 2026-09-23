import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../core/formatters.dart';
import '../../../core/water_target.dart';
import '../../../l10n/strings.dart';
import '../../../providers.dart';

/// HOME-04 / WW-01 hydration card: `X.X/Y.Y L`, progress bar, add 250 ml,
/// remove (floor 0) and the adjustable daily goal.
///
/// The stream is the single source of truth, so a failed persistence never
/// alters the UI (revert) — the user gets an error snackbar and can retry.
/// Adjusting the goal writes only the profile's water target; the day's logs
/// are untouched (the new goal applies from today, WW-01).
class HydrationCard extends ConsumerWidget {
  const HydrationCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<WaterDay> water = ref.watch(todayWaterProvider);
    // The goal is a separate read so stepping it does not recreate the day's
    // stream (which would blank the card to a spinner on every tap).
    final int targetMl = ref.watch(waterTargetProvider);
    final ScaffoldMessengerState messenger = ScaffoldMessenger.of(context);

    Future<void> addWater() async {
      try {
        await ref.read(waterRepositoryProvider).addMl();
      } catch (_) {
        messenger.showSnackBar(
          const SnackBar(content: Text(Strings.waterSaveFailed)),
        );
      }
    }

    Future<void> removeWater() async {
      try {
        await ref.read(waterRepositoryProvider).removeMl();
      } catch (_) {
        messenger.showSnackBar(
          const SnackBar(content: Text(Strings.waterSaveFailed)),
        );
      }
    }

    Future<void> adjustTarget(int steps) async {
      try {
        await ref.read(waterTargetProvider.notifier).step(steps);
      } catch (_) {
        messenger.showSnackBar(
          const SnackBar(content: Text(Strings.waterTargetSaveFailed)),
        );
      }
    }

    return Container(
      padding: const EdgeInsets.all(NourishSpacing.containerMargin),
      decoration: BoxDecoration(
        color: NourishColors.primary,
        borderRadius: BorderRadius.circular(32),
        boxShadow: NourishElevation.level1,
      ),
      child: water.when(
        loading: () => const SizedBox(
          height: 140,
          child: Center(
            child: SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: Colors.white,
              ),
            ),
          ),
        ),
        error: (Object error, StackTrace stack) => _WaterContent(
          consumedMl: 0,
          targetMl: targetMl,
          onAdd: addWater,
          onRemove: removeWater,
          onAdjustTarget: adjustTarget,
        ),
        data: (WaterDay day) => _WaterContent(
          consumedMl: day.consumedMl,
          targetMl: targetMl,
          onAdd: addWater,
          onRemove: removeWater,
          onAdjustTarget: adjustTarget,
        ),
      ),
    );
  }
}

class _WaterContent extends StatelessWidget {
  const _WaterContent({
    required this.consumedMl,
    required this.targetMl,
    required this.onAdd,
    required this.onRemove,
    required this.onAdjustTarget,
  });

  final int consumedMl;
  final int targetMl;
  final VoidCallback onAdd;
  final VoidCallback onRemove;
  final ValueChanged<int> onAdjustTarget;

  @override
  Widget build(BuildContext context) {
    final double fraction = targetMl <= 0
        ? 0
        : (consumedMl / targetMl).clamp(0.0, 1.0);
    final bool atFloor = consumedMl <= 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Row(
          children: <Widget>[
            Expanded(
              child: Text(
                Strings.hydration,
                style: NourishTextStyles.headlineMd.copyWith(
                  color: Colors.white,
                ),
              ),
            ),
            const Icon(Icons.water_drop, size: 28, color: Colors.white70),
          ],
        ),
        const SizedBox(height: NourishSpacing.sectionGap),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: <Widget>[
            Text(
              formatLiters(consumedMl),
              style: NourishTextStyles.metricXl.copyWith(color: Colors.white),
            ),
            const SizedBox(width: 4),
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                '/ ${formatLiters(targetMl)} L',
                style: NourishTextStyles.headlineMd.copyWith(
                  color: Colors.white70,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: SizedBox(
            height: 12,
            child: Stack(
              fit: StackFit.expand,
              children: <Widget>[
                ColoredBox(color: Colors.white24),
                FractionallySizedBox(
                  widthFactor: fraction,
                  child: const ColoredBox(color: Colors.white),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: NourishSpacing.gutter),
        Row(
          children: <Widget>[
            IconButton(
              tooltip: Strings.removeWaterTooltip,
              onPressed: atFloor ? null : onRemove,
              style: _controlStyle,
              icon: const Icon(Icons.remove),
            ),
            const Spacer(),
            FilledButton.icon(
              onPressed: onAdd,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: NourishColors.primary,
                textStyle: NourishTextStyles.labelCaps,
                padding: const EdgeInsets.symmetric(horizontal: 20),
              ),
              icon: const Icon(Icons.add, size: 18),
              label: Text(Strings.add250ml.toUpperCase()),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // The goal itself (WW-01): a glass at a time, disabled at the bounds
        // rather than silently ignoring a tap.
        Row(
          children: <Widget>[
            Text(
              Strings.waterGoalLabel,
              style: NourishTextStyles.labelCaps.copyWith(color: Colors.white70),
            ),
            const Spacer(),
            IconButton(
              tooltip: Strings.waterGoalDownTooltip,
              onPressed: canAdjustWaterTargetMl(targetMl, -1)
                  ? () => onAdjustTarget(-1)
                  : null,
              style: _controlStyle,
              icon: const Icon(Icons.remove, size: 18),
            ),
            Text(
              formatLiters(targetMl),
              style: NourishTextStyles.labelCaps.copyWith(color: Colors.white),
            ),
            IconButton(
              tooltip: Strings.waterGoalUpTooltip,
              onPressed: canAdjustWaterTargetMl(targetMl, 1)
                  ? () => onAdjustTarget(1)
                  : null,
              style: _controlStyle,
              icon: const Icon(Icons.add, size: 18),
            ),
          ],
        ),
      ],
    );
  }

  static final ButtonStyle _controlStyle = IconButton.styleFrom(
    backgroundColor: Colors.white24,
    foregroundColor: Colors.white,
    disabledBackgroundColor: Colors.white10,
    disabledForegroundColor: Colors.white38,
  );
}
