import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';
import '../../router/routes.dart';

/// SCAN-01 six-option bottom sheet ("What did you eat?").
///
/// SEARCH FOOD is the live S0 lane → `/search-food`; the other five
/// lanes route to their parametrized honest voids. Closing the sheet
/// (drag down / tap outside / X) returns exactly to the prior screen
/// with no state change.
Future<void> showScanMenuSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: NourishColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
    ),
    builder: (BuildContext sheetContext) {
      void open(String route) {
        Navigator.of(sheetContext).pop();
        context.go(route);
      }

      // Scrollable so all six lanes stay reachable on short viewports.
      return SingleChildScrollView(
        child: ScanMenuSheet(onOpen: open),
      );
    },
  );
}

/// The sheet's six options grid.
class ScanMenuSheet extends StatelessWidget {
  const ScanMenuSheet({super.key, required this.onOpen});

  /// Routes to open after the sheet pops.
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          NourishSpacing.containerMargin,
          8,
          NourishSpacing.containerMargin,
          NourishSpacing.containerMargin,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Center(
              child: Container(
                width: 48,
                height: 4,
                decoration: BoxDecoration(
                  color: NourishColors.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    Strings.whatDidYouEat,
                    style: NourishTextStyles.headlineMd.copyWith(
                      color: NourishColors.onSurface,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: Strings.closeTooltip,
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                  color: NourishColors.onSurfaceVariant,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: <Widget>[
                Expanded(
                  child: _ScanOption(
                    icon: Icons.photo_camera,
                    label: Strings.scanTakePhoto.toUpperCase(),
                    iconColor: NourishColors.primary,
                    iconBackground: NourishColors.primary.withValues(
                      alpha: 0.10,
                    ),
                    onTap: () => onOpen(AppRoutes.honestVoidFor('take-photo')),
                  ),
                ),
                const SizedBox(width: NourishSpacing.gutter),
                Expanded(
                  child: _ScanOption(
                    icon: Icons.image_outlined,
                    label: Strings.scanChoosePhoto.toUpperCase(),
                    iconColor: NourishColors.secondary,
                    iconBackground: NourishColors.secondaryContainer.withValues(
                      alpha: 0.20,
                    ),
                    onTap: () =>
                        onOpen(AppRoutes.honestVoidFor('choose-photo')),
                  ),
                ),
              ],
            ),
            const SizedBox(height: NourishSpacing.gutter),
            Row(
              children: <Widget>[
                Expanded(
                  child: _ScanOption(
                    icon: Icons.edit_note,
                    label: Strings.scanDescribeMeal.toUpperCase(),
                    iconColor: NourishColors.tertiary,
                    iconBackground: NourishColors.tertiaryContainer.withValues(
                      alpha: 0.20,
                    ),
                    onTap: () =>
                        onOpen(AppRoutes.honestVoidFor('describe-meal')),
                  ),
                ),
                const SizedBox(width: NourishSpacing.gutter),
                Expanded(
                  child: _ScanOption(
                    icon: Icons.mic_none,
                    label: Strings.scanUseVoice.toUpperCase(),
                    iconColor: NourishColors.primary,
                    iconBackground: NourishColors.primary.withValues(
                      alpha: 0.10,
                    ),
                    onTap: () => onOpen(AppRoutes.honestVoidFor('use-voice')),
                  ),
                ),
              ],
            ),
            const SizedBox(height: NourishSpacing.gutter),
            Row(
              children: <Widget>[
                Expanded(
                  child: _ScanOption(
                    icon: Icons.search,
                    label: Strings.scanSearchFood.toUpperCase(),
                    iconColor: NourishColors.onSurfaceVariant,
                    iconBackground: NourishColors.outlineVariant.withValues(
                      alpha: 0.30,
                    ),
                    onTap: () => onOpen(AppRoutes.searchFood),
                  ),
                ),
                const SizedBox(width: NourishSpacing.gutter),
                Expanded(
                  child: _ScanOption(
                    icon: Icons.barcode_reader,
                    label: Strings.scanBarcode.toUpperCase(),
                    iconColor: NourishColors.secondary,
                    iconBackground: NourishColors.secondaryContainer.withValues(
                      alpha: 0.20,
                    ),
                    onTap: () =>
                        onOpen(AppRoutes.honestVoidFor('scan-barcode')),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ScanOption extends StatelessWidget {
  const _ScanOption({
    required this.icon,
    required this.label,
    required this.iconColor,
    required this.iconBackground,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color iconColor;
  final Color iconBackground;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(NourishRadii.input),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: NourishColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(NourishRadii.input),
            border: Border.all(color: Colors.transparent),
          ),
          child: Column(
            children: <Widget>[
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconBackground,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 26, color: iconColor),
              ),
              const SizedBox(height: 12),
              Text(
                label,
                textAlign: TextAlign.center,
                style: NourishTextStyles.labelCaps.copyWith(
                  color: NourishColors.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
