import 'dart:typed_data';

import 'package:image_picker/image_picker.dart';

/// Where a meal photo came from (SCAN-01).
enum MealPhotoSource { gallery, camera }

/// A prepared image, ready to upload (SCAN-03).
class PreparedPhoto {
  const PreparedPhoto({required this.bytes, required this.source});

  final Uint8List bytes;
  final MealPhotoSource source;

  int get lengthInBytes => bytes.length;
}

/// Image acquisition behind a seam so widget tests never open a platform
/// channel, and so the camera screen (SCAN-02) can replace the gallery path
/// without touching the flow.
abstract interface class ImageAcquisitionService {
  /// Returns null when the user cancels — which is not an error.
  Future<PreparedPhoto?> pick(MealPhotoSource source);
}

/// The real implementation.
///
/// SCAN-03 (compression + metadata stripping) is performed by the platform
/// picker itself: `maxWidth`/`maxHeight` downscale the image and `imageQuality`
/// re-encodes it as JPEG, which drops EXIF — including GPS, device and capture
/// metadata — before the bytes ever reach Dart. Doing it here rather than in a
/// second image library keeps the pipeline native and fast, and means the
/// original full-resolution photograph is never held in memory.
class PlatformImageAcquisitionService implements ImageAcquisitionService {
  PlatformImageAcquisitionService({ImagePicker? picker})
      : _picker = picker ?? ImagePicker();

  /// Longest edge of the uploaded image. Large enough to identify a plate,
  /// small enough to upload on a mobile connection.
  static const double maxEdge = 1280;

  /// JPEG quality of the re-encoded copy.
  static const int jpegQuality = 80;

  final ImagePicker _picker;

  @override
  Future<PreparedPhoto?> pick(MealPhotoSource source) async {
    final XFile? file = await _picker.pickImage(
      source: source == MealPhotoSource.camera
          ? ImageSource.camera
          : ImageSource.gallery,
      maxWidth: maxEdge,
      maxHeight: maxEdge,
      imageQuality: jpegQuality,
      requestFullMetadata: false,
    );
    if (file == null) return null;
    final Uint8List bytes = await file.readAsBytes();
    if (bytes.isEmpty) return null;
    return PreparedPhoto(bytes: bytes, source: source);
  }
}
