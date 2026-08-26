import 'package:flutter/material.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

/// Shared selectable card for onboarding option lists (goal, pace,
/// food preference): icon or image leading, title, subtitle, optional
/// tag and trailing widget; green border + tint when selected.
class OptionCard extends StatelessWidget {
  const OptionCard({
    super.key,
    required this.title,
    required this.selected,
    required this.onTap,
    this.subtitle,
    this.tag,
    this.tagColor = NourishColors.primary,
    this.leading,
    this.trailing,
    this.radius = NourishRadii.input,
  });

  final String title;
  final String? subtitle;
  final bool selected;
  final VoidCallback onTap;
  final String? tag;
  final Color tagColor;
  final Widget? leading;
  final Widget? trailing;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: selected
                ? NourishColors.primary.withValues(alpha: 0.05)
                : NourishColors.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(
              color: selected
                  ? NourishColors.primary
                  : NourishColors.outlineVariant,
              width: selected ? 2 : 1,
            ),
            boxShadow: NourishElevation.level1,
          ),
          child: Row(
            children: <Widget>[
              if (leading != null) ...<Widget>[
                leading!,
                const SizedBox(width: 16),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      title,
                      style: NourishTextStyles.headlineMd.copyWith(
                        color: NourishColors.onSurface,
                      ),
                    ),
                    if (tag != null) ...<Widget>[
                      const SizedBox(height: 4),
                      Text(
                        tag!.toUpperCase(),
                        style: NourishTextStyles.labelCaps.copyWith(
                          color: tagColor,
                        ),
                      ),
                    ],
                    if (subtitle != null) ...<Widget>[
                      const SizedBox(height: 6),
                      Text(
                        subtitle!,
                        style: NourishTextStyles.bodyMd.copyWith(
                          color: NourishColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (trailing != null) ...<Widget>[
                const SizedBox(width: 12),
                trailing!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}
