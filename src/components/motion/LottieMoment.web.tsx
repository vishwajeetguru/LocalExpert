import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { Float } from './AnimatedIcon';

/**
 * Web fallback for LottieMoment — Metro picks this file on web so the bundle
 * never touches the native Lottie decoder (repo README: web needs
 * @lottiefiles/dotlottie-react). Same props, Reanimated micro-motion instead.
 */
export function LottieMoment({
  size = 160,
  fallbackIcon = 'image',
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source?: any;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  fallbackIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const { colors } = useAppColors();
  const iconSize = Math.round(size * 0.34);
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Float dy={size * 0.04}>
        <View
          style={[
            styles.circle,
            {
              width: size * 0.62,
              height: size * 0.62,
              borderRadius: size * 0.31,
              backgroundColor: colors.primarySoft,
              borderColor: colors.primaryBorder,
            },
          ]}
        >
          <MaterialCommunityIcons name={fallbackIcon} size={iconSize} color={colors.primary} />
        </View>
      </Float>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});
