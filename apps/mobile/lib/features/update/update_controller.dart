import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/app_info.dart';
import '../../core/update_launcher.dart';
import '../../data/models/release_metadata.dart';
import '../../data/sources/release_metadata_source.dart';

/// What the app knows about newer releases.
@immutable
class UpdateState {
  const UpdateState({
    this.checked = false,
    this.available,
    this.dismissed = false,
    this.apkUrl,
    this.sha256,
  });

  /// True once a check has completed (successfully or not).
  final bool checked;

  /// The newer release, when one exists.
  final String? available;
  final bool dismissed;
  final String? apkUrl;
  final String? sha256;

  bool get shouldShow =>
      checked && available != null && !dismissed && (apkUrl?.isNotEmpty ?? false);
}

/// REL-03: check once for a newer Android release and surface a notice.
///
/// The check is deliberately quiet: an unreachable or unreadable document, a
/// downgraded document, or an installed version that is already current all
/// produce no notice at all.
class UpdateController extends Notifier<UpdateState> {
  @override
  UpdateState build() => const UpdateState();

  Future<void> check({String installedVersion = appVersion}) async {
    final ReleaseMetadataSource source = ref.read(releaseMetadataSourceProvider);
    final ReleaseMetadata? metadata = await source.fetch();
    if (metadata == null) {
      state = const UpdateState(checked: true);
      return;
    }
    final bool newer = isNewerVersion(metadata.version, installedVersion);
    final bool updatable = metadata.canUpdateOnAndroid;
    state = UpdateState(
      checked: true,
      // Only an Android download we can actually send the user to counts.
      available: newer && updatable ? metadata.version : null,
      apkUrl: updatable ? metadata.androidApkUrl : null,
      sha256: metadata.androidApkSha256,
    );
  }

  void dismiss() {
    if (!state.shouldShow) return;
    state = UpdateState(
      checked: state.checked,
      available: state.available,
      dismissed: true,
      apkUrl: state.apkUrl,
      sha256: state.sha256,
    );
  }

  /// Opens the download in the device browser. Never installs anything.
  Future<bool> openDownload() async {
    final String? url = state.apkUrl;
    if (url == null || url.isEmpty) return false;
    return ref.read(updateLauncherProvider).open(url);
  }
}

/// Overridden in tests with a fake so no browser or socket is involved.
final Provider<UpdateLauncher> updateLauncherProvider = Provider<UpdateLauncher>(
  (Ref<UpdateLauncher> ref) => const SystemUpdateLauncher(),
);

/// The update-check transport; overridden in tests with a fake.
final Provider<ReleaseMetadataSource> releaseMetadataSourceProvider =
    Provider<ReleaseMetadataSource>(
  (Ref<ReleaseMetadataSource> ref) => ReleaseMetadataSource(),
);

/// The update state for the whole app.
final NotifierProvider<UpdateController, UpdateState> updateControllerProvider =
    NotifierProvider<UpdateController, UpdateState>(UpdateController.new);
