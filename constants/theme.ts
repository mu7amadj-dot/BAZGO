// Powered by OnSpace.AI
// BAZGO design tokens — Iraqi freight marketplace

export const colors = {
  // Brand
  primary: '#0E4D64',
  primaryDark: '#0A3A4D',
  primaryLight: '#1C6E8C',
  emphasis: '#F4A62A',
  emphasisDark: '#D98C12',

  // Surfaces
  background: '#F5F3EE',
  surface: '#FFFFFF',
  surfaceAlt: '#EFECE4',
  surfaceTint: '#E8F0F2',

  // Text
  text: '#182530',
  textSubtle: '#5F6E79',
  textMuted: '#93A0A9',
  onPrimary: '#FFFFFF',
  onEmphasis: '#3A2A05',

  // Semantic
  success: '#2E9E5B',
  successBg: '#E4F4EA',
  warning: '#F4A62A',
  warningBg: '#FDF0DA',
  danger: '#E5484D',
  dangerBg: '#FCE7E8',
  info: '#1C6E8C',
  infoBg: '#E4EFF3',

  // Lines
  border: '#E2DED4',
  borderStrong: '#CFC9BB',
  overlay: 'rgba(15, 30, 40, 0.55)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  section: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '700' as const, lineHeight: 20 },
};

export const shadow = {
  card: {
    shadowColor: '#0E2A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  raised: {
    shadowColor: '#0E2A36',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const theme = { colors, spacing, radius, typography, shadow };
export default theme;
