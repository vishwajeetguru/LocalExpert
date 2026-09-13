import { Platform, ViewStyle } from 'react-native';

/**
 * 8-point grid: every value divisible by 8 or 4.
 * Claymorphism dials per ui-ux-pro-max: spacious base, chunky radii.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 96,
} as const;

/** Clay radii — 20 buttons / 32 cards / 44+ outer shells (skill spec). */
export const radius = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 44,
  pill: 999,
} as const;

const tint = '#4A4458';

function shadow(elevation: number, opacity: number, radiusV: number, height = 8): ViewStyle {
  return {
    shadowColor: tint,
    shadowOffset: { width: 0, height },
    shadowOpacity: opacity,
    shadowRadius: radiusV,
    elevation,
  };
}

/** Soft tinted shadows. Clay depth itself comes from ClayView's nested stack. */
export const shadows: Record<'card' | 'raised' | 'sheet' | 'glow' | 'clay' | 'claySm', ViewStyle> = {
  card: {
    ...Platform.select<ViewStyle>({
      ios: shadow(0, 0.08, 18, 10),
      android: { elevation: 4 },
      default: { elevation: 4 },
    }),
  },
  raised: {
    ...Platform.select<ViewStyle>({
      ios: shadow(0, 0.12, 28, 18),
      android: { elevation: 8 },
      default: { elevation: 8 },
    }),
  },
  sheet: {
    ...Platform.select<ViewStyle>({
      ios: shadow(0, 0.16, 36, -8),
      android: { elevation: 16 },
      default: { elevation: 16 },
    }),
  },
  glow: {
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#FF4D24', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 18, elevation: 8 },
      android: { elevation: 8 },
      default: { elevation: 8 },
    }),
  },
  /** Clay puff — large, diffused, warm. Pair with ClayView's light pass. */
  clay: {
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#8E87A0', shadowOffset: { width: 8, height: 12 }, shadowOpacity: 0.28, shadowRadius: 22, elevation: 8 },
      android: { elevation: 8 },
      default: { elevation: 8 },
    }),
  },
  claySm: {
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#8E87A0', shadowOffset: { width: 4, height: 6 }, shadowOpacity: 0.24, shadowRadius: 12, elevation: 4 },
      android: { elevation: 4 },
      default: { elevation: 4 },
    }),
  },
} as const;

export const animation = {
  fast: 160,
  normal: 240,
  slow: 380,
  springSoft: { damping: 24, stiffness: 260 },
  springSnappy: { damping: 20, stiffness: 340 },
  /** Clay squish (skill: stiffness 300, damping 20, scale 0.92). */
  clayPress: { damping: 20, stiffness: 300 },
} as const;

export const layout = {
  screenPad: 20,
  sectionGap: 32,
  cardPad: 24,
  maxContentWidth: 560,
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
  tabBarHeight: 76,
} as const;
