import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../l10n/strings.dart';
import '../../providers.dart';
import '../../router/routes.dart';
import 'analysis_controller.dart';
import 'meal_edit_sheet.dart';
import 'widgets/analysis_progress_view.dart';
import 'widgets/analysis_result_view.dart';
import 'widgets/low_confidence_view.dart';

/// The transactional scan flow (SCAN-04 → SCAN-05 / SCAN-06).
///
/// One route hosts the whole loop: analysis progress, then either the result
/// (SCAN-05) or the low-confidence resolution (SCAN-06). Keeping it in one
/// screen is what makes the flow transactional — the navigation shell stays
/// suppressed and a deliberate close can discard the run in one place.
class ScanFlowScreen extends ConsumerWidget {
  const ScanFlowScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AnalysisFlowState state = ref.watch(analysisControllerProvider);
    final AnalysisController controller = ref.read(
      analysisControllerProvider.notifier,
    );
    final MealSlot slot = ref.watch(activeMealContextProvider) ?? MealSlot.lunch;

    return PopScope(
      canPop: state.phase == AnalysisPhase.ready || state.phase == AnalysisPhase.failed,
      onPopInvokedWithResult: (bool didPop, Object? result) {
        if (!didPop) _confirmDiscard(context, controller);
      },
      child: Scaffold(
        body: SafeArea(
          child: switch (state.phase) {
            AnalysisPhase.idle ||
            AnalysisPhase.running ||
            AnalysisPhase.saving ||
            AnalysisPhase.saved => AnalysisProgressView(
                state: state,
                onCancel: () => _confirmDiscard(context, controller),
              ),
            AnalysisPhase.failed => _FailureView(
                state: state,
                onCancel: () => _discard(context, controller),
                onRetry: () => context.go(AppRoutes.textLog),
              ),
            AnalysisPhase.ready => state.isLowConfidence
                ? LowConfidenceView(
                    state: state,
                    onCancel: () => _confirmDiscard(context, controller),
                    onSearchManually: () => context.push(AppRoutes.searchFood),
                  )
                : AnalysisResultView(
                    state: state,
                    slot: slot,
                    onCancel: () => _confirmDiscard(context, controller),
                    onEdit: () => showMealEditSheet(context, ref),
                    onSearchFood: () => context.push(AppRoutes.searchFood),
                    onConfirm: () => _confirm(context, ref, controller, slot),
                  ),
          },
        ),
      ),
    );
  }

  Future<void> _confirm(
    BuildContext context,
    WidgetRef ref,
    AnalysisController controller,
    MealSlot slot,
  ) async {
    final String? mealId = await controller.confirm(slot);
    if (!context.mounted) return;
    if (mealId != null) {
      controller.reset();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(Strings.mealSaved)),
      );
      context.go(AppRoutes.home);
    }
  }

  Future<void> _confirmDiscard(
    BuildContext context,
    AnalysisController controller,
  ) async {
    final bool discard = await showDialog<bool>(
          context: context,
          builder: (BuildContext dialogContext) => AlertDialog(
            title: const Text(Strings.discardAnalysisTitle),
            content: const Text(Strings.discardAnalysisBody),
            actions: <Widget>[
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text(Strings.keepEditing),
              ),
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: const Text(Strings.discard),
              ),
            ],
          ),
        ) ??
        false;
    if (discard && context.mounted) _discard(context, controller);
  }

  void _discard(BuildContext context, AnalysisController controller) {
    controller.reset();
    context.go(AppRoutes.home);
  }
}

/// SCAN-04 failure state: a plain-language reason, RETRY and CANCEL, and never a
/// fabricated result.
class _FailureView extends StatelessWidget {
  const _FailureView({
    required this.state,
    required this.onRetry,
    required this.onCancel,
  });

  final AnalysisFlowState state;
  final VoidCallback onRetry;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final String message = switch (state.errorCode) {
      'AI_UNAVAILABLE' => Strings.analysisUnavailable,
      'AI_TIMEOUT' => Strings.analysisTimedOut,
      'AI_INVALID_OUTPUT' => Strings.analysisMalformed,
      'NO_FOOD_DETECTED' => Strings.analysisNoFood,
      'IMAGE_UNREADABLE' || 'UNSUPPORTED_MEDIA_TYPE' => Strings.analysisUnreadableImage,
      'IMAGE_TOO_LARGE' => Strings.analysisImageTooLarge,
      'RATE_LIMITED' || 'AI_BUDGET_EXHAUSTED' => Strings.analysisBusy,
      _ => state.errorMessage ?? Strings.analysisFailed,
    };

    return Padding(
      padding: const EdgeInsets.all(NourishSpacing.containerMargin),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const Icon(Icons.error_outline, size: 48, color: NourishColors.tertiary),
          const SizedBox(height: NourishSpacing.gutter),
          Text(
            Strings.analysisFailedTitle,
            textAlign: TextAlign.center,
            style: NourishTextStyles.headlineMd,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          NourishButton(label: Strings.retry, onPressed: onRetry),
          const SizedBox(height: 8),
          NourishButton(
            label: Strings.cancel,
            variant: NourishButtonVariant.secondary,
            onPressed: onCancel,
          ),
        ],
      ),
    );
  }
}
