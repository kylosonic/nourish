export const palette = {
  peachCanvas: '#FFD599',
  limeCanvas: '#C1FF72',
  pinkCanvas: '#FCB3F3',
  lavenderBackdrop: '#9B8AFB',
  mintCard: '#B8F2B6',
  coralCard: '#FF8B6A',
  coralButton: '#FF7F5C',
  violetCard: '#9D8DF1',
  butterCard: '#FFF066',
  skyAccent: '#7CC6FE',
  white: '#FFFFFF',
  charcoal: '#1E1E1E',
  mutedGray: '#4A4A4A',
  ink: '#111111',
  secondaryInk: '#5C5346',
  captionInk: '#333333',
  inverseInk: '#FFFFFF',
  activeLime: '#B8FF65',
  pinkAccent: '#F7A8E8',
  blueAccent: '#B5C7F7',
  chartBlue: '#D8E2FF',
  splitPeach: '#FFD485',
  splitPink: '#F8B8F0',
  selectedCoral: '#FF8563',
  error: '#B42318',
} as const;

/**
 * Semantic aliases keep existing feature screens on the same palette while
 * each screen chooses its canvas explicitly.
 */
export const colors = {
  ...palette,
  surface: palette.peachCanvas,
  surfaceBright: palette.white,
  surfaceLow: palette.butterCard,
  surfaceContainer: palette.mintCard,
  surfaceHigh: palette.skyAccent,
  surfaceHighest: palette.chartBlue,
  onSurface: palette.ink,
  onSurfaceVariant: palette.secondaryInk,
  outline: palette.ink,
  outlineVariant: palette.ink,
  primary: palette.ink,
  primaryContainer: palette.activeLime,
  primarySoft: palette.mintCard,
  onPrimary: palette.white,
  amber: palette.butterCard,
  amberSoft: palette.butterCard,
  coral: palette.coralCard,
  coralSoft: palette.coralCard,
  scrim: palette.lavenderBackdrop,
  black: palette.ink,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 40,
} as const;

export const border = {
  standard: 1.5,
  thin: 1,
  heavy: 2,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 24,
  lg: 28,
  xl: 28,
  xxl: 32,
  pill: 999,
} as const;

export const fonts = {
  regular: 'Inter-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-ExtraBold',
  display: 'PlusJakartaSans-ExtraBold',
  ethiopic: 'NotoSansEthiopic-Regular',
  ethiopicBold: 'NotoSansEthiopic-Bold',
} as const;

export const type = {
  display: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
    letterSpacing: -0.7,
    color: colors.ink,
  },
  headlineLarge: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
    letterSpacing: -0.7,
    color: colors.ink,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
    letterSpacing: -0.7,
    color: colors.ink,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '800' as const,
    lineHeight: 22,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '800' as const,
    lineHeight: 22,
    color: colors.ink,
  },
  bodyLarge: {
    fontFamily: fonts.medium,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    color: colors.ink,
  },
  bodySmall: {
    fontFamily: fonts.medium,
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 17,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: colors.ink,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 15,
    color: colors.captionInk,
  },
  metric: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.8,
    color: colors.ink,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  metricSmall: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 24,
    color: colors.ink,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
} as const;

// Neobrutalist depth comes exclusively from solid fills and ink borders.
export const shadow = {};
export const noShadow = {};
