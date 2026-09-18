import 'package:url_launcher/url_launcher.dart';

/// Opens an external URL (REL-03: DOWNLOAD UPDATE opens the download in the
/// device browser; the app never silently installs an APK and never
/// self-updates).
///
/// A seam rather than a direct call so widget tests can assert the URL that
/// would be opened without launching anything.
abstract interface class UpdateLauncher {
  /// Returns true when the URL was handed to another app.
  Future<bool> open(String url);
}

class SystemUpdateLauncher implements UpdateLauncher {
  const SystemUpdateLauncher();

  @override
  Future<bool> open(String url) async {
    final Uri? uri = Uri.tryParse(url);
    if (uri == null || !uri.hasScheme) return false;
    // Only http(s): a release document must never be able to hand us a
    // scheme that launches something else on the device.
    if (uri.scheme != 'https' && uri.scheme != 'http') return false;
    return launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
