import 'package:flutter/material.dart';

import '../tokens/colors.dart';
import '../tokens/radii.dart';
import '../tokens/typography.dart';

/// One segment of a [SegmentedSelector].
class SegmentedSelectorOption<T> {
  const SegmentedSelectorOption({required this.value, required this.label});

  final T value;
  final String label;
}

/// Two-way segmented control (biological sex, ONB-04). Selected segment
/// is white with a soft shadow on the low-surface track.
class SegmentedSelector<T> extends StatelessWidget {
  const SegmentedSelector({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
  });

  final List<SegmentedSelectorOption<T>> options;
  final T value;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: NourishColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(NourishRadii.input),
      ),
      child: Row(
        children: <Widget>[
          for (final SegmentedSelectorOption<T> option in options)
            Expanded(
              child: _Segment<T>(
                option: option,
                selected: option.value == value,
                onTap: () => onChanged(option.value),
              ),
            ),
        ],
      ),
    );
  }
}

class _Segment<T> extends StatelessWidget {
  const _Segment({
    required this.option,
    required this.selected,
    required this.onTap,
  });

  final SegmentedSelectorOption<T> option;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(NourishRadii.input - 4),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(NourishRadii.input - 4),
            boxShadow: selected
                ? const <BoxShadow>[
                    BoxShadow(
                      color: Color(0x1A000000),
                      blurRadius: 3,
                      offset: Offset(0, 1),
                    ),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            option.label,
            style: NourishTextStyles.headlineMd.copyWith(
              color: selected
                  ? NourishColors.onSurface
                  : NourishColors.onSurfaceVariant,
              fontSize: 18,
            ),
          ),
        ),
      ),
    );
  }
}
