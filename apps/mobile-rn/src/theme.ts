import { Platform } from 'react-native';

export const colors = {
  surface: '#FCF9F8',
  surfaceBright: '#FFFFFF',
  surfaceLow: '#F6F3F2',
  surfaceContainer: '#F0EDED',
  surfaceHigh: '#EAE7E7',
  surfaceHighest: '#E5E2E1',
  onSurface: '#1C1B1B',
  onSurfaceVariant: '#3C4A42',
  outline: '#6C7A71',
  outlineVariant: '#BBCABF',
  primary: '#006C49',
  primaryContainer: '#10B981',
  primarySoft: '#DDF5EA',
  onPrimary: '#FFFFFF',
  amber: '#F59E0B',
  amberSoft: '#FFF0D5',
  coral: '#F47F7C',
  coralSoft: '#FFE2E0',
  error: '#BA1A1A',
  white: '#FFFFFF',
  black: '#000000',
  scrim: 'rgba(28,27,27,0.44)',
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

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const fonts = {
  regular: 'Inter-Regular',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  ethiopic: 'NotoSansEthiopic-Regular',
} as const;

export const type = {
  display: {
    fontFamily: fonts.bold,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -1,
    color: colors.onSurface,
  },
  headlineLarge: {
    fontFamily: fonts.semibold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.onSurface,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.35,
    color: colors.onSurface,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.onSurface,
  },
  bodyLarge: {
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 28,
    color: colors.onSurface,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurface,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurface,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.onSurfaceVariant,
  },
  metric: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.2,
    color: colors.onSurface,
  },
  metricSmall: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: colors.onSurface,
  },
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  android: { elevation: 4 },
  default: {
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
});

export const noShadow = Platform.select({
  ios: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  android: { elevation: 0 },
  default: {},
});
