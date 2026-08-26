import 'package:flutter/material.dart';

import '../tokens/colors.dart';
import '../tokens/radii.dart';
import '../tokens/typography.dart';

/// Builds the full Nourish theme (DESIGN.md tokens + Material 3).
///
/// Font chain: Inter with Noto Sans Ethiopic as script fallback so the
/// Amharic onboarding option (አማርኛ) renders instead of tofu (ONB-02).
ThemeData buildNourishTheme() {
  final ColorScheme colorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: NourishColors.primary,
    onPrimary: NourishColors.onPrimary,
    primaryContainer: NourishColors.primaryContainer,
    onPrimaryContainer: NourishColors.onPrimaryContainer,
    secondary: NourishColors.secondary,
    onSecondary: NourishColors.onSecondary,
    secondaryContainer: NourishColors.secondaryContainer,
    onSecondaryContainer: NourishColors.onSecondaryContainer,
    tertiary: NourishColors.tertiary,
    onTertiary: NourishColors.onTertiary,
    tertiaryContainer: NourishColors.tertiaryContainer,
    onTertiaryContainer: NourishColors.onTertiaryContainer,
    error: NourishColors.error,
    onError: NourishColors.onError,
    errorContainer: NourishColors.errorContainer,
    onErrorContainer: NourishColors.onErrorContainer,
    surface: NourishColors.surface,
    onSurface: NourishColors.onSurface,
    surfaceDim: NourishColors.surfaceDim,
    surfaceBright: NourishColors.surfaceBright,
    surfaceContainerLowest: NourishColors.surfaceContainerLowest,
    surfaceContainerLow: NourishColors.surfaceContainerLow,
    surfaceContainer: NourishColors.surfaceContainer,
    surfaceContainerHigh: NourishColors.surfaceContainerHigh,
    surfaceContainerHighest: NourishColors.surfaceContainerHighest,
    onSurfaceVariant: NourishColors.onSurfaceVariant,
    outline: NourishColors.outline,
    outlineVariant: NourishColors.outlineVariant,
    inverseSurface: NourishColors.inverseSurface,
    onInverseSurface: NourishColors.inverseOnSurface,
    inversePrimary: NourishColors.inversePrimary,
  );

  final TextTheme textTheme = TextTheme(
    displayLarge: NourishTextStyles.displayLg,
    headlineLarge: NourishTextStyles.headlineLg,
    headlineMedium: NourishTextStyles.headlineMd,
    titleLarge: NourishTextStyles.headlineLgMobile,
    bodyLarge: NourishTextStyles.bodyLg,
    bodyMedium: NourishTextStyles.bodyMd,
    labelSmall: NourishTextStyles.labelCaps,
  );

  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Inter',
    fontFamilyFallback: const <String>['Noto Sans Ethiopic'],
    colorScheme: colorScheme,
    scaffoldBackgroundColor: NourishColors.background,
    textTheme: textTheme,
    appBarTheme: const AppBarTheme(
      backgroundColor: NourishColors.background,
      foregroundColor: NourishColors.onBackground,
      elevation: 0,
      centerTitle: true,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: NourishColors.primary,
        foregroundColor: NourishColors.onPrimary,
        disabledBackgroundColor: NourishColors.onSurface.withValues(alpha: 0.12),
        disabledForegroundColor: NourishColors.onSurface.withValues(alpha: 0.38),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NourishRadii.button),
        ),
        // Min width 0 (not Size.fromHeight — that sets infinite min
        // width and breaks buttons inside Rows).
        minimumSize: const Size(0, 56),
        textStyle: NourishTextStyles.headlineMd,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: NourishColors.primary,
        side: const BorderSide(color: NourishColors.outline),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NourishRadii.button),
        ),
        minimumSize: const Size(0, 56),
        textStyle: NourishTextStyles.headlineMd,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: NourishColors.primary,
        textStyle: NourishTextStyles.labelCaps,
      ),
    ),
    cardTheme: CardThemeData(
      color: NourishColors.surfaceContainerLowest,
      elevation: 1,
      shadowColor: NourishColors.onSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(NourishRadii.card),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: NourishColors.surfaceContainerLow,
      hintStyle: NourishTextStyles.bodyLg.copyWith(
        color: NourishColors.outlineVariant,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(NourishRadii.input),
        borderSide: const BorderSide(color: NourishColors.outline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(NourishRadii.input),
        borderSide: const BorderSide(color: NourishColors.outline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(NourishRadii.input),
        borderSide: const BorderSide(color: NourishColors.onSurface, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(NourishRadii.input),
        borderSide: const BorderSide(color: NourishColors.error, width: 2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(NourishRadii.input),
        borderSide: const BorderSide(color: NourishColors.error, width: 2),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: NourishColors.inverseSurface,
      contentTextStyle: NourishTextStyles.bodyMd.copyWith(
        color: NourishColors.inverseOnSurface,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(NourishRadii.card),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: NourishColors.surfaceContainerHigh,
    ),
  );
}
