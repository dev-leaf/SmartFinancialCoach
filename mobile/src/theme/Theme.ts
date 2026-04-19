import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { Platform, useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const sharedColors = {
  primary: '#0A84FF',
  primaryMuted: '#EAF3FF',
  success: '#18B979',
  warning: '#F59E0B',
  danger: '#FF5A5F',
  accent: '#08B6D7',
  white: '#FFFFFF',
  black: '#0A0D14',
};

export const lightTheme = {
  ...sharedColors,
  background: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3FB',
  surfaceElevated: '#FDFEFF',
  text: '#111827',
  textDim: '#64748B',
  textMuted: '#94A3B8',
  border: '#D9E2EE',
  divider: '#E8EEF6',
  tabInactive: '#8E9AAF',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

export const darkTheme = {
  ...sharedColors,
  background: '#07111F',
  surface: '#0E1A2B',
  surfaceAlt: '#13243B',
  surfaceElevated: '#112034',
  text: '#F8FAFC',
  textDim: '#B8C4D6',
  textMuted: '#8091A7',
  border: '#1E3451',
  divider: '#18304B',
  tabInactive: '#7690AA',
  shadow: 'rgba(2, 6, 23, 0.35)',
};

export type AppThemeColors = typeof lightTheme;

export const spacing = {
  xxs: 4,
  xs: 8,
  s: 16,
  m: 24,
  l: 32,
  xl: 40,
  xxl: 56,
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
};

const brandFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  hero: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800' as const,
    fontFamily: brandFontFamily,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    fontFamily: brandFontFamily,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    fontFamily: brandFontFamily,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    fontFamily: brandFontFamily,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    fontFamily: brandFontFamily,
  },
};

const buildPaperTheme = (isDark: boolean) => {
  const palette = isDark ? darkTheme : lightTheme;
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    roundness: radii.md,
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,
      onPrimary: palette.white,
      background: palette.background,
      surface: palette.surface,
      surfaceVariant: palette.surfaceAlt,
      outline: palette.border,
      outlineVariant: palette.divider,
      error: palette.danger,
      onSurface: palette.text,
      onSurfaceVariant: palette.textDim,
    },
  };
};

const buildNavigationTheme = (isDark: boolean) => {
  const palette = isDark ? darkTheme : lightTheme;
  const baseTheme = isDark ? NavigationDarkTheme : NavigationDefaultTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.danger,
    },
  };
};

export function useAppTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  return {
    isDark,
    colors,
    spacing,
    radii,
    typography,
    paperTheme: buildPaperTheme(isDark),
    navigationTheme: buildNavigationTheme(isDark),
  };
}
