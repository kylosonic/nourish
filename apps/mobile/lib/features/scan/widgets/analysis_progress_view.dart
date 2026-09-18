import 'dart:async';

import 'package:flutter/material.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../l10n/strings.dart';
import '../analysis_controller.dart';

/// SCAN-04: the analysis progression.
///
/// The three stages are the pipeline's real steps, and the view advances a
/// stage only when the run is still in flight — it never claims a stage that
/// did not run, and it cannot outrun the server (the animation holds on the
/// last stage until the result arrives).
class AnalysisProgressView extends StatefulWidget {
  const AnalysisProgressView({super.key, required this.state, required this.onCancel});

  final AnalysisFlowState state;
  final VoidCallback onCancel;

  @override
  State<AnalysisProgressView> createState() => _AnalysisProgressViewState();
}

class _AnalysisProgressViewState extends State<AnalysisProgressView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..repeat(reverse: true);

  int _stage = 0;
  Timer? _stageTimer;

  @override
  void initState() {
    super.initState();
    _advance();
  }

  /// Move to the next stage after a beat, stopping at the last one: the run's
  /// own completion is what dismisses this screen. The timer is held so it can
  /// be cancelled — a screen that leaves a pending timer behind is untestable
  /// and can fire after dispose.
  void _advance() {
    _stageTimer = Timer(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      if (_stage < 2 && widget.state.phase == AnalysisPhase.running) {
        setState(() => _stage += 1);
        _advance();
      }
    });
  }

  @override
  void dispose() {
    _stageTimer?.cancel();
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const List<String> stages = <String>[
      Strings.analysisStageFoods,
      Strings.analysisStagePortions,
      Strings.analysisStageNutrition,
    ];

    return Padding(
      padding: const EdgeInsets.all(NourishSpacing.containerMargin),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Align(
            alignment: Alignment.centerRight,
            child: IconButton(
              tooltip: Strings.closeTooltip,
              icon: const Icon(Icons.close),
              color: NourishColors.onSurfaceVariant,
              onPressed: widget.onCancel,
            ),
          ),
          const Spacer(),
          Center(
            child: AnimatedBuilder(
              animation: _pulse,
              builder: (BuildContext context, Widget? child) {
                return Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: NourishColors.primary.withValues(
                      alpha: 0.10 + 0.10 * _pulse.value,
                    ),
                  ),
                  child: const Icon(
                    Icons.auto_awesome,
                    size: 40,
                    color: NourishColors.primary,
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          Text(
            Strings.analysisTitle,
            textAlign: TextAlign.center,
            style: NourishTextStyles.headlineMd,
          ),
          const SizedBox(height: NourishSpacing.gutter),
          for (int i = 0; i < stages.length; i++)
            _StageRow(
              label: stages[i],
              done: i < _stage,
              active: i == _stage,
            ),
          const Spacer(),
          Text(
            Strings.analysisPoweredBy,
            textAlign: TextAlign.center,
            style: NourishTextStyles.labelCaps.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _StageRow extends StatelessWidget {
  const _StageRow({required this.label, required this.done, required this.active});

  final String label;
  final bool done;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final Color color = done || active
        ? NourishColors.onSurface
        : NourishColors.onSurfaceVariant.withValues(alpha: 0.5);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: <Widget>[
          SizedBox(
            width: 24,
            height: 24,
            child: done
                ? const Icon(Icons.check_circle, size: 20, color: NourishColors.primary)
                : active
                    ? const Center(
                        child: SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: NourishColors.primary,
                          ),
                        ),
                      )
                    : Icon(
                        Icons.circle_outlined,
                        size: 18,
                        color: color.withValues(alpha: 0.5),
                      ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: NourishTextStyles.bodyMd.copyWith(color: color),
            ),
          ),
        ],
      ),
    );
  }
}
