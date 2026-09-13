import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { PulseRings } from './AnimatedIcon';
import { AppText } from '../ui/AppText';

/**
 * Peak-moment success mark — spring badge + radiating rings + rolling check.
 * Reanimated-only so it works offline on low-end devices.
 * For full vector scenes, drop a .json into assets/animations/ and use LottieMoment.
 */
export function SuccessMark({ size = 112, label }: { size?: number; label?: string }) {
  const { colors } = useAppColors();
  const badge = useSharedValue(0);
  const check = useSharedValue(0);

  useEffect(() => {
    badge.value = withSpring(1, { damping: 11, stiffness: 180 });
    check.value = withDelay(
      250,
      withSequence(withSpring(1.35, { damping: 8, stiffness: 300 }), withSpring(1, { damping: 12, stiffness: 260 })),
    );
  }, [badge, check]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(badge.value, 0.01) }],
    opacity: badge.value,
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(check.value, 0.01) }, { rotate: `${(1 - Math.min(check.value, 1)) * -40}deg` }],
  }));

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size + 48, height: size + 48, alignItems: 'center', justifyContent: 'center' }}>
        <PulseRings color={colors.success} size={size + 40} count={2} />
        <Animated.View
          style={[
            styles.badge,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.success },
            badgeStyle,
          ]}
        >
          <Animated.View style={checkStyle}>
            <MaterialCommunityIcons name="check" size={size * 0.48} color="#fff" />
          </Animated.View>
        </Animated.View>
      </View>
      {label ? (
        <AppText variant="calloutStrong" color={colors.success} align="center" style={{ marginTop: 4 }}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
