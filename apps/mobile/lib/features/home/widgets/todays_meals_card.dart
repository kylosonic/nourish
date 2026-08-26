import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../providers.dart';
import '../../../router/routes.dart';
import '../../scan/scan_menu_sheet.dart';

/// HOME-03 "TODAY'S MEALS": one row per meal slot with aggregated
/// totals; dashed "Not logged" rows open the scan menu pre-scoped to
/// that slot via [activeMealContextProvider]. SEE ALL opens meal
/// history.
class TodaysMealsCard extends ConsumerWidget {
  const TodaysMealsCard({super.key});

  static const List<MealSlot> _slots = <MealSlot>[
    MealSlot.breakfast,
    MealSlot.lunch,
    MealSlot.dinner,
    MealSlot.snack,
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final List<Meal> meals = ref.watch(todayMealsProvider).value ?? const <Meal>[];

    return NourishCard(
      radius: 24,
      padding: const EdgeInsets.all(NourishSpacing.containerMargin),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  Strings.todayMeals,
                  style: NourishTextStyles.labelCaps.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => context.go(AppRoutes.history),
                child: Text(Strings.seeAll.toUpperCase()),
              ),
            ],
          ),
          const SizedBox(height: NourishSpacing.base),
          for (final MealSlot slot in _slots) ...<Widget>[
            _SlotRow(
              slot: slot,
              meals: meals.where((Meal m) => m.slot == slot).toList(),
            ),
            if (slot != _slots.last) const SizedBox(height: NourishSpacing.base),
          ],
        ],
      ),
    );
  }
}

class _SlotRow extends ConsumerWidget {
  const _SlotRow({required this.slot, required this.meals});

  final MealSlot slot;
  final List<Meal> meals;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (meals.isEmpty) {
      return _NotLoggedRow(slot: slot);
    }

    final NutritionTotals totals = meals.fold<NutritionTotals>(
      NutritionTotals.zero,
      (NutritionTotals acc, Meal meal) => acc + meal.totals,
    );
    final List<String> names = <String>[
      for (final Meal meal in meals)
        for (final MealItem item in meal.items) item.foodName,
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: NourishColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(NourishRadii.input),
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  slot.displayName,
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (names.isNotEmpty) ...<Widget>[
                  const SizedBox(height: 2),
                  Text(
                    names.join(', '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: NourishTextStyles.bodyMd.copyWith(
                      color: NourishColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            formatKcal(totals.kcal),
            style: NourishTextStyles.headlineMd.copyWith(
              color: NourishColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _NotLoggedRow extends ConsumerWidget {
  const _NotLoggedRow({required this.slot});

  final MealSlot slot;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(NourishRadii.input),
        onTap: () {
          ref.read(activeMealContextProvider.notifier).set(slot);
          showScanMenuSheet(context);
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(NourishRadii.input),
            border: Border.all(
              color: NourishColors.outlineVariant,
              width: 2,
            ),
          ),
          child: Row(
            children: <Widget>[
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: NourishColors.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(NourishRadii.thumbnail),
                ),
                child: const Icon(
                  Icons.add,
                  color: NourishColors.outline,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      slot.displayName,
                      style: NourishTextStyles.bodyMd.copyWith(
                        color: NourishColors.onSurface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      Strings.notLogged,
                      style: NourishTextStyles.bodyMd.copyWith(
                        color: NourishColors.onSurfaceVariant,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
