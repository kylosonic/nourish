import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../l10n/strings.dart';
import '../../../router/routes.dart';
import '../recommendation_providers.dart';

/// INS-03 entry point on the Home dashboard: the remaining budget and a way to
/// ask what fits it.
///
/// The numbers shown are the user's own — remaining calories and remaining
/// protein from today's target and today's logged meals. With no target set up
/// the card says so instead of offering a budget it does not have.
class WhatCanIEatCard extends ConsumerWidget {
  const WhatCanIEatCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final RemainingBudget budget = ref.watch(remainingBudgetProvider);

    return NourishCard(
      padding: const EdgeInsets.all(NourishSpacing.containerMargin),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  Strings.whatCanIEatTitle,
                  style: NourishTextStyles.headlineMd,
                ),
              ),
              const Icon(
                Icons.restaurant_menu,
                size: 24,
                color: NourishColors.primary,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            budget.hasTarget
                ? Strings.whatCanIEatSuggestionLine(
                    budget.remainingKcal,
                    budget.remainingProteinG.round(),
                  )
                : Strings.whatCanIEatNoTarget,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          NourishButton(
            variant: NourishButtonVariant.secondary,
            label: Strings.whatCanIEatEntryAction,
            onPressed: budget.hasTarget
                ? () => context.push(AppRoutes.whatCanIEat)
                : null,
          ),
        ],
      ),
    );
  }
}
