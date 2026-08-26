import 'package:flutter/material.dart';

import '../tokens/colors.dart';
import '../tokens/radii.dart';
import '../tokens/typography.dart';

/// Nutritional chip tint (DESIGN.md components).
enum NourishChipVariant {
  /// Semi-transparent green (nourishment indicators).
  green,

  /// Semi-transparent amber (cautionary nutritional data).
  amber,

  /// Semi-transparent red (fat / warnings).
  red,

  /// Neutral surface chip (P/C/F history chips).
  neutral,
}

/// Small pill chip with semi-transparent tint and high-contrast text.
class NourishChip extends StatelessWidget {
  const NourishChip({
    super.key,
    required this.label,
    this.variant = NourishChipVariant.green,
    this.dot = false,
  });

  final String label;
  final NourishChipVariant variant;

  /// Shows the small leading dot (home macro pills).
  final bool dot;

  @override
  Widget build(BuildContext context) {
    final (Color background, Color foreground, Color? border, Color dotColor) =
        switch (variant) {
      NourishChipVariant.green => (
        NourishColors.primary.withValues(alpha: 0.10),
        NourishColors.primary,
        NourishColors.primary.withValues(alpha: 0.20),
        NourishColors.primary,
      ),
      NourishChipVariant.amber => (
        NourishColors.secondaryContainer.withValues(alpha: 0.20),
        NourishColors.onSecondaryContainer,
        NourishColors.secondaryContainer.withValues(alpha: 0.30),
        NourishColors.secondaryContainer,
      ),
      NourishChipVariant.red => (
        NourishColors.tertiaryContainer.withValues(alpha: 0.20),
        NourishColors.tertiary,
        NourishColors.tertiaryContainer.withValues(alpha: 0.30),
        NourishColors.tertiary,
      ),
      NourishChipVariant.neutral => (
        NourishColors.surfaceContainer,
        NourishColors.onSurfaceVariant,
        null,
        NourishColors.outline,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(NourishRadii.pill),
        border: border == null ? null : Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (dot) ...<Widget>[
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Text(
            label,
            style: NourishTextStyles.labelCaps.copyWith(color: foreground),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
