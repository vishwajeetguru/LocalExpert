import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { radius, shadows } from '../../theme/tokens';
import { AppText } from './AppText';

/** Monogram with clay ring — people > initials > generic icons. */
export function Avatar({ name, size = 52, tint }: { name: string; size?: number; tint?: string }) {
  const { colors } = useAppColors();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={[
        styles.a,
        {
          width: size,
          height: size,
          borderRadius: size / 2.4,
          backgroundColor: tint ?? colors.primarySoft,
          borderColor: colors.primaryBorder,
          ...shadows.claySm,
        },
      ]}
    >
      <AppText variant="h3" color={colors.primary}>
        {initials}
      </AppText>
    </View>
  );
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }) {
  const { colors } = useAppColors();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText variant="callout" color={colors.textSecondary} style={{ marginTop: 4 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={10} style={styles.action}>
          <AppText variant="calloutStrong" color={colors.primary}>
            {actionLabel}
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={17} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const { colors } = useAppColors();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialCommunityIcons
          key={i}
          name={value >= i - 0.25 ? 'star' : value >= i - 0.75 ? 'star-half-full' : 'star-outline'}
          size={size}
          color={colors.star}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  a: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  action: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
});
