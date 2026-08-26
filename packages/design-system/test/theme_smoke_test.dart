import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_design_system/nourish_design_system.dart';

void main() {
  group('buildNourishTheme', () {
    final ThemeData theme = buildNourishTheme();

    test('builds with Material 3 enabled', () {
      expect(theme.useMaterial3, isTrue);
    });

    test('font chain is Inter with Noto Sans Ethiopic fallback (ONB-02)', () {
      final TextStyle? body = theme.textTheme.bodyMedium;
      expect(body, isNotNull);
      expect(body!.fontFamily, 'Inter');
      expect(body.fontFamilyFallback, contains('Noto Sans Ethiopic'));
    });

    test('key color scheme values match DESIGN.md hexes', () {
      const List<(Color, int)> expected = <(Color, int)>[
        (NourishColors.primary, 0xFF006C49),
        (NourishColors.primaryContainer, 0xFF10B981),
        (NourishColors.secondary, 0xFF855300),
        (NourishColors.secondaryContainer, 0xFFFEA619),
        (NourishColors.tertiary, 0xFFA43A3A),
        (NourishColors.error, 0xFFBA1A1A),
        (NourishColors.surface, 0xFFFCF9F8),
        (NourishColors.surfaceContainerLowest, 0xFFFFFFFF),
        (NourishColors.onSurface, 0xFF1C1B1B),
        (NourishColors.outline, 0xFF6C7A71),
        (NourishColors.outlineVariant, 0xFFBBCABF),
      ];
      for (final (Color token, int value) in expected) {
        expect(token.toARGB32(), value, reason: '$token');
      }

      final ColorScheme scheme = theme.colorScheme;
      expect(scheme.primary, NourishColors.primary);
      expect(scheme.surface, NourishColors.surface);
      expect(scheme.error, NourishColors.error);
    });

    test('typography scale matches DESIGN.md', () {
      expect(NourishTextStyles.metricXl.fontSize, 40);
      expect(NourishTextStyles.metricXl.fontWeight, FontWeight.w700);
      expect(NourishTextStyles.metricXl.letterSpacing, -1.2);
      expect(NourishTextStyles.headlineLg.fontSize, 32);
      expect(NourishTextStyles.headlineLgMobile.fontSize, 28);
      expect(NourishTextStyles.headlineMd.fontSize, 24);
      expect(NourishTextStyles.bodyLg.fontSize, 18);
      expect(NourishTextStyles.bodyMd.fontSize, 16);
      expect(NourishTextStyles.labelCaps.fontSize, 12);
      expect(NourishTextStyles.labelCaps.letterSpacing, 0.6);
      expect(NourishTextStyles.displayLg.fontSize, 48);
    });

    test('spacing/radii tokens match DESIGN.md', () {
      expect(NourishSpacing.base, 8);
      expect(NourishSpacing.gutter, 16);
      expect(NourishSpacing.containerMargin, 24);
      expect(NourishSpacing.sectionGap, 40);
      expect(NourishRadii.button, 12);
      expect(NourishRadii.input, 12);
      expect(NourishRadii.card, 16);
      expect(NourishRadii.cardLg, 24);
      expect(NourishRadii.image, 24);
      expect(NourishRadii.thumbnail, 8);
    });
  });
}
