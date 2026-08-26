import 'package:flutter/material.dart';

/// Typography scale from DESIGN.md (Inter; exact px sizes, line heights,
/// weights and letter-spacing).
///
/// CSS `em` letter-spacing is converted to logical pixels at the font
/// size: `letterSpacing = fontSize * em` (metric-xl at 40px with -0.03em
/// is -1.2px).
abstract final class NourishTextStyles {
  /// 48/56, w700, -0.02em.
  static const TextStyle displayLg = TextStyle(
    fontSize: 48,
    height: 56 / 48,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.96,
  );

  /// 32/40, w600, -0.01em.
  static const TextStyle headlineLg = TextStyle(
    fontSize: 32,
    height: 40 / 32,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.32,
  );

  /// 28/36, w600 (mobile headline).
  static const TextStyle headlineLgMobile = TextStyle(
    fontSize: 28,
    height: 36 / 28,
    fontWeight: FontWeight.w600,
  );

  /// 24/32, w600.
  static const TextStyle headlineMd = TextStyle(
    fontSize: 24,
    height: 32 / 24,
    fontWeight: FontWeight.w600,
  );

  /// 18/28, w400.
  static const TextStyle bodyLg = TextStyle(
    fontSize: 18,
    height: 28 / 18,
    fontWeight: FontWeight.w400,
  );

  /// 16/24, w400.
  static const TextStyle bodyMd = TextStyle(
    fontSize: 16,
    height: 24 / 16,
    fontWeight: FontWeight.w400,
  );

  /// 12/16, w700, +0.05em (uppercase section labels).
  static const TextStyle labelCaps = TextStyle(
    fontSize: 12,
    height: 16 / 12,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.6,
  );

  /// 40/40, w700, -0.03em (calorie and macro totals).
  static const TextStyle metricXl = TextStyle(
    fontSize: 40,
    height: 40 / 40,
    fontWeight: FontWeight.w700,
    letterSpacing: -1.2,
  );
}
