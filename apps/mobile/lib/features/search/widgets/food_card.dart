import 'package:flutter/material.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';

/// A search result card (LOG-05): thumbnail placeholder art, canonical
/// name, default portion line (`1 piece (150g) • 225 kcal`) and the add
/// button. Kcal is computed from the catalog per-100g × default portion
/// grams (domain nutrition engine), never hardcoded.
class FoodCard extends StatelessWidget {
  const FoodCard({super.key, required this.food, required this.onAdd});

  final Food food;
  final VoidCallback onAdd;

  double get _defaultKcal => nutritionFor(food.per100g, food.defaultPortion.grams)
      .kcal;

  @override
  Widget build(BuildContext context) {
    final String portion = food.defaultPortion.label();
    final String kcal = formatKcal(_defaultKcal);

    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: <Widget>[
          _FoodThumbnail(category: food.category),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  food.canonicalName,
                  style: NourishTextStyles.bodyLg.copyWith(
                    color: NourishColors.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$portion • $kcal ${Strings.kcalUnit}',
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            tooltip: Strings.addFoodTooltip,
            onPressed: onAdd,
            style: IconButton.styleFrom(
              backgroundColor: NourishColors.surfaceContainer,
              foregroundColor: NourishColors.primary,
            ),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
    );
  }
}

/// Local gradient + icon thumbnail (8px radius; no remote food
/// photography in S0).
class _FoodThumbnail extends StatelessWidget {
  const _FoodThumbnail({required this.category});

  final String category;

  @override
  Widget build(BuildContext context) {
    final (Color start, Color end, IconData icon) = switch (category) {
      'Ethiopian' => (
        NourishColors.secondaryContainer,
        NourishColors.primaryContainer,
        Icons.restaurant,
      ),
      'Breakfast' => (
        NourishColors.primaryContainer,
        NourishColors.primaryFixedDim,
        Icons.bakery_dining,
      ),
      'Lunch' => (
        NourishColors.primaryFixedDim,
        NourishColors.inversePrimary,
        Icons.lunch_dining,
      ),
      'Dinner' => (
        NourishColors.tertiaryContainer,
        NourishColors.secondaryFixed,
        Icons.dinner_dining,
      ),
      _ => (
        NourishColors.surfaceContainerHigh,
        NourishColors.surfaceContainer,
        Icons.fastfood,
      ),
    };

    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(NourishRadii.thumbnail),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[start, end],
        ),
      ),
      child: Icon(icon, size: 24, color: Colors.white),
    );
  }
}
