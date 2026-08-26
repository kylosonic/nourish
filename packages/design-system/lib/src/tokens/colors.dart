import 'package:flutter/material.dart';

/// Full DESIGN.md color palette (exact hexes from the design source of
/// truth, `Design/nourish/DESIGN.md` front matter).
///
/// Screens must consume these tokens (or the theme's `ColorScheme`) — no
/// hardcoded hex values in app code.
abstract final class NourishColors {
  // Core surfaces.
  static const Color surface = Color(0xFFFCF9F8);
  static const Color surfaceDim = Color(0xFFDCD9D9);
  static const Color surfaceBright = Color(0xFFFCF9F8);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF6F3F2);
  static const Color surfaceContainer = Color(0xFFF0EDED);
  static const Color surfaceContainerHigh = Color(0xFFEAE7E7);
  static const Color surfaceContainerHighest = Color(0xFFE5E2E1);
  static const Color surfaceVariant = Color(0xFFE5E2E1);

  // Content colors.
  static const Color onSurface = Color(0xFF1C1B1B);
  static const Color onSurfaceVariant = Color(0xFF3C4A42);
  static const Color inverseSurface = Color(0xFF313030);
  static const Color inverseOnSurface = Color(0xFFF3F0EF);

  // Outlines.
  static const Color outline = Color(0xFF6C7A71);
  static const Color outlineVariant = Color(0xFFBBCABF);

  // Primary (nourishment green).
  static const Color primary = Color(0xFF006C49);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFF10B981);
  static const Color onPrimaryContainer = Color(0xFF00422B);
  static const Color inversePrimary = Color(0xFF4EDEA3);
  static const Color surfaceTint = Color(0xFF006C49);

  // Secondary (amber).
  static const Color secondary = Color(0xFF855300);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFFEA619);
  static const Color onSecondaryContainer = Color(0xFF684000);

  // Tertiary (caution red).
  static const Color tertiary = Color(0xFFA43A3A);
  static const Color onTertiary = Color(0xFFFFFFFF);
  static const Color tertiaryContainer = Color(0xFFFC7C78);
  static const Color onTertiaryContainer = Color(0xFF711419);

  // Error.
  static const Color error = Color(0xFFBA1A1A);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF93000A);

  // Fixed (tonal) variants.
  static const Color primaryFixed = Color(0xFF6FFBBE);
  static const Color primaryFixedDim = Color(0xFF4EDEA3);
  static const Color onPrimaryFixed = Color(0xFF002113);
  static const Color onPrimaryFixedVariant = Color(0xFF005236);
  static const Color secondaryFixed = Color(0xFFFFDDB8);
  static const Color secondaryFixedDim = Color(0xFFFFB95F);
  static const Color onSecondaryFixed = Color(0xFF2A1700);
  static const Color onSecondaryFixedVariant = Color(0xFF653E00);
  static const Color tertiaryFixed = Color(0xFFFFDAD7);
  static const Color tertiaryFixedDim = Color(0xFFFFB3AF);
  static const Color onTertiaryFixed = Color(0xFF410005);
  static const Color onTertiaryFixedVariant = Color(0xFF842225);

  // Background.
  static const Color background = Color(0xFFFCF9F8);
  static const Color onBackground = Color(0xFF1C1B1B);
}
