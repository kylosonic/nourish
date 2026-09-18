import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../data/services/image_acquisition_service.dart';
import '../../l10n/strings.dart';
import '../../providers.dart';
import '../../router/routes.dart';

/// The photo acquisition service; overridden in tests with a fake so no
/// platform picker is ever opened.
final Provider<ImageAcquisitionService> imageAcquisitionServiceProvider =
    Provider<ImageAcquisitionService>(
  (Ref<ImageAcquisitionService> ref) => PlatformImageAcquisitionService(),
);

/// SCAN-01 → SCAN-04: pick a photo, prepare it, and hand it to the pipeline.
///
/// This screen exists so the acquisition step is transactional like the rest of
/// the flow: cancelling the picker returns to the origin screen with no state
/// change, and a chosen photo goes straight to analysis. The camera path
/// (SCAN-02's designed capture screen) is not implemented yet, so only the
/// gallery lane is wired; TAKE PHOTO still opens its honest void.
class PhotoCaptureScreen extends ConsumerStatefulWidget {
  const PhotoCaptureScreen({super.key, this.source = MealPhotoSource.gallery});

  final MealPhotoSource source;

  @override
  ConsumerState<PhotoCaptureScreen> createState() => _PhotoCaptureScreenState();
}

class _PhotoCaptureScreenState extends ConsumerState<PhotoCaptureScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _acquire());
  }

  Future<void> _acquire() async {
    final PreparedPhoto? photo =
        await ref.read(imageAcquisitionServiceProvider).pick(widget.source);
    if (!mounted) return;

    if (photo == null) {
      // Cancelled: nothing happened, so nothing changes (SCAN-01 edge case).
      // Return to the origin screen whether we were pushed or navigated to.
      if (context.canPop()) {
        context.pop();
      } else {
        context.go(AppRoutes.home);
      }
      return;
    }

    await ref.read(analysisControllerProvider.notifier).runPhoto(photo.bytes);
    if (!mounted) return;
    context.go(AppRoutes.scanFlow);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
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
                  onPressed: () {
                    if (context.canPop()) {
                      context.pop();
                    } else {
                      context.go(AppRoutes.home);
                    }
                  },
                ),
              ),
              const Spacer(),
              const Center(
                child: SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    color: NourishColors.primary,
                  ),
                ),
              ),
              const SizedBox(height: NourishSpacing.gutter),
              Text(
                Strings.preparingPhoto,
                textAlign: TextAlign.center,
                style: NourishTextStyles.bodyMd.copyWith(
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
