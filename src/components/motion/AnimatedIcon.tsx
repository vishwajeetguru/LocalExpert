import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * Premium animated-icon kit — Reanimated 4 worklets (UI thread, 60fps).
 * Dribbble-grade micro-motion: gentle float, radiating pulse rings, spring pops.
 * Pair with LottieMoment for full vector scenes (assets/animations/*.json).
 */

/** Gentle levitation for hero/empty-state glyphs. */
export function Float({ children, dy = 7, duration = 2200, style }: { children: React.ReactNode; dy?: number; duration?: number; style?: ViewStyle }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-dy, { duration }), withTiming(dy, { duration })), -1, true);
    return () => cancelAnimation(y);
  }, [y, dy, duration]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[a, style]}>{children}</Animated.View>;
}

/** Radiating rings for peak moments (success, live badge, calling). */
export function PulseRings({ color, size = 96, count = 2 }: { color: string; size?: number; count?: number }) {
  return (
    <View style={[styles.rings, { width: size, height: size }]} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <Ring key={i} color={color} size={size} index={i} total={count} />
      ))}
    </View>
  );
}

function Ring({ color, size, index, total }: { color: string; size: number; index: number; total: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      (index * 1200) / total,
      withRepeat(withTiming(1, { duration: 2400 }), -1, false),
    );
    return () => cancelAnimation(p);
  }, [p, index, total]);
  const a = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - p.value),
    transform: [{ scale: 0.55 + p.value * 0.65 }],
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, borderWidth: 1.5, borderColor: color }, a]} />;
}

/** Spring pop — remount or change `popKey` to replay (bookmark, like, badge). */
export function Pop({ children, popKey, style }: { children: React.ReactNode; popKey?: string | number | boolean; style?: ViewStyle }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withSequence(withSpring(0.72, { damping: 9, stiffness: 420 }), withSpring(1, { damping: 11, stiffness: 260 }));
  }, [s, popKey]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[a, style]}>{children}</Animated.View>;
}

/** Staggered entrance for lists — Dribbble rhythm without FlatList jank. */
export function StaggerItem({ index, children, style }: { index: number; children: React.ReactNode; style?: ViewStyle }) {
  const y = useSharedValue(28);
  const o = useSharedValue(0);
  useEffect(() => {
    const d = Math.min(index, 8) * 70;
    y.value = withDelay(d, withSpring(0, { damping: 20, stiffness: 220 }));
    o.value = withDelay(d, withTiming(1, { duration: 280 }));
    return () => {
      cancelAnimation(y);
      cancelAnimation(o);
    };
  }, [y, o, index]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: o.value }));
  return <Animated.View style={[a, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  rings: { alignItems: 'center', justifyContent: 'center' },
});
