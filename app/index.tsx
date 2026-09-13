import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../src/components/ui/AppText';
import { useLocale } from '../src/i18n/store';

/**
 * Award-restraint splash — Osmo formula: ink canvas, one ember mark, one promise.
 */
export default function Splash() {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const bar = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 160 });
    opacity.value = withTiming(1, { duration: 500 });
    bar.value = withDelay(300, withTiming(1, { duration: 1100 }));
    void useLocale.getState().hydrate();
    const t = setTimeout(() => {
      const loc = useLocale.getState().locale;
      router.replace(loc ? '/(tabs)' : '/language');
    }, 1900);
    return () => clearTimeout(t);
  }, [scale, opacity, bar]);

  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const barStyle = useAnimatedStyle(() => ({ width: `${Math.round(bar.value * 100)}%` }));

  return (
    <View style={styles.bg}>
      <Animated.View style={[styles.eyebrow, fadeStyle]}>
        <View style={styles.dot} />
        <AppText variant="tiny" color="#FF8F6B" align="center" style={{ letterSpacing: 3 }}>
          SHEGAON • LOCAL EXPERTS
        </AppText>
      </Animated.View>
      <Animated.View style={[styles.logo, logoStyle]}>
        <View style={styles.logoInner}>
          <MaterialCommunityIcons name="lightning-bolt" size={46} color="#FAFAF8" />
        </View>
      </Animated.View>
      <Animated.View style={[fadeStyle, { alignItems: 'center' }]}>
        <AppText variant="display" color="#FAFAF8">
          SevaSathi
        </AppText>
        <AppText variant="callout" color="rgba(250,250,248,0.75)" style={{ marginTop: 8 }}>
          Trusted local services, on demand
        </AppText>
      </Animated.View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#131313', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,77,36,0.4)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,77,36,0.08)' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF4D24' },
  logo: {
    width: 112, height: 112, borderRadius: 34, backgroundColor: '#FF4D24',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 112, height: 112, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  track: { width: 184, height: 5, borderRadius: 3, backgroundColor: 'rgba(250,250,248,0.16)', overflow: 'hidden', marginTop: 12 },
  fill: { height: '100%', backgroundColor: '#FF4D24', borderRadius: 3 },
});
