import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';
import '../../providers.dart';
import 'weight_providers.dart';
import 'weight_trend.dart';

/// WW-03: weight logging and trend.
///
/// The behaviour contract fixes what is on this screen (current weight, target,
/// history, weekly/monthly trend) but no screen design exists yet, so the layout
/// follows the existing card and heading system and is recorded as PPA-13.
///
/// Two contract rules drive the visuals: entries are shown as what the scale
/// said (nothing is interpolated for days with no entry), and the copy never
/// treats normal day-to-day movement as progress or as a problem.
class WeightScreen extends ConsumerWidget {
  const WeightScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<WeightTrend> trend = ref.watch(weightTrendProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          Strings.weightTitle,
          style: TextStyle(color: NourishColors.primary),
        ),
        // Reached by push from the insights dashboard, so the stack normally
        // holds a screen to return to; a deep link has none and shows no
        // control rather than a button that cannot work.
        leading: context.canPop()
            ? IconButton(
                tooltip: Strings.backTooltip,
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            NourishSpacing.containerMargin,
            NourishSpacing.base,
            NourishSpacing.containerMargin,
            NourishSpacing.sectionGap,
          ),
          children: <Widget>[
            Text(
              Strings.weightSubtitle,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: NourishSpacing.sectionGap),
            trend.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    color: NourishColors.primary,
                  ),
                ),
              ),
              error: (Object error, StackTrace stack) => _Notice(
                title: Strings.weightUnavailableTitle,
                body: Strings.weightUnavailableBody,
              ),
              data: (WeightTrend data) => _TrendSection(trend: data),
            ),
            const SizedBox(height: NourishSpacing.sectionGap),
            const _LogWeightForm(),
            const SizedBox(height: NourishSpacing.sectionGap),
            const _HistorySection(),
          ],
        ),
      ),
    );
  }
}

class _TrendSection extends ConsumerWidget {
  const _TrendSection({required this.trend});

  final WeightTrend trend;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final WeightWindow window = ref.watch(selectedWeightWindowProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        _SummaryCard(trend: trend),
        const SizedBox(height: NourishSpacing.sectionGap),
        Text(Strings.weightTrendTitle, style: NourishTextStyles.headlineMd),
        const SizedBox(height: 12),
        SegmentedSelector<WeightWindow>(
          options: <SegmentedSelectorOption<WeightWindow>>[
            for (final WeightWindow option in WeightWindow.values)
              SegmentedSelectorOption<WeightWindow>(
                value: option,
                label: option.label,
              ),
          ],
          value: window,
          onChanged: (WeightWindow next) => ref
              .read(selectedWeightWindowProvider.notifier)
              .select(next),
        ),
        const SizedBox(height: 12),
        if (trend.isEmpty)
          NourishCard(
            padding: const EdgeInsets.all(16),
            child: Text(
              Strings.weightTrendEmpty,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
          )
        else
          NourishCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                WeightTrendChart(trend: trend),
                const SizedBox(height: 12),
                // WW-03 copy rule: neutral wording inside the ±0.5 kg noise
                // band, so a normal fluctuation never reads as a result.
                Text(
                  trend.isWithinNoise
                      ? Strings.weightWithinNoise
                      : describeWeightChange(trend),
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.trend});

  final WeightTrend trend;

  @override
  Widget build(BuildContext context) {
    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Expanded(
            child: _Metric(
              label: Strings.weightCurrent,
              value: trend.latestKg == null
                  ? Strings.weightNoEntries
                  : Strings.weightKgValue(
                      trend.latestKg!.toStringAsFixed(1),
                    ),
            ),
          ),
          Expanded(
            child: _Metric(
              label: Strings.weightTarget,
              value: trend.targetKg == null
                  ? Strings.weightTargetUnset
                  : Strings.weightKgValue(trend.targetKg!.toStringAsFixed(1)),
            ),
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label.toUpperCase(),
          style: NourishTextStyles.labelCaps.copyWith(
            color: NourishColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        Text(value, style: NourishTextStyles.headlineMd),
      ],
    );
  }
}

/// Bars are each logged day's own entries averaged (what the scale said), the
/// line is the trailing smoothed mean (the trend the user acts on). A day with
/// no entry draws nothing — it is not a zero.
class WeightTrendChart extends StatelessWidget {
  const WeightTrendChart({super.key, required this.trend});

