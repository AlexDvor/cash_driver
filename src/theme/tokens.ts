export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
export const typography = {
  title: 30,
  heading: 20,
  body: 16,
  supporting: 14,
  money: 32,
  change: 56,
};
export const radii = { card: 24, input: 16, button: 16, chip: 12 };
export const sizing = {
  primaryButton: 56,
  touchTarget: 48,
  icon: 24,
  borderWidth: 1,
  // Keep forms readable on tablets without tying layout to a device model.
  contentMaxWidth: 640,
};
export interface Palette {
  background: string;
  card: string;
  primary: string;
  onPrimary: string;
  secondaryGreen: string;
  softGreen: string;
  text: string;
  secondaryText: string;
  border: string;
  errorText: string;
  errorSurface: string;
}
export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    background: '#F5F7F6',
    card: '#FFFFFF',
    primary: '#0E7A4B',
    onPrimary: '#FFFFFF',
    secondaryGreen: '#1F9D62',
    softGreen: '#E8F5EE',
    text: '#111827',
    secondaryText: '#6B7280',
    border: '#E5E7EB',
    errorText: '#B91C1C',
    errorSurface: '#FEF2F2',
  },
  dark: {
    background: '#101714',
    card: '#1A2520',
    primary: '#69D9A4',
    onPrimary: '#102219',
    secondaryGreen: '#86E5BA',
    softGreen: '#203B2D',
    text: '#F0F5F2',
    secondaryText: '#B0BEB6',
    border: '#405349',
    errorText: '#FFB4B4',
    errorSurface: '#402626',
  },
};
