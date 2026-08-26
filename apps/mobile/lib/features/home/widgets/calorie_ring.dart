import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../providers.dart';
import '../../../router/routes.dart';

/// HOME-02 calorie visualization: ring + "Calories Left".
///
/// The ring fraction is clamped to 0..1 (no >100% wrap). Over-target
/// days switch to the amber/red treatment and show the overage
/// honestly (negative "left" is displayed as-is with an OVER TARGET
/// label). A missing target shows a setup prompt — NEVER invented
/// zeroes.
class CalorieRingCard extends ConsumerWidget {
  const CalorieRingCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<DailyTarget?> target = ref.watch(
      activeDailyTargetProvider,
    );
    final HomeDashboardData data = ref.watch(homeDashboardProvider);

    return NourishCard(
      radius: 32,
      padding: const EdgeInsets.symmetric(
        horizontal: NourishSpacing.containerMargin,
        vertical: NourishSpacing.sectionGap,
      ),
      child: target.when(
        loading: () => const SizedBox(
          height: 220,
          child: Center(
            child: SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: NourishColors.primary,
              ),
            ),
          ),
        ),
        error: (Object error, StackTrace stack) => SizedBox(
          height: 220,
          child: Center(
            child: Text(
              Strings.dashboardLoadFailed,
              textAlign: TextAlign.center,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
          ),
        ),
        data: (DailyTarget? value) => value == null
            ? _SetupPrompt()
            : _Ring(data: data, targetKcal: value.targetKcal),
      ),
    );
  }
}

class _Ring extends StatelessWidget {
  const _Ring({required this.data, required this.targetKcal});

  final HomeDashboardData data;
  final int targetKcal;

  @override
  Widget build(BuildContext context) {
    final double left = data.caloriesLeft ?? 0;
    final bool over = data.isOverTarget;
    final Color accent = over
        ? NourishColors.secondaryContainer
        : NourishColors.primary;
    final Color valueColor = over
        ? NourishColors.tertiary
        : NourishColors.primary;

    return Column(
      children: <Widget>[
        SizedBox(
          width: 200,
          height: 200,
          child: Stack(
            alignment: Alignment.center,
            children: <Widget>[
              CustomPaint(
                size: const Size(200, 200),
                painter: _RingPainter(
                  fraction: data.ringFraction,
                  trackColor: NourishColors.surfaceContainer,
                  progressColor: accent,
                ),
              ),
              Container(
                width: 128,
                height: 128,
                decoration: const BoxDecoration(
                  color: NourishColors.surface,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    Text(
                      formatKcal(left),
                      style: NourishTextStyles.metricXl.copyWith(
                        color: valueColor,
                        fontSize: 34,
                      ),
                    ),
                    Text(
                      over
                          ? Strings.caloriesOver.toUpperCase()
                          : Strings.caloriesLeft.toUpperCase(),
                      style: NourishTextStyles.labelCaps.copyWith(
                        color: over
                            ? NourishColors.tertiary
                            : NourishColors.onSurfaceVariant,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: NourishSpacing.gutter),
        Text(
          '${formatKcalInt(data.consumedKcal.round())} / '
          '${formatKcalInt(targetKcal)} ${Strings.kcalUnit}',
          style: NourishTextStyles.labelCaps.copyWith(
            color: NourishColors.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _SetupPrompt extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        const SizedBox(height: 16),
        const Icon(
          Icons.flag_circle_outlined,
          size: 44,
          color: NourishColors.primary,
        ),
        const SizedBox(height: 16),
        Text(
          Strings.setupPromptTitle,
          textAlign: TextAlign.center,
          style: NourishTextStyles.headlineMd.copyWith(
            color: NourishColors.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          Strings.setupPromptBody,
          textAlign: TextAlign.center,
          style: NourishTextStyles.bodyMd.copyWith(
            color: NourishColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 24),
        NourishButton(
          label: Strings.finishSetup,
          onPressed: () => context.go(AppRoutes.onboardingDailyTarget),
        ),
      ],
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.fraction,
    required this.trackColor,
    required this.progressColor,
  });

  final double fraction;
  final Color trackColor;
  final Color progressColor;

  @override
  void paint(Canvas canvas, Size size) {
    const double strokeWidth = 8;
    final Offset center = Offset(size.width / 2, size.height / 2);
    final double radius = math.min(size.width, size.height) / 2 - strokeWidth;
    final Rect rect = Rect.fromCircle(center: center, radius: radius);

    final Paint track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..color = trackColor;
    canvas.drawCircle(center, radius, track);

    final double sweep = fraction.clamp(0.0, 1.0) * 2 * math.pi;
    if (sweep > 0) {
      final Paint progress = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..color = progressColor;
      canvas.drawArc(rect, -math.pi / 2, sweep, false, progress);
    }
  }

  @override
  bool shouldRepaint(_RingPainter oldDelegate) {
    return oldDelegate.fraction != fraction ||
        oldDelegate.trackColor != trackColor ||
        oldDelegate.progressColor != progressColor;
  }
}
