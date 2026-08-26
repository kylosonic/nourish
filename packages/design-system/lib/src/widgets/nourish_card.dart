import 'package:flutter/material.dart';

import '../tokens/colors.dart';
import '../tokens/elevation.dart';
import '../tokens/radii.dart';

/// White surface card with the soft level-1 ambient shadow (DESIGN.md
/// elevation: tonal layers, no heavy borders).
class NourishCard extends StatelessWidget {
  const NourishCard({
    super.key,
    required this.child,
    this.radius = NourishRadii.card,
    this.padding,
    this.color = NourishColors.surfaceContainerLowest,
    this.elevated = true,
  });

  final Widget child;
  final double radius;
  final EdgeInsetsGeometry? padding;
  final Color color;

  /// False renders a flat container (level 0).
  final bool elevated;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: elevated ? NourishElevation.level1 : null,
      ),
      child: child,
    );
  }
}
