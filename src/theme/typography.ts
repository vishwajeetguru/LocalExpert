import { TextStyle } from 'react-native';

/**
 * Claymorphism Mobile type (ui-ux-pro-max): Nunito Black/ExtraBold for ALL
 * headings (rounded terminals mandatory), DM Sans for body. Never Nunito
 * below 700, never DM Sans for display. includeFontPadding:false is applied
 * in AppText for vertical centering inside puffy buttons.
 */
export const fontFamily = {
  display: 'Nunito_900Black',
  heading: 'Nunito_800ExtraBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

type TypeScale = Record<string, TextStyle>;

export const typography: TypeScale = {
  display: { fontSize: 30, lineHeight: 36, fontFamily: fontFamily.display, letterSpacing: -0.5 },
  h1: { fontSize: 24, lineHeight: 30, fontFamily: fontFamily.display, letterSpacing: -0.3 },
  h2: { fontSize: 20, lineHeight: 26, fontFamily: fontFamily.heading },
  h3: { fontSize: 17, lineHeight: 23, fontFamily: fontFamily.heading },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.body },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.bodyBold },
  callout: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.body },
  calloutStrong: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.bodyBold },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.body },
  captionStrong: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.bodyBold },
  tiny: { fontSize: 11, lineHeight: 14, fontFamily: fontFamily.bodyMedium },
  button: { fontSize: 16, lineHeight: 22, fontFamily: fontFamily.heading, letterSpacing: 0.2 },
};
