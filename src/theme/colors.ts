/**
 * SevaSathi — award-winning restraint edition.
 * Studied: Osmo (Awwwards SOTD: #131313 + #FF4C24), Apple ADA winners
 * (Lumy/Denim restraint, Play clarity, Watch Duty urgency).
 * Formula: warm porcelain 60% / ink 30% / ONE vivid ember 10%. No gold, no teal.
 */
export const palette = {
  // Ember — single brand accent (energy + urgency for home services)
  primary50: '#FFF1EB',
  primary100: '#FFDCCF',
  primary200: '#FFB79E',
  primary300: '#FF8F6B',
  primary400: '#FF6540',
  primary500: '#FF4D24',
  primary600: '#E63E12',
  primary700: '#C2320D',
  primary800: '#8F250A',
  primary900: '#5C1706',

  // Warm porcelain neutrals + Osmo ink
  ink950: '#131313',
  ink700: '#2B2B2B',
  ink500: '#5F6368',
  ink400: '#9AA0A6',
  ink300: '#C9CDD2',
  ink200: '#E8E6E1',
  ink100: '#F0EEEB',
  ink50: '#FAFAF8',

  // Clay — quiet support tone that harmonizes with ember (badges, stars backing)
  clay600: '#9A5B22',
  clay500: '#D98A2B',
  clay50: '#FDF3E7',

  success500: '#16A34A',
  success50: '#E9F6EE',
  warning500: '#B45309',
  warning50: '#FBF1DE',
  error500: '#DC2626',
  error50: '#FBEDED',
  info500: '#2563EB',
  info50: '#EBF1FD',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export interface AppColors {
  background: string;
  surface: string;
  surface2: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryDark: string;
  primary800: string;
  primarySoft: string;
  primaryBorder: string;
  /** Warm clay support — badges only, never brand CTA */
  gold: string;
  goldDeep: string;
  goldSoft: string;
  border: string;
  borderSoft: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  star: string;
  tabBar: string;
  overlay: string;
  shimmer: string;
  /** Claymorphism shadow pair (light canvas required; dark mode falls flat). */
  clayDark: string;
  clayLight: string;
}

export const lightColors: AppColors = {
  background: '#F4F1FA',
  surface: '#FFFFFF',
  surface2: '#ECE7F5',
  card: '#FFFFFF',
  text: '#332F3A',
  textSecondary: '#635F69',
  textTertiary: '#9A94A6',
  primary: palette.primary500,
  primaryDark: '#131313',
  primary800: '#131313',
  primarySoft: palette.primary50,
  primaryBorder: palette.primary100,
  gold: palette.clay500,
  goldDeep: palette.clay600,
  goldSoft: palette.clay50,
  border: '#E2DCF0',
  borderSoft: '#EDE8F6',
  success: palette.success500,
  successBg: palette.success50,
  warning: palette.warning500,
  warningBg: palette.warning50,
  error: palette.error500,
  errorBg: palette.error50,
  star: '#F59E0B',
  tabBar: 'rgba(255,255,255,0.96)',
  overlay: 'rgba(51,47,58,0.48)',
  shimmer: '#E7E1F0',
  clayDark: 'rgba(81,74,102,0.22)',
  clayLight: '#FFFFFF',
};

export const darkColors: AppColors = {
  background: '#0E0E0E',
  surface: '#161616',
  surface2: '#1E1E1E',
  card: '#171717',
  text: '#F5F4F0',
  textSecondary: '#A8A29E',
  textTertiary: '#6E6A63',
  primary: '#FF6A3D',
  primaryDark: '#F5F4F0',
  primary800: '#000000',
  primarySoft: '#251310',
  primaryBorder: '#3D1E14',
  gold: '#E8A04C',
  goldDeep: '#E8A04C',
  goldSoft: '#241A0E',
  border: '#2A2A2A',
  borderSoft: '#202020',
  success: '#4ADE80',
  successBg: '#0D2617',
  warning: '#FBBF24',
  warningBg: '#2C2008',
  error: '#F87171',
  errorBg: '#2E1414',
  star: '#FBBF24',
  tabBar: 'rgba(20,20,20,0.96)',
  overlay: 'rgba(0,0,0,0.6)',
  shimmer: '#242424',
  clayDark: 'rgba(0,0,0,0.4)',
  clayLight: 'rgba(255,255,255,0.06)',
};
