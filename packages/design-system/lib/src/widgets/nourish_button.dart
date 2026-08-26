import 'package:flutter/material.dart';

import '../tokens/colors.dart';
import '../tokens/elevation.dart';
import '../tokens/radii.dart';
import '../tokens/typography.dart';

/// Button visual variants (DESIGN.md components).
enum NourishButtonVariant {
  /// Solid emerald (#006c49), white text, 12px radius.
  primary,

  /// Outlined: surface background, 1px outline border, primary text.
  secondary,
}

/// The primary/secondary action button: 12px radius, 56px tall, with a
/// proper disabled state.
class NourishButton extends StatelessWidget {
  const NourishButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.variant = NourishButtonVariant.primary,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final NourishButtonVariant variant;
  final bool expand;

  bool get _enabled => onPressed != null;

  @override
  Widget build(BuildContext context) {
    final bool isPrimary = variant == NourishButtonVariant.primary;

    final Color background = !_enabled
        ? NourishColors.onSurface.withValues(alpha: 0.12)
        : isPrimary
        ? NourishColors.primary
        : NourishColors.surface;
    final Color foreground = !_enabled
        ? NourishColors.onSurface.withValues(alpha: 0.38)
        : isPrimary
        ? NourishColors.onPrimary
        : NourishColors.primary;
    final Border? border = isPrimary
        ? null
        : Border.all(
            color: _enabled
                ? NourishColors.outline
                : NourishColors.outlineVariant,
          );

    final Widget content = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: <Widget>[
        Flexible(
          child: Text(
            label,
            style: NourishTextStyles.headlineMd.copyWith(color: foreground),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (icon != null) ...<Widget>[
          const SizedBox(width: 8),
          Icon(icon, size: 20, color: foreground),
        ],
      ],
    );

    return Material(
      color: background,
      borderRadius: BorderRadius.circular(NourishRadii.button),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(NourishRadii.button),
        child: Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 24),
          decoration: BoxDecoration(
            border: border,
            borderRadius: BorderRadius.circular(NourishRadii.button),
            boxShadow: isPrimary && _enabled ? NourishElevation.level1 : null,
          ),
          alignment: Alignment.center,
          child: content,
        ),
      ),
    );
  }
}
