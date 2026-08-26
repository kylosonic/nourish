import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../l10n/strings.dart';
import '../../../providers.dart';

/// Horizontal category filter chips (LOG-05): All / Ethiopian /
/// Breakfast / Lunch / Dinner / Snacks. Chips filter results, never the
/// underlying search database.
class CategoryChips extends ConsumerWidget {
  const CategoryChips({super.key});

  static const List<String> _categories = <String>[
    'Ethiopian',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snacks',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final FoodSearchState search = ref.watch(foodSearchControllerProvider);
    final FoodSearchController controller = ref.read(
      foodSearchControllerProvider.notifier,
    );

    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: <Widget>[
          _FilterChip(
            label: Strings.allLabel,
            selected: search.category == null,
            onTap: () => controller.setCategory(null),
          ),
          for (final String category in _categories)
            Padding(
              padding: const EdgeInsets.only(left: 8),
              child: _FilterChip(
                label: category,
                selected: search.category == category,
                onTap: () => controller.setCategory(category),
              ),
            ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? NourishColors.primary : NourishColors.surfaceContainer,
      borderRadius: BorderRadius.circular(NourishRadii.pill),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(NourishRadii.pill),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Center(
            child: Text(
              label,
              style: NourishTextStyles.labelCaps.copyWith(
                color: selected
                    ? NourishColors.onPrimary
                    : NourishColors.onSurfaceVariant,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
