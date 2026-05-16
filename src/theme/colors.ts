export const Colors = {
  // Brand
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  primaryMuted: '#EFF6FF',

  secondary: '#7C3AED',
  secondaryDark: '#6D28D9',
  secondaryLight: '#8B5CF6',
  secondaryMuted: '#F5F3FF',

  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FCD34D',

  // Status
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  info: '#3B82F6',
  infoBg: '#EFF6FF',

  // Levels
  bronze: '#CD7F32',
  silver: '#A8A9AD',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  elite: '#7C3AED',

  // Neutrals
  white: '#FFFFFF',
  black: '#0F172A',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Semantic
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderFocus: '#2563EB',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Tab bar
  tabActive: '#2563EB',
  tabInactive: '#94A3B8',
  tabBackground: '#FFFFFF',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export type ColorKey = keyof typeof Colors;
