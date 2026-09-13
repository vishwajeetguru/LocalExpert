import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { typography } from '../../theme/typography';
import { useAppColors } from '../../theme';

type Variant = keyof typeof typography;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function AppText({ variant = 'body', color, align, style, ...rest }: Props) {
  const { colors } = useAppColors();
  return (
    <Text
      {...rest}
      // includeFontPadding:false keeps Nunito vertically centered in clay buttons (Android).
      style={StyleSheet.flatten([typography[variant], { color: color ?? colors.text, textAlign: align, includeFontPadding: false }, style])}
    />
  );
}
