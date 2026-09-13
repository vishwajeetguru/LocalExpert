import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { radius, shadows, spacing } from '../../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';
import { Float } from '../motion/AnimatedIcon';
import { LottieMoment } from '../motion/LottieMoment';

export function EmptyState({
  icon = 'magnify',
  title,
  body,
  actionLabel,
  onAction,
  lottie,
}: {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Premium vector moment — { source: Animations.emptySearch, fallbackIcon: icon } */
  lottie?: { source: object; fallbackIcon?: keyof typeof MaterialCommunityIcons.glyphMap; size?: number };
}) {
  const { colors } = useAppColors();
  return (
    <View style={styles.wrap}>
      {lottie ? (
        <LottieMoment source={lottie.source} size={lottie.size ?? 150} fallbackIcon={lottie.fallbackIcon ?? icon} />
      ) : (
        <Float dy={6}>
          <View style={[styles.icon, { backgroundColor: colors.goldSoft, borderColor: colors.gold }, shadows.claySm]}>
            <MaterialCommunityIcons name={icon} size={32} color={colors.goldDeep} />
          </View>
        </Float>
      )}
      <AppText variant="h3" align="center" style={{ marginTop: 16 }}>
        {title}
      </AppText>
      <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 300 }}>
        {body}
      </AppText>
      {actionLabel ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" style={{ marginTop: 16 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, borderRadius: radius.lg },
  icon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
