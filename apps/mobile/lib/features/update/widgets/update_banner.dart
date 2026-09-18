import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../l10n/strings.dart';
import '../update_controller.dart';

/// REL-03: "New version available." with DOWNLOAD UPDATE.
///
/// The action opens the download URL in the device browser — the app never
/// installs an APK itself. The notice is dismissible and renders nothing at all
/// when there is no newer release (or when the check could not run).
class UpdateBanner extends ConsumerWidget {
  const UpdateBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final UpdateState state = ref.watch(updateControllerProvider);
    if (!state.shouldShow) return const SizedBox.shrink();

    final UpdateController controller = ref.read(updateControllerProvider.notifier);
    return Padding(
      padding: const EdgeInsets.only(bottom: NourishSpacing.gutter),
      child: NourishCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                const Icon(Icons.system_update_alt, size: 20, color: NourishColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    Strings.updateAvailableTitle(state.available!),
                    style: NourishTextStyles.bodyLg,
                  ),
                ),
                IconButton(
                  tooltip: Strings.dismissTooltip,
                  icon: const Icon(Icons.close, size: 18),
                  color: NourishColors.onSurfaceVariant,
                  onPressed: controller.dismiss,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              Strings.updateAvailableBody,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            NourishButton(
              label: Strings.downloadUpdate,
              onPressed: () async {
                final bool opened = await controller.openDownload();
                if (!opened && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text(Strings.updateOpenFailed)),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
