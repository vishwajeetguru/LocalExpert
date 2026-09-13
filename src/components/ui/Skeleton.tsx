import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useAppColors } from '../../theme';
import { layout, radius } from '../../theme/tokens';
import { shadows } from '../../theme/tokens';

function Block({ w, h, r, style }: { w: string | number; h: number; r?: number; style?: ViewStyle }) {
  const { colors } = useAppColors();
  const o = useSharedValue(0.45);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 950 }), -1, true);
  }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[a, { width: w as never, height: h, borderRadius: r ?? 8, backgroundColor: colors.shimmer }, style]} />;
}

export function SkeletonVendorCard() {
  const { colors } = useAppColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Block w={64} h={64} r={20} />
        <View style={{ flex: 1, gap: 8 }}>
          <Block w="75%" h={14} />
          <Block w="45%" h={12} />
          <Block w="60%" h={12} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <Block w="32%" h={40} r={12} />
        <Block w="32%" h={40} r={12} />
        <Block w="32%" h={40} r={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonVendorCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: layout.cardPad, borderWidth: 1, ...shadows.card },
});
