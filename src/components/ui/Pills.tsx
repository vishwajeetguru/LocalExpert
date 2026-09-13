import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { animation, radius, shadows } from '../../theme/tokens';
import { AppText } from './AppText';
import { tap } from '../../utils/device';
import { useT } from '../../i18n/store';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Clay chip — puffy pill, squishes on press, ember when selected. */
export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: string }) {
  const { colors } = useAppColors();
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      onPress={() => {
        tap('light');
        onPress?.();
      }}
      onPressIn={() => (s.value = withSpring(0.9, animation.clayPress))}
      onPressOut={() => (s.value = withSpring(1, animation.clayPress))}
      style={[
        anim,
        styles.chip,
        selected
          ? { backgroundColor: colors.primary, ...shadows.glow }
          : { backgroundColor: colors.surface, ...shadows.claySm },
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons name={icon as never} size={16} color={selected ? '#fff' : colors.primary} style={{ marginRight: 6 }} />
      ) : null}
      <AppText variant="calloutStrong" color={selected ? '#fff' : colors.text}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

/** Champagne verified — gold reserved for trust moments only. */
export function VerifiedBadge({ compact }: { compact?: boolean }) {
  const { colors } = useAppColors();
  const { t } = useT();
  return (
    <View style={[styles.verified, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
      <MaterialCommunityIcons name="check-decagram" size={compact ? 14 : 16} color={colors.goldDeep} />
      <AppText variant={compact ? 'tiny' : 'captionStrong'} color={colors.goldDeep} style={{ marginLeft: 3 }}>
        {t('common.verified')}
      </AppText>
    </View>
  );
}

/** Ink rating pill (Airbnb-like) with champagne star. */
export function RatingPill({ rating, count }: { rating: number; count?: number }) {
  const { t } = useT();
  return (
    <View style={styles.rating}>
      <MaterialCommunityIcons name="star" size={13} color="#D4B978" />
      <AppText variant="captionStrong" color="#fff" style={{ marginLeft: 3 }}>
        {rating ? rating.toFixed(1) : t('dash.new')}
      </AppText>
      {count !== undefined ? (
        <AppText variant="tiny" color="rgba(255,255,255,0.72)" style={{ marginLeft: 4 }}>
          ({count})
        </AppText>
      ) : null}
    </View>
  );
}

export function StatusPill({ tone, label, icon }: { tone: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold'; label: string; icon?: string }) {
  const { colors } = useAppColors();
  const bg =
    tone === 'success' ? colors.successBg
    : tone === 'warning' ? colors.warningBg
    : tone === 'error' ? colors.errorBg
    : tone === 'gold' ? colors.goldSoft
    : tone === 'info' ? colors.primarySoft
    : colors.surface2;
  const fg =
    tone === 'success' ? colors.success
    : tone === 'warning' ? colors.warning
    : tone === 'error' ? colors.error
    : tone === 'gold' ? colors.goldDeep
    : tone === 'info' ? colors.primary
    : colors.textSecondary;
  return (
    <View style={[styles.status, { backgroundColor: bg }]}>
      {icon ? <MaterialCommunityIcons name={icon as never} size={13} color={fg} style={{ marginRight: 4 }} /> : null}
      <AppText variant="captionStrong" color={fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
  },
  verified: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#131313' },
  status: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
});

