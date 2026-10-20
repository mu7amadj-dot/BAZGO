// Powered by OnSpace.AI
// BAZGO: Iraqi cargo owners and drivers arrange freight with clarity and confidence.
// Material: layered matte navy panels. Signatures: amber transport marks, inset RTL fields.
export const colors = {
  primary: '#FFB800',
  primaryDark: '#0B1C2C',
  primaryLight: '#233C50',
  emphasis: '#FFB800',
  emphasisDark: '#FFD064',
  background: '#0B1C2C',
  surface: '#122638',
  surfaceAlt: '#172C3F',
  surfaceTint: '#192F42',
  surfaceSelected: '#2C302A',
  text: '#F3F6F9',
  textSubtle: '#B8C4CF',
  textMuted: '#9BAAB9',
  onPrimary: '#0B1C2C',
  onEmphasis: '#0B1C2C',
  onDark: '#F3F6F9',
  success: '#76D6A5',
  successBg: '#173C33',
  warning: '#FFD064',
  warningBg: '#342E20',
  danger: '#FF9297',
  dangerBg: '#422735',
  info: '#8BCCEB',
  infoBg: '#19394B',
  border: '#2B3E4F',
  borderStrong: '#486074',
  overlay: 'rgba(3, 12, 21, 0.78)',
  transparent: 'transparent',
  shadow: '#020A12',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 16, lg: 20, xl: 24, pill: 999 };
export const layout = {
  contentMaxWidth: 960,
  authMaxWidth: 480,
  tabletBreakpoint: 600,
  desktopBreakpoint: 1024,
  controlHeight: 64,
  touchTarget: 48,
};
export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36, includeFontPadding: false },
  brand: { fontSize: 30, fontWeight: '800' as const, lineHeight: 36, includeFontPadding: false },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30, includeFontPadding: false },
  section: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26, includeFontPadding: false },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 26, includeFontPadding: false },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const, lineHeight: 26, includeFontPadding: false },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 22, includeFontPadding: false },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20, includeFontPadding: false },
  button: { fontSize: 16, fontWeight: '700' as const, lineHeight: 24, includeFontPadding: false },
};
export const shadow = {
  card: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 2 },
  raised: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 6 },
};
export const theme = { colors, spacing, radius, typography, shadow, layout };
export default theme;
