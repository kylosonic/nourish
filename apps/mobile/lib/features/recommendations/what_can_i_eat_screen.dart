import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';
import 'recommendation_providers.dart';
import 'what_can_i_eat.dart';

/// INS-03 "What can I eat".
///
/// The behaviour contract's screen design was never produced (P-INS-2), so the
/// layout here is provisional (PPA-15) — but every rule it shows comes from the
/// contract: suggestions are catalog foods that fit the remaining budget, the
/// protein they cover together is stated plainly, a shortfall is reported
/// rather than hidden, and when nothing fits the app explains the gap instead
/// of inventing a food.
class WhatCanIEatScreen extends ConsumerWidget {
  const WhatCanIEatScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final RemainingBudget budget = ref.watch(remainingBudgetProvider);
    final AsyncValue<RecommendationResult> result = ref.watch(
      recommendationsProvider,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          Strings.whatCanIEatTitle,
          style: TextStyle(color: NourishColors.primary),
        ),
        leading: context.canPop()
            ? IconButton(
                tooltip: Strings.backTooltip,
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            NourishSpacing.containerMargin,
            NourishSpacing.base,
            NourishSpacing.containerMargin,
            NourishSpacing.sectionGap,
          ),
          children: <Widget>[
            Text(
              Strings.whatCanIEatSubtitle,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: NourishSpacing.sectionGap),
            _RequestCard(budget: budget),
            const SizedBox(height: NourishSpacing.sectionGap),
            result.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    color: NourishColors.primary,
                  ),
                ),
              ),
              error: (Object error, StackTrace stack) => _Notice(
                body: Strings.whatCanIEatUnavailable,
              ),
              data: (RecommendationResult data) =>
                  _Results(result: data, atSafetyFloor: budget.targetAtSafetyFloor),
            ),
          ],
        ),
      ),
    );
  }
}

/// The budget the request is built from: prefilled with today's remaining
/// numbers, editable because the contract has the user state the request.
class _RequestCard extends ConsumerStatefulWidget {
  const _RequestCard({required this.budget});

  final RemainingBudget budget;

  @override
  ConsumerState<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends ConsumerState<_RequestCard> {
  final TextEditingController _kcal = TextEditingController();
  final TextEditingController _protein = TextEditingController();
  String? _kcalError;
  String? _proteinError;
  bool _prefilled = false;

  @override
  void dispose() {
    _kcal.dispose();
    _protein.dispose();
    super.dispose();
  }

  /// Fill the fields from today's own numbers once they are known. An edit the
  /// user has already made is never overwritten.
  void _prefill(RecommendationQuery? query) {
    if (_prefilled) return;
    final int kcal = query?.remainingKcal ?? widget.budget.remainingKcal;
    final double protein =
        query?.proteinNeedG ?? widget.budget.remainingProteinG;
    _kcal.text = kcal.toString();
    _protein.text = protein == protein.roundToDouble()
        ? protein.round().toString()
        : protein.toStringAsFixed(1);
    _prefilled = true;
  }

  void _submit() {
    final int? kcal = int.tryParse(_kcal.text.trim());
    final double? protein = double.tryParse(
      _protein.text.trim().replaceAll(',', '.'),
    );
    setState(() {
      _kcalError = kcal == null || kcal < 0 ? Strings.whatCanIEatBadNumber : null;
      _proteinError = protein == null || protein < 0
          ? Strings.whatCanIEatBadNumber
          : null;
    });
    if (kcal == null || protein == null || kcal < 0 || protein < 0) return;
    ref
        .read(recommendationQueryProvider.notifier)
        .set(remainingKcal: kcal, proteinNeedG: protein);
  }

  @override
  Widget build(BuildContext context) {
    _prefill(ref.watch(recommendationQueryProvider));

    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          NourishInputField(
            controller: _kcal,
            label: Strings.whatCanIEatKcalLabel,
            suffix: Strings.kcalUnit,
            keyboardType: const TextInputType.numberWithOptions(decimal: false),
            errorText: _kcalError,
          ),
          const SizedBox(height: 12),
          NourishInputField(
            controller: _protein,
            label: Strings.whatCanIEatProteinLabel,
            suffix: 'g',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            errorText: _proteinError,
          ),
          const SizedBox(height: 12),
          NourishButton(
            label: Strings.whatCanIEatSuggest,
            onPressed: _submit,
          ),
          const SizedBox(height: 8),
          NourishButton(
            variant: NourishButtonVariant.secondary,
            label: Strings.whatCanIEatReset,
            onPressed: () {
              setState(() {
                _prefilled = false;
                _kcalError = null;
                _proteinError = null;
              });
              ref.read(recommendationQueryProvider.notifier).clear();
            },
          ),
        ],
      ),
    );
  }
}

