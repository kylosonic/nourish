import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';
import '../../router/routes.dart';
import 'insights_providers.dart';
import 'weekly_insights.dart';

/// INS-01: the weekly insights dashboard.
///
/// Every figure aggregates the user's own logged meals for the trailing seven
/// days. There is no server aggregate, no model and no placeholder data: an
/// empty week shows an empty state, and an un-logged day is drawn as an
/// un-logged day rather than a zero (P-INS-1).
class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<WeeklyInsights> insights = ref.watch(
      weeklyInsightsProvider,
    );

    return SafeArea(
      child: insights.when(
        loading: () => const Center(
          child: CircularProgressIndicator(
            strokeWidth: 3,
            color: NourishColors.primary,
          ),
        ),
        error: (Object error, StackTrace stack) => _EmptyState(
          title: Strings.insightsUnavailableTitle,
          body: Strings.insightsUnavailableBody,
        ),
        data: (WeeklyInsights data) => data.isEmpty
            ? const _EmptyState(
                title: Strings.insightsEmptyTitle,
                body: Strings.insightsEmptyBody,
              )
            : _Dashboard(insights: data),
      ),
    );
  }
}

class _Dashboard extends StatelessWidget {
  const _Dashboard({required this.insights});

  final WeeklyInsights insights;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        NourishSpacing.containerMargin,
        NourishSpacing.base,
        NourishSpacing.containerMargin,
        NourishSpacing.sectionGap,
      ),
      children: <Widget>[
        Text(Strings.insightsTitle, style: NourishTextStyles.headlineLgMobile),
        const SizedBox(height: 4),
        Text(
          Strings.insightsSubtitle,
          style: NourishTextStyles.bodyMd.copyWith(
            color: NourishColors.onSurfaceVariant,
          ),
        ),
        if (insights.isPartial) ...<Widget>[
          const SizedBox(height: 8),
          // Honest about a window that has not finished yet.
          Text(
            Strings.insightsPartialWindow(
              insights.loggedDays,
              insights.windowDays,
            ),
            style: NourishTextStyles.labelCaps.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ],
        const SizedBox(height: NourishSpacing.sectionGap),
        _CaloricBalance(insights: insights),
        const SizedBox(height: NourishSpacing.sectionGap),
        _MacroAverages(insights: insights),
        const SizedBox(height: NourishSpacing.sectionGap),
        _Highlights(insights: insights),
        const SizedBox(height: NourishSpacing.sectionGap),
        _Diversity(insights: insights),
      ],
    );
  }
}

/// Caloric balance: seven bars, a dashed target line, over-target days flagged.
class _CaloricBalance extends StatelessWidget {
  const _CaloricBalance({required this.insights});

  final WeeklyInsights insights;

