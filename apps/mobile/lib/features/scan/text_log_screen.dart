import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';
import '../../providers.dart';
import '../../router/routes.dart';
import 'analysis_controller.dart';

/// LOG-01: text meal logging.
///
/// The user describes the meal, the same pipeline that serves the photo path
/// resolves it, and nothing is saved until the result screen is confirmed.
/// (P-LOG-1: no Stitch screen exists; this follows LOG-01's stated design
/// language — an editable detected list followed by confirm — and is tracked as
/// provisional product assumption PPA-11.)
class TextLogScreen extends ConsumerStatefulWidget {
  const TextLogScreen({super.key});

  @override
  ConsumerState<TextLogScreen> createState() => _TextLogScreenState();
}

class _TextLogScreenState extends ConsumerState<TextLogScreen> {
  final TextEditingController _text = TextEditingController();
  bool _submitted = false;

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  Future<void> _analyse() async {
    final String value = _text.text.trim();
    setState(() => _submitted = true);
    if (value.length < 2) return;
    await ref.read(analysisControllerProvider.notifier).runText(value);
    if (!mounted) return;
    final AnalysisFlowState state = ref.read(analysisControllerProvider);
    if (state.phase != AnalysisPhase.idle) {
      context.go(AppRoutes.scanFlow);
    }
  }

  @override
  Widget build(BuildContext context) {
    final AnalysisFlowState state = ref.watch(analysisControllerProvider);
    final bool busy = state.phase == AnalysisPhase.running;
    final bool tooShort = _text.text.trim().length < 2;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: Strings.backTooltip,
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text(Strings.describeMealTitle),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(NourishSpacing.containerMargin),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Text(
                Strings.describeMealHelp,
                style: NourishTextStyles.bodyMd.copyWith(
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: NourishSpacing.gutter),
              NourishInputField(
                controller: _text,
                label: Strings.describeMealTitle.toUpperCase(),
                hint: Strings.describeMealHint,
                onChanged: (_) => setState(() {}),
                autofocus: true,
              ),
              if (_submitted && tooShort) ...<Widget>[
                const SizedBox(height: 8),
                Text(
                  Strings.describeMealEmpty,
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.tertiary,
                  ),
                ),
              ],
              const Spacer(),
              NourishButton(
                label: Strings.analyseMeal,
                onPressed: busy || tooShort ? null : _analyse,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