class _Results extends StatelessWidget {
  const _Results({required this.result, required this.atSafetyFloor});

  final RecommendationResult result;
  final bool atSafetyFloor;

  @override
  Widget build(BuildContext context) {
    final String headline = switch (result.outcome) {
      RecommendationOutcome.budgetSpent => atSafetyFloor
          ? Strings.whatCanIEatNoBudgetAtFloor
          : Strings.whatCanIEatNoBudget,
      RecommendationOutcome.nothingFits => Strings.whatCanIEatNothingFits,
      RecommendationOutcome.suggested => recommendationHeadline(result),
    };

    final List<FoodSuggestion> ranked = result.suggestions;
    final List<FoodSuggestion> closest = result.closest ?? const <FoodSuggestion>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        NourishCard(
          padding: const EdgeInsets.all(16),
          child: Text(
            headline,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ),
        if (ranked.isNotEmpty) ...<Widget>[
          const SizedBox(height: NourishSpacing.sectionGap),
          Text(
            Strings.whatCanIEatRankedTitle,
            style: NourishTextStyles.headlineMd,
          ),
          const SizedBox(height: 12),
          for (final FoodSuggestion suggestion in ranked)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _SuggestionTile(suggestion: suggestion),
            ),
        ],
        if (closest.isNotEmpty) ...<Widget>[
          const SizedBox(height: NourishSpacing.sectionGap),
          Text(
            Strings.whatCanIEatClosestTitle,
            style: NourishTextStyles.headlineMd,
          ),
          const SizedBox(height: 12),
          for (final FoodSuggestion suggestion in closest)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _SuggestionTile(
                suggestion: suggestion,
                overBudgetKcal: suggestion.kcal - result.budgetKcal,
              ),
            ),
        ],
      ],
    );
  }
}

class _SuggestionTile extends StatelessWidget {
  const _SuggestionTile({required this.suggestion, this.overBudgetKcal});

  final FoodSuggestion suggestion;

  /// Set only for the "closest options" list, where the budget was exceeded.
  final int? overBudgetKcal;

  @override
  Widget build(BuildContext context) {
    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  suggestion.food.canonicalName,
                  style: NourishTextStyles.bodyLg,
                ),
              ),
              Text(
                overBudgetKcal == null
                    ? Strings.whatCanIEatSuggestionLine(
                        suggestion.kcal,
                        suggestion.proteinG.round(),
                      )
                    : Strings.whatCanIEatOverBudget(overBudgetKcal!),
                style: NourishTextStyles.bodyMd.copyWith(
                  color: overBudgetKcal == null
                      ? NourishColors.primary
                      : NourishColors.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            suggestion.portion.label(),
            style: NourishTextStyles.bodyMd.copyWith(
              fontSize: 13,
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              if (suggestion.isLocal) const _Tag(label: Strings.whatCanIEatLocalTag),
              if (suggestion.matchesSlot)
                const _Tag(label: Strings.whatCanIEatSlotTag),
              if (suggestion.recentlyLogged)
                const _Tag(label: Strings.whatCanIEatRecentTag),
            ],
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: NourishColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: NourishTextStyles.labelCaps.copyWith(
          color: NourishColors.onSurfaceVariant,
          fontSize: 10,
        ),
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.body});

  final String body;

  @override
  Widget build(BuildContext context) {
    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Text(
        body,
        style: NourishTextStyles.bodyMd.copyWith(
          color: NourishColors.onSurfaceVariant,
        ),
      ),
    );
  }
}
