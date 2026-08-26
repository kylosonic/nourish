import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../providers.dart';

/// HOME-02 macro "left" pills (P/C/F) from [HomeDashboardData]. Hidden
/// while no target exists (the ring card already shows the setup
/// prompt). Negative leftovers (over budget) render as-is.
class MacroPills extends ConsumerWidget {
  const MacroPills({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final HomeDashboardData data = ref.watch(homeDashboardProvider);
    final double? protein = data.proteinG;
    final double? carbs = data.carbsG;
    final double? fat = data.fatG;
    if (protein == null || carbs == null || fat == null) {
      return const SizedBox.shrink();
    }

    return Wrap(
      spacing: NourishSpacing.base,
      runSpacing: NourishSpacing.base,
      alignment: WrapAlignment.center,
      children: <Widget>[
        NourishChip(
          label: Strings.macroLeft('Protein', formatGrams(protein)),
          variant: NourishChipVariant.green,
          dot: true,
        ),
        NourishChip(
          label: Strings.macroLeft('Carbs', formatGrams(carbs)),
          variant: NourishChipVariant.amber,
          dot: true,
        ),
        NourishChip(
          label: Strings.macroLeft('Fat', formatGrams(fat)),
          variant: NourishChipVariant.red,
          dot: true,
        ),
      ],
    );
  }
}
