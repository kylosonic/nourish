import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../../core/formatters.dart';

/// LOG-06 meal entry: "BREAKFAST • 08:30 AM", item title, kcal and P/C/F
/// chips. Renders the meal's immutable nutrition snapshots (TGT-04) —
/// never the live catalog.
class MealEntryTile extends StatelessWidget {
  const MealEntryTile({super.key, required this.meal});

  final Meal meal;

  @override
  Widget build(BuildContext context) {
    final NutritionTotals totals = meal.totals;
    final String time = DateFormat('hh:mm a').format(meal.createdAt);
    final String title = meal.items.map((MealItem i) => i.foodName).join(' + ');

    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(NourishRadii.thumbnail),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: <Color>[
                  NourishColors.surfaceContainer,
                  NourishColors.surfaceContainerHighest,
                ],
              ),
            ),
            child: Icon(
              _slotIcon(meal.slot),
              size: 24,
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  '${meal.slot.displayName.toUpperCase()} • $time',
                  style: NourishTextStyles.labelCaps.copyWith(
                    color: NourishColors.outline,
                    fontSize: 10,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title.isEmpty ? meal.slot.displayName : title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: NourishTextStyles.bodyLg.copyWith(
                    color: NourishColors.onSurface,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: <Widget>[
                    NourishChip(
                      label: 'P: ${formatGrams(totals.protein)}g',
                      variant: NourishChipVariant.neutral,
                    ),
                    NourishChip(
                      label: 'C: ${formatGrams(totals.carbs)}g',
                      variant: NourishChipVariant.neutral,
                    ),
                    NourishChip(
                      label: 'F: ${formatGrams(totals.fat)}g',
                      variant: NourishChipVariant.neutral,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            formatKcal(totals.kcal),
            style: NourishTextStyles.headlineMd.copyWith(
              color: NourishColors.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}

IconData _slotIcon(MealSlot slot) {
  switch (slot) {
    case MealSlot.breakfast:
      return Icons.bakery_dining;
    case MealSlot.lunch:
      return Icons.lunch_dining;
    case MealSlot.dinner:
      return Icons.dinner_dining;
    case MealSlot.snack:
      return Icons.cookie_outlined;
    case MealSlot.other:
      return Icons.restaurant;
  }
}
