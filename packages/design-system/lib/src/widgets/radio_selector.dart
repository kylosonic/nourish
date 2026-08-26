import 'package:flutter/material.dart';

import '../tokens/colors.dart';
import '../tokens/elevation.dart';
import '../tokens/radii.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';

/// One selectable option in a [RadioSelector].
class RadioSelectorOption<T> {
  const RadioSelectorOption({
    required this.value,
    required this.title,
    this.subtitle,
    this.tag,
    this.tagColor = NourishColors.primary,
    this.metric,
    this.metricSuffix,
    this.icon,
    this.iconColor,
    this.iconBackground,
  });

  final T value;
  final String title;
  final String? subtitle;

  /// Small uppercase tag, e.g. `Recommended` / `Requires discipline`.
  final String? tag;
  final Color tagColor;

  /// Large metric value (pace cards: `-0.5`).
  final String? metric;
  final String? metricSuffix;

    /// Optional leading icon circle (activity/pace steps).
    final IconData? icon;
    final Color? iconColor;
    final Color? iconBackground;
}

/// Vertical list of selectable option cards with a radio indicator
/// (language, activity and pace steps; ONB-02/05/06).
class RadioSelector<T> extends StatelessWidget {
  const RadioSelector({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
  });

  final List<RadioSelectorOption<T>> options;
  final T value;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        for (final RadioSelectorOption<T> option in options)
          Padding(
            padding: const EdgeInsets.only(bottom: NourishSpacing.gutter),
            child: _RadioOptionCard<T>(
              option: option,
              selected: option.value == value,
              onTap: () => onChanged(option.value),
            ),
          ),
      ],
    );
  }
}

class _RadioOptionCard<T> extends StatelessWidget {
  const _RadioOptionCard({
    required this.option,
    required this.selected,
    required this.onTap,
  });

  final RadioSelectorOption<T> option;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(NourishRadii.input),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: selected
                ? NourishColors.surfaceContainerLow
                : NourishColors.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(NourishRadii.input),
            border: Border.all(
              color: selected
                  ? NourishColors.primary
                  : NourishColors.outlineVariant,
              width: 2,
            ),
            boxShadow: NourishElevation.level1,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  if (option.icon != null) ...<Widget>[
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: option.iconBackground ??
                            NourishColors.primary.withValues(alpha: 0.10),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        option.icon,
                        size: 22,
                        color:
                            option.iconColor ?? NourishColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          option.title,
                          style: NourishTextStyles.headlineMd.copyWith(
                            color: NourishColors.onSurface,
                          ),
                        ),
                        if (option.tag != null) ...<Widget>[
                          const SizedBox(height: 4),
                          Text(
                            option.tag!.toUpperCase(),
                            style: NourishTextStyles.labelCaps.copyWith(
                              color: option.tagColor,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  _RadioIndicator(selected: selected),
                ],
              ),
              if (option.metric != null) ...<Widget>[
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: <Widget>[
                    Text(
                      option.metric!,
                      style: NourishTextStyles.metricXl.copyWith(
                        color: NourishColors.primary,
                      ),
                    ),
                    if (option.metricSuffix != null) ...<Widget>[
                      const SizedBox(width: 6),
                      Text(
                        option.metricSuffix!,
                        style: NourishTextStyles.bodyMd.copyWith(
                          color: NourishColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
              if (option.subtitle != null) ...<Widget>[
                const SizedBox(height: 8),
                Text(
                  option.subtitle!,
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _RadioIndicator extends StatelessWidget {
  const _RadioIndicator({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: selected ? NourishColors.primary : NourishColors.outline,
          width: 2,
        ),
      ),
      alignment: Alignment.center,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: selected ? 10 : 0,
        height: selected ? 10 : 0,
        decoration: const BoxDecoration(
          color: NourishColors.primary,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
