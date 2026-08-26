import 'package:flutter/material.dart';

import 'colors.dart';

/// Extremely soft ambient shadows from DESIGN.md's elevation section.
/// Charcoal is `onSurface` (#1c1b1b).
abstract final class NourishElevation {
  /// Level 0: flat (background, no shadow).
  static const List<BoxShadow> level0 = <BoxShadow>[];

  /// Level 1: cards/containers — 4px blur, 4% charcoal.
  static final List<BoxShadow> level1 = <BoxShadow>[
    BoxShadow(
      color: NourishColors.onSurface.withValues(alpha: 0.04),
      blurRadius: 4,
      offset: const Offset(0, 2),
    ),
  ];

  /// Level 2: modals/overlays — 12px blur, 8% charcoal.
  static final List<BoxShadow> level2 = <BoxShadow>[
    BoxShadow(
      color: NourishColors.onSurface.withValues(alpha: 0.08),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];
}
