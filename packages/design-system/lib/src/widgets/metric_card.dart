import 'package:flutter/material.dart';

import '../tokens/colors.dart';
import '../tokens/radii.dart';
import '../tokens/typography.dart';
import 'nourish_card.dart';

/// Metric card: a single `metric-xl` value, a `label-caps` descriptor and
/// a thin circular progress indicator (DESIGN.md components).
class MetricCard extends StatelessWidget {
  const MetricCard({
    super.key,
    required this.value,
    required this.label,
    this.progress,
    this.progressColor = NourishColors.primaryContainer,
    this.valueColor = NourishColors.onSurface,
    this.radius = NourishRadii.card,
  });

  final String value;
  final String label;

  /// 0..1 progress; null hides the circular indicator.
  final double? progress;
  final Color progressColor;
  final Color valueColor;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return NourishCard(
      radius: radius,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  label.toUpperCase(),
                  style: NourishTextStyles.labelCaps.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  value,
                  style: NourishTextStyles.metricXl.copyWith(color: valueColor),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (progress != null)
            SizedBox(
              width: 44,
              height: 44,
              child: CircularProgressIndicator(
                value: progress!.clamp(0.0, 1.0),
                strokeWidth: 3,
                strokeCap: StrokeCap.round,
                backgroundColor: NourishColors.surfaceContainer,
                valueColor: AlwaysStoppedAnimation<Color>(progressColor),
              ),
            ),
        ],
      ),
    );
  }
}
