// Powered by OnSpace.AI
// BAZGO: Iraqi cargo owners and drivers arrange freight with clarity and confidence.
// Material: layered matte white panels. Signatures: blue route accents, orange booking actions, inset RTL fields.
export const colors = {
  primary: '#2474C8',
  primaryDark: '#195A9E',
  primaryLight: '#DCEBFB',
  emphasis: '#F59E35',
  emphasisDark: '#8A4A0B',
  background: '#F3F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F6FA',
  surfaceTint: '#EAF2FC',
  surfaceSelected: '#EAF2FC',
  text: '#344054',
  textSubtle: '#526175',
  textMuted: '#5F6B7C',
  onPrimary: '#FFFFFF',
  onEmphasis: '#344054',
  onDark: '#FFFFFF',
  success: '#18704B',
  successBg: '#E8F5ED',
  warning: '#8A4A0B',
  warningBg: '#FFF3E3',
  danger: '#B42335',
  dangerBg: '#FFF0F1',
  info: '#195A9E',
  infoBg: '#EAF2FC',
  border: '#DFE7F0',
  borderStrong: '#8D9BAF',
  overlay: 'rgba(52, 64, 84, 0.42)',
  transparent: 'transparent',
  shadow: '#344054',
  navigationSurface: '#FFFFFF',
  navigationSelected: '#EAF2FC',
  navigationText: '#2474C8',
  navigationMuted: '#5F6B7C',
  navigationBorder: '#DFE7F0',
  navigationIndicator: '#F59E35',
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
  navigationLabel: { fontSize: 12, fontWeight: '500' as const, lineHeight: 18, includeFontPadding: false },
  button: { fontSize: 16, fontWeight: '700' as const, lineHeight: 24, includeFontPadding: false },
};
export const shadow = {
  card: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  raised: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 6 },
};
export const theme = { colors, spacing, radius, typography, shadow, layout };
export default theme;
