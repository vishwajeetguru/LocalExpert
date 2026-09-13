import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useAppColors } from '../../theme';
import { animation } from '../../theme/tokens';
import { tap } from '../../utils/device';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Claymorphism primitives (ui-ux-pro-max "Claymorphism (Mobile)"):
 * multi-layer shadow stacks via nested Views to fake clay depth —
 * dark puff below-right, light lift above-left, glossy top highlight.
 * Dark mode falls back to a flat card (clay needs a light canvas).
 */
export function ClayView({
  radius = 32,
  bg,
  inset,
  plain,
  style,
  children,
}: {
  radius?: number;
  bg?: string;
  /** Concave pressed look for inputs and selected slots. */
  inset?: boolean;
  /** No shadows at all (text buttons, overlays). */
  plain?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const { colors, isDark } = useAppColors();
  const r = { borderRadius: radius };
  if (plain || isDark) {
    return <View style={[{ backgroundColor: bg ?? colors.card }, r, style]}>{children}</View>;
  }
  if (inset) {
    return (
      <View
        style={[
          r,
          {
            backgroundColor: bg ?? colors.surface2,
            shadowColor: colors.clayDark,
            shadowOffset: { width: 3, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 2,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }
  return (
    <View
      style={[
        r,
        {
          shadowColor: colors.clayDark,
          shadowOffset: { width: 8, height: 12 },
          shadowOpacity: 0.55,
          shadowRadius: 22,
          elevation: 8,
        },
      ]}
    >
      <View
        style={[
          r,
          {
            backgroundColor: colors.clayLight,
            shadowColor: colors.clayLight,
            shadowOffset: { width: -6, height: -6 },
            shadowOpacity: 0.9,
            shadowRadius: 12,
          },
        ]}
      >
        <View style={[{ backgroundColor: bg ?? colors.card, overflow: 'hidden' }, r, style]}>
          {children}
          <View style={[styles.sheen, { borderRadius: radius }]} pointerEvents="none" />
        </View>
      </View>
    </View>
  );
}

/**
 * Squishable pressable — clay press is a spring squish (0.92) + light haptic,
 * never an instant state swap.
 */
export function ClayPressable({
  onPress,
  radius = 32,
  bg,
  plain,
  squish = 0.92,
  disabled,
  style,
  children,
}: {
  onPress?: () => void;
  radius?: number;
  bg?: string;
  plain?: boolean;
  squish?: number;
  disabled?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap('light');
        onPress?.();
      }}
      onPressIn={() => (s.value = withSpring(squish, animation.clayPress))}
      onPressOut={() => (s.value = withSpring(1, animation.clayPress))}
      style={[anim, { borderRadius: radius }, disabled && { opacity: 0.55 }, style]}
    >
      <ClayView radius={radius} bg={bg} plain={plain}>
        {children}
      </ClayView>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Glossy top-third highlight — the "inflated silicone" read.
  sheen: {
    position: 'absolute',
    top: 0,
    left: '8%',
    right: '8%',
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
});

/**
 * Drifting pastel blobs for screen backdrops (skill checklist).
 * Slow ±20px drift, pointer-transparent, purely ornamental.
 */
export function ClayBlobs() {
  const { colors, isDark } = useAppColors();
  const ax = useSharedValue(0);
  const ay = useSharedValue(0);
  const bx = useSharedValue(0);
  const by = useSharedValue(0);
  useEffect(() => {
    ax.value = withRepeat(withSequence(withTiming(20, { duration: 5200 }), withTiming(-20, { duration: 5200 })), -1, true);
    ay.value = withRepeat(withSequence(withTiming(14, { duration: 6400 }), withTiming(-14, { duration: 6400 })), -1, true);
    bx.value = withRepeat(withSequence(withTiming(-18, { duration: 5800 }), withTiming(18, { duration: 5800 })), -1, true);
    by.value = withRepeat(withSequence(withTiming(12, { duration: 7000 }), withTiming(-12, { duration: 7000 })), -1, true);
    return () => {
      cancelAnimation(ax);
      cancelAnimation(ay);
      cancelAnimation(bx);
      cancelAnimation(by);
    };
  }, [ax, ay, bx, by]);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ translateX: ax.value }, { translateY: ay.value }] }));
  const bStyle = useAnimatedStyle(() => ({ transform: [{ translateX: bx.value }, { translateY: by.value }] }));
  if (isDark) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[blobStyles.blobA, { backgroundColor: '#FFE3D6' }, aStyle]} />
      <Animated.View style={[blobStyles.blobB, { backgroundColor: '#E4D9FB' }, bStyle]} />
      <Animated.View style={[blobStyles.blobC, { backgroundColor: colors.primarySoft }]} />
    </View>
  );
}

const blobStyles = StyleSheet.create({
  blobA: { position: 'absolute', top: -90, right: -70, width: 250, height: 250, borderRadius: 125, opacity: 0.55 },
  blobB: { position: 'absolute', top: 180, left: -90, width: 200, height: 200, borderRadius: 100, opacity: 0.45 },
  blobC: { position: 'absolute', bottom: -60, right: 40, width: 150, height: 150, borderRadius: 75, opacity: 0.5 },
});
