import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Lottie vector-icon slot (lottie-react-native v7 — iOS/Android native decoders).
 * Usage: <LottieMoment source={Animations.emptySearch} fallbackIcon="magnify-close" />
 * Web renders LottieMoment.web.tsx (Reanimated fallback) — web needs a separate
 * player (@lottiefiles/dotlottie-react per the repo README), so we keep web native-free.
 */
export function LottieMoment({
  source,
  size = 160,
  loop = true,
  autoPlay = true,
  speed = 1,
  fallbackIcon = 'image',
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  fallbackIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  void fallbackIcon;
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <LottieView source={source} autoPlay={autoPlay} loop={loop} speed={speed} style={styles.lottie} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  lottie: { width: '100%', height: '100%' },
});
