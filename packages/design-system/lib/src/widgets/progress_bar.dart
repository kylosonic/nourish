import 'package:flutter/material.dart';

import '../tokens/colors.dart';

/// Thick (8px) progress track with a rounded cap and a neutral track
/// color only 5% darker than the background (DESIGN.md components).
class NourishProgressBar extends StatelessWidget {
  const NourishProgressBar({
    super.key,
    required this.value,
    this.color = NourishColors.primary,
    this.backgroundColor,
    this.height = 8,
  });

  /// Progress fraction; clamped to 0..1 (no overdraw beyond full).
  final double value;
  final Color color;
  final Color? backgroundColor;
  final double height;

  @override
  Widget build(BuildContext context) {
    final Color track = backgroundColor ??
        Color.lerp(NourishColors.background, Colors.black, 0.05)!;
    final double fraction = value.clamp(0.0, 1.0);

    return ClipRRect(
      borderRadius: BorderRadius.circular(height / 2),
      child: SizedBox(
        height: height,
        child: Stack(
          fit: StackFit.expand,
          children: <Widget>[
            ColoredBox(color: track),
            FractionallySizedBox(
              widthFactor: fraction,
              child: ColoredBox(color: color),
            ),
          ],
        ),
      ),
    );
  }
}
