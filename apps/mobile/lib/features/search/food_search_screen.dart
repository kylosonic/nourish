import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../data/repositories/meal_repository.dart';
import '../../data/sync/catalog_sync_state.dart';
import '../../l10n/strings.dart';
import '../../providers.dart';
import '../../router/routes.dart';
import 'widgets/category_chips.dart';
import 'widgets/food_card.dart';

/// LOG-05 food search: query field (alias matching incl. Amharic via the
/// repository), category chips, food cards with default portion + kcal,
/// and quick-add into the active meal slot
/// ([activeMealContextProvider]). If no slot is scoped the + control
/// asks for one honestly (no invented slot).
///
/// Footer honesty (S1 §11): the bootstrap disclaimer shows until a
/// catalog sync lands; once synced the footer carries the FCT 2025
/// citation instead.
class FoodSearchScreen extends ConsumerWidget {
  const FoodSearchScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final FoodSearchState search = ref.watch(foodSearchControllerProvider);
    final FoodSearchController controller = ref.read(
      foodSearchControllerProvider.notifier,
    );
    final MealSlot? slot = ref.watch(activeMealContextProvider);
    final AsyncValue<List<Food>> results = ref.watch(
      foodSearchResultsProvider,
    );
    final CatalogSyncState syncState = ref.watch(catalogSyncStateProvider);
    final bool catalogSynced = syncState is CatalogSyncSynced ||
        (syncState is CatalogSyncFailed &&
            syncState.previousVersion != null);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: Strings.backTooltip,
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text(Strings.searchFoodsTitle),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: NourishSpacing.containerMargin,
              ),
              child: _SearchField(
                controller: controller,
                onBarcode: () => context.go(
                  AppRoutes.honestVoidFor('scan-barcode'),
                ),
              ),
            ),
            const SizedBox(height: NourishSpacing.gutter),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: NourishSpacing.containerMargin,
              ),
              child: const CategoryChips(),
            ),
            const SizedBox(height: NourishSpacing.gutter),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: NourishSpacing.containerMargin,
              ),
              child: _SlotScopedBar(
                slot: slot,
                onPick: () => _pickSlot(context, ref),
              ),
            ),
            Expanded(
              child: results.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    color: NourishColors.primary,
                  ),
                ),
                error: (Object error, StackTrace stack) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(
                      NourishSpacing.containerMargin,
                    ),
                    child: Text(
                      Strings.quickAddFailed,
                      textAlign: TextAlign.center,
                      style: NourishTextStyles.bodyMd.copyWith(
                        color: NourishColors.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
                data: (List<Food> foods) {
                  if (foods.isEmpty) {
                    return _EmptyState(query: search.query);
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(
                      NourishSpacing.containerMargin,
                      0,
                      NourishSpacing.containerMargin,
                      NourishSpacing.gutter,
                    ),
                    itemCount: foods.length,
                    separatorBuilder: (BuildContext context, int index) =>
                        const SizedBox(height: NourishSpacing.base),
                    itemBuilder: (BuildContext context, int index) {
                      final Food food = foods[index];
                      return FoodCard(
                        food: food,
                        onAdd: () => _quickAdd(context, ref, food),
                      );
                    },
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                NourishSpacing.containerMargin,
                NourishSpacing.base,
                NourishSpacing.containerMargin,
                NourishSpacing.base,
              ),
              child: Text(
                catalogSynced
                    ? Strings.fctCitationFooter
                    : Strings.seedDisclaimer,
                textAlign: TextAlign.center,
                style: NourishTextStyles.labelCaps.copyWith(
                  color: NourishColors.onSurfaceVariant,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _quickAdd(
    BuildContext context,
    WidgetRef ref,
    Food food,
  ) async {
    MealSlot? slot = ref.read(activeMealContextProvider);
    if (slot == null) {
      slot = await _pickSlot(context, ref);
      if (slot == null) {
        return; // User dismissed the picker — nothing added.
      }
    }
    try {
      await ref.read(mealRepositoryProvider).saveMeal(
        slot,
        <MealItemDraft>[
          MealItemDraft(
            food: food,
            unit: food.defaultPortion.unit,
            quantity: food.defaultPortion.quantity,
          ),
        ],
      );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              Strings.addedToMeal(food.canonicalName, slot.displayName),
            ),
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(Strings.quickAddFailed)),
        );
      }
    }
  }

  Future<MealSlot?> _pickSlot(BuildContext context, WidgetRef ref) async {
    final MealSlot? picked = await showModalBottomSheet<MealSlot>(
      context: context,
      backgroundColor: NourishColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (BuildContext sheetContext) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.all(NourishSpacing.gutter),
                child: Text(
                  Strings.chooseSlotHint,
                  style: NourishTextStyles.headlineMd.copyWith(
                    color: NourishColors.onSurface,
                  ),
                ),
              ),
              for (final MealSlot option in MealSlot.values)
                ListTile(
                  leading: Icon(
                    _slotIcon(option),
                    color: NourishColors.primary,
                  ),
                  title: Text(
                    option.displayName,
                    style: NourishTextStyles.bodyLg,
                  ),
                  onTap: () => Navigator.of(sheetContext).pop(option),
                ),
            ],
          ),
        );
      },
    );
    if (picked != null) {
      ref.read(activeMealContextProvider.notifier).set(picked);
    }
    return picked;
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

class _SearchField extends StatelessWidget {
  const _SearchField({required this.controller, required this.onBarcode});

  final FoodSearchController controller;
  final VoidCallback onBarcode;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: NourishColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(NourishRadii.input),
        border: Border.all(color: NourishColors.outlineVariant),
      ),
      child: Row(
        children: <Widget>[
          const SizedBox(width: 16),
          const Icon(Icons.search, color: NourishColors.onSurfaceVariant),
          Expanded(
            child: TextField(
              onChanged: controller.setQuery,
              textInputAction: TextInputAction.search,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurface,
              ),
              decoration: const InputDecoration(
                hintText: Strings.searchHint,
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 14,
                ),
              ),
            ),
          ),
          IconButton(
            tooltip: Strings.scanBarcode,
            onPressed: onBarcode,
            icon: const Icon(
              Icons.barcode_reader,
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _SlotScopedBar extends StatelessWidget {
  const _SlotScopedBar({required this.slot, required this.onPick});

  final MealSlot? slot;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPick,
      borderRadius: BorderRadius.circular(NourishRadii.pill),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: NourishColors.surfaceContainer,
          borderRadius: BorderRadius.circular(NourishRadii.pill),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(
              slot == null ? Icons.unarchive_outlined : _slotIcon(slot!),
              size: 18,
              color: NourishColors.primary,
            ),
            const SizedBox(width: 8),
            Text(
              slot == null ? Strings.chooseSlotHint : '${Strings.addingTo}: ${slot!.displayName}',
              style: NourishTextStyles.labelCaps.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.expand_more,
              size: 18,
              color: NourishColors.onSurfaceVariant,
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.query});

  final String query;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(NourishSpacing.containerMargin),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Icon(
              Icons.restaurant_menu,
              size: 40,
              color: NourishColors.onSurfaceVariant,
            ),
            const SizedBox(height: 12),
            Text(
              query.trim().isEmpty
                  ? Strings.typeToSearch
                  : Strings.noResultsFor(query.trim()),
              textAlign: TextAlign.center,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