  static const double chartHeight = 160;

  final WeightTrend trend;

  @override
  Widget build(BuildContext context) {
    final List<double> values = <double>[
      for (final WeightTrendPoint p in trend.points) ...<double>[
        p.meanKg,
        p.smoothedKg,
      ],
      if (trend.targetKg != null) trend.targetKg!,
    ];
    final double lowest = values.reduce((double a, double b) => a < b ? a : b);
    final double highest = values.reduce((double a, double b) => a > b ? a : b);
    // A flat week would otherwise fill the card and read as a huge change, so
    // the scale never spans less than 1 kg.
    final double span = (highest - lowest) < 1 ? 1 : highest - lowest;
    final double floor = lowest - (span - (highest - lowest)) / 2;

    double yFor(double kg) =>
        chartHeight * (1 - ((kg - floor) / span)).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        SizedBox(
          height: chartHeight,
          child: Stack(
            children: <Widget>[
              if (trend.targetKg != null)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: yFor(trend.targetKg!),
                  child: CustomPaint(
                    painter: WeightDashedLinePainter(
                      color: NourishColors.primary.withValues(alpha: 0.5),
                    ),
                    child: const SizedBox(height: 1),
                  ),
                ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: <Widget>[
                  for (final WeightTrendPoint point in trend.points)
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: Tooltip(
                          message:
                              '${point.dateKey} · '
                              '${Strings.weightKgValue(point.meanKg.toStringAsFixed(1))}',
                          child: Container(
                            height: chartHeight - yFor(point.meanKg),
                            decoration: BoxDecoration(
                              color: NourishColors.surfaceContainerHigh,
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(6),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              Positioned.fill(
                child: CustomPaint(
                  painter: WeightSmoothedLinePainter(
                    yValues: <double>[
                      for (final WeightTrendPoint p in trend.points)
                        yFor(p.smoothedKg),
                    ],
                    color: NourishColors.primaryContainer,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: <Widget>[
            for (final WeightTrendPoint point in trend.points)
              Expanded(
                child: Text(
                  point.dateKey.length >= 10
                      ? point.dateKey.substring(5)
                      : point.dateKey,
                  textAlign: TextAlign.center,
                  style: NourishTextStyles.labelCaps.copyWith(
                    color: NourishColors.onSurfaceVariant,
                    fontSize: 10,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: <Widget>[
            const _LegendDot(color: NourishColors.surfaceContainerHigh),
            const SizedBox(width: 6),
            Text(
              Strings.weightUnitKg,
              style: NourishTextStyles.bodyMd.copyWith(
                fontSize: 13,
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(width: 16),
            const _LegendDot(color: NourishColors.primaryContainer),
            const SizedBox(width: 6),
            Text(
              Strings.weightSmoothedLegend,
              style: NourishTextStyles.bodyMd.copyWith(
                fontSize: 13,
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            if (trend.targetKg != null) ...<Widget>[
              const SizedBox(width: 16),
              _LegendDot(
                color: NourishColors.primary.withValues(alpha: 0.5),
              ),
              const SizedBox(width: 6),
              Text(
                Strings.weightTargetLegend,
                style: NourishTextStyles.bodyMd.copyWith(
                  fontSize: 13,
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
            ],
          ],
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

class WeightSmoothedLinePainter extends CustomPainter {
  const WeightSmoothedLinePainter({required this.yValues, required this.color});

  /// Screen-space y for each point, in chart order.
  final List<double> yValues;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (yValues.isEmpty) return;
    final Paint paint = Paint()
      ..color = color
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final double step = size.width / yValues.length;
    if (yValues.length == 1) {
      canvas.drawCircle(
        Offset(step / 2, yValues.first),
        3,
        Paint()..color = color,
      );
      return;
    }
    final Path path = Path()
      ..moveTo(step / 2, yValues.first);
    for (int i = 1; i < yValues.length; i++) {
      path.lineTo(step * (i + 0.5), yValues[i]);
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(WeightSmoothedLinePainter oldDelegate) =>
      oldDelegate.color != color || !_sameValues(oldDelegate.yValues, yValues);

  static bool _sameValues(List<double> a, List<double> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}

class WeightDashedLinePainter extends CustomPainter {
  const WeightDashedLinePainter({required this.color});

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
  bool shouldRepaint(WeightDashedLinePainter oldDelegate) =>
      oldDelegate.color != color;
}

class _LogWeightForm extends ConsumerStatefulWidget {
  const _LogWeightForm();

  @override
  ConsumerState<_LogWeightForm> createState() => _LogWeightFormState();
}

class _LogWeightFormState extends ConsumerState<_LogWeightForm> {
  final TextEditingController _controller = TextEditingController();
  String? _error;
  bool _saving = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    // Validated at the field (WW-03 failure outcome): an out-of-range or
    // unparseable value never reaches the database.
    final String? problem = validateWeightInput(_controller.text);
    if (problem != null) {
      setState(() => _error = problem);
      return;
    }
    setState(() {
      _error = null;
      _saving = true;
    });

    final double kg = double.parse(_controller.text.trim().replaceAll(',', '.'));
    try {
      await ref
          .read(weightRepositoryProvider)
          .log(weightKg: kg, loggedAt: ref.read(clockProvider)());
      if (!mounted) return;
      _controller.clear();
      // The history stream and the trend both follow the table, so the new
      // entry shows up without a manual refresh.
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(Strings.weightSaved)),
      );
    } catch (error) {
      // Nothing was written, and the screen says so rather than showing a
      // value the database does not hold.
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(Strings.weightSaveFailed)),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(Strings.weightLogTitle, style: NourishTextStyles.headlineMd),
        const SizedBox(height: 12),
        NourishInputField(
          controller: _controller,
          label: Strings.weightFieldLabel,
          hint: 'e.g. 68.5',
          suffix: Strings.weightUnitKg,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          errorText: _error,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _save(),
          onChanged: (_) {
            // Clearing the complaint as soon as the user edits is the field's
            // own error state, not a second validation pass.
            if (_error != null) setState(() => _error = null);
          },
        ),
        const SizedBox(height: 12),
        NourishButton(
          label: Strings.weightLogAction,
          onPressed: _saving ? null : _save,
        ),
      ],
    );
  }
}

class _HistorySection extends ConsumerWidget {
  const _HistorySection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<WeightEntry>> history = ref.watch(
      weightHistoryProvider,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(Strings.weightHistoryTitle, style: NourishTextStyles.headlineMd),
        const SizedBox(height: 12),
        history.when(
          loading: () => const SizedBox(
            height: 48,
            child: Center(
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: NourishColors.primary,
              ),
            ),
          ),
          error: (Object error, StackTrace stack) => _Notice(
            title: Strings.weightUnavailableTitle,
            body: Strings.weightUnavailableBody,
          ),
          data: (List<WeightEntry> entries) => entries.isEmpty
              ? Text(
                  Strings.weightHistoryEmpty,
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                )
              : NourishCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Column(
                    children: <Widget>[
                      for (final WeightEntry entry in entries)
                        _HistoryRow(entry: entry),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

class _HistoryRow extends StatelessWidget {
  const _HistoryRow({required this.entry});

  final WeightEntry entry;

  @override
  Widget build(BuildContext context) {
    final String time =
        '${entry.loggedAt.hour.toString().padLeft(2, '0')}:'
        '${entry.loggedAt.minute.toString().padLeft(2, '0')}';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(
              entry.dateKey,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
          ),
          Text(
            Strings.weightKgValue(entry.weightKg.toStringAsFixed(1)),
            style: NourishTextStyles.bodyLg,
          ),
          const SizedBox(width: 12),
          Text(
            time,
            style: NourishTextStyles.labelCaps.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: NourishTextStyles.bodyLg),
          const SizedBox(height: 4),
          Text(
            body,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