  @override
  Widget build(BuildContext context) {
    // The tallest of (any day, the target) sets the scale, so the target line is
    // always on screen and a bar cannot be silently clipped.
    final double peak = <double>[
      insights.targetKcal.toDouble(),
      ...insights.days.map((DayInsight d) => d.kcal),
    ].reduce((double a, double b) => a > b ? a : b);
    final double scale = peak <= 0 ? 1 : peak * 1.15;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(
          Strings.insightsCaloricBalance,
          style: NourishTextStyles.headlineMd,
        ),
        const SizedBox(height: 12),
        NourishCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              SizedBox(
                height: 160,
                child: Stack(
                  children: <Widget>[
                    if (insights.targetKcal > 0)
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 160 * (insights.targetKcal / scale),
                        // Height only: the Positioned's left/right already give
                        // this a tight width, and an infinite width here is an
                        // unbounded-constraint error.
                        child: CustomPaint(
                          painter: _DashedLinePainter(
                            color: NourishColors.primary.withValues(alpha: 0.5),
                          ),
                          child: const SizedBox(height: 1),
                        ),
                      ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: <Widget>[
                        for (final DayInsight day in insights.days)
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 3),
                              child: _DayBar(day: day, scale: scale),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  for (final DayInsight day in insights.days)
                    Expanded(
                      child: Text(
                        day.weekdayLabel,
                        textAlign: TextAlign.center,
                        style: NourishTextStyles.labelCaps.copyWith(
                          color: NourishColors.onSurfaceVariant,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: <Widget>[
                  _LegendDot(color: NourishColors.primaryContainer),
                  const SizedBox(width: 6),
                  Text(
                    Strings.insightsLegendLogged,
                    style: NourishTextStyles.bodyMd.copyWith(
                      fontSize: 13,
                      color: NourishColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 16),
                  _LegendDot(color: NourishColors.error),
                  const SizedBox(width: 6),
                  Text(
                    Strings.insightsLegendOver,
                    style: NourishTextStyles.bodyMd.copyWith(
                      fontSize: 13,
                      color: NourishColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 16),
                  _LegendDot(color: NourishColors.surfaceContainerHigh),
                  const SizedBox(width: 6),
                  Text(
                    Strings.insightsLegendUnlogged,
                    style: NourishTextStyles.bodyMd.copyWith(
                      fontSize: 13,
                      color: NourishColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DayBar extends StatelessWidget {
  const _DayBar({required this.day, required this.scale});

  final DayInsight day;
  final double scale;

  @override
  Widget build(BuildContext context) {
    // P-INS-1: a day with no logged meals gets no bar at all. It is not a zero.
    if (!day.logged) {
      return Tooltip(
        message: Strings.insightsUnloggedDay(day.weekdayLabel),
        child: Container(
          height: 4,
          decoration: BoxDecoration(
            color: NourishColors.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      );
    }

    final double height = (160 * (day.kcal / scale)).clamp(3, 160);
    return Tooltip(
      message: '${day.kcal.round()} ${Strings.kcalUnit} · ${day.weekdayLabel}',
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: day.exceededTarget
              ? NourishColors.error
              : NourishColors.primaryContainer,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
        ),
      ),
    );
  }
}

class _MacroAverages extends StatelessWidget {
  const _MacroAverages({required this.insights});

  final WeeklyInsights insights;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(
          Strings.insightsMacroAverages,
          style: NourishTextStyles.headlineMd,
        ),
        const SizedBox(height: 12),
        NourishCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: <Widget>[
              _MacroRow(
                label: Strings.macroProtein,
                averageG: insights.averageProteinG,
                targetG: insights.targetProteinG,
                color: NourishColors.primaryContainer,
              ),
              const SizedBox(height: 16),
              _MacroRow(
                label: Strings.macroCarbs,
                averageG: insights.averageCarbsG,
                targetG: insights.targetCarbsG,
                color: NourishColors.secondaryContainer,
              ),
              const SizedBox(height: 16),
              _MacroRow(
                label: Strings.macroFat,
                averageG: insights.averageFatG,
                targetG: insights.targetFatG,
                color: NourishColors.tertiaryContainer,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MacroRow extends StatelessWidget {
  const _MacroRow({
    required this.label,
    required this.averageG,
    required this.targetG,
    required this.color,
  });

  final String label;
  final double averageG;
  final int targetG;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final int percent = targetG <= 0
        ? 0
        : ((averageG / targetG) * 100).round().clamp(0, 999);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
            Expanded(
              child: Text(label, style: NourishTextStyles.bodyLg),
            ),
            Text(
              '$percent%',
              style: NourishTextStyles.bodyLg.copyWith(color: color),
            ),
          ],
        ),
        const SizedBox(height: 6),
        NourishProgressBar(
          value: (percent / 100).clamp(0.0, 1.0),
          color: color,
        ),
        const SizedBox(height: 4),
        Text(
          Strings.macroAverageLine(averageG.round(), targetG),
          style: NourishTextStyles.bodyMd.copyWith(
            fontSize: 13,
            color: NourishColors.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _Highlights extends StatelessWidget {
  const _Highlights({required this.insights});

  final WeeklyInsights insights;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(Strings.insightsHighlights, style: NourishTextStyles.headlineMd),
        const SizedBox(height: 12),
        if (insights.highlights.isEmpty)
          Text(
            // No data-supported finding yet: say that, rather than praising.
            Strings.insightsNoHighlights,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        for (final InsightHighlight highlight in insights.highlights)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: NourishCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Icon(
                    switch (highlight.kind) {
                      HighlightKind.positive => Icons.check_circle,
                      HighlightKind.cautionary => Icons.warning_amber_rounded,
                      // A finding the data supports but the app cannot judge:
                      // the weight trend, whose direction is only good or bad
                      // relative to a goal the dashboard does not hold.
                      HighlightKind.informational => Icons.monitor_weight_outlined,
                    },
                    size: 20,
                    color: switch (highlight.kind) {
                      HighlightKind.positive => NourishColors.primaryContainer,
                      HighlightKind.cautionary => NourishColors.secondaryContainer,
                      HighlightKind.informational => NourishColors.onSurfaceVariant,
                    },
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          highlight.title,
                          style: NourishTextStyles.bodyLg,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          highlight.detail,
                          style: NourishTextStyles.bodyMd.copyWith(
                            fontSize: 14,
                            color: NourishColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _Diversity extends StatelessWidget {
  const _Diversity({required this.insights});

  final WeeklyInsights insights;

  @override
  Widget build(BuildContext context) {
    final double? ethiopianShare = insights.ethiopianShare;
    final int total = insights.days.fold<int>(
      0,
      (int sum, DayInsight d) =>
          sum + d.ethiopianItems + d.otherItems + d.unknownItems,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(
          Strings.insightsDietaryDiversity,
          style: NourishTextStyles.headlineMd,
        ),
        const SizedBox(height: 12),
        NourishCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                ethiopianShare == null
                    ? Strings.insightsDiversityUnknown
                    : Strings.insightsDiversitySummary(
                        (ethiopianShare * 100).round(),
                      ),
                style: NourishTextStyles.bodyMd.copyWith(
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
              if (ethiopianShare != null) ...<Widget>[
                const SizedBox(height: 12),
                NourishProgressBar(value: ethiopianShare),
                const SizedBox(height: 8),
                Text(
                  Strings.insightsDiversityCounts(total),
                  style: NourishTextStyles.labelCaps.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

/// A dashed rule for the target line (the design shows a dashed line, and a
/// solid one would read as another bar).
class _DashedLinePainter extends CustomPainter {
  const _DashedLinePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = color
      ..strokeWidth = 1;
    const double dash = 4;
    const double gap = 4;
    double x = 0;
    while (x < size.width) {
      canvas.drawLine(Offset(x, 0), Offset(x + dash, 0), paint);
      x += dash + gap;
    }
  }

  @override
  bool shouldRepaint(_DashedLinePainter oldDelegate) => oldDelegate.color != color;
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(NourishSpacing.containerMargin),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(
              Icons.lightbulb_outline,
              size: 40,
              color: NourishColors.onSurfaceVariant,
            ),
            const SizedBox(height: NourishSpacing.gutter),
            Text(
              title,
              textAlign: TextAlign.center,
              style: NourishTextStyles.headlineMd,
            ),
            const SizedBox(height: 8),
            Text(
              body,
              textAlign: TextAlign.center,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: NourishSpacing.gutter),
            NourishButton(
              label: Strings.insightsLogAMeal,
              onPressed: () => context.go(AppRoutes.home),
            ),
          ],
        ),
      ),
    );
  }
}
