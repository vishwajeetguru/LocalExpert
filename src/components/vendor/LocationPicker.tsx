import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { radius, shadows, spacing } from '../../theme/tokens';
import { useT } from '../../i18n/store';
import { useToastStore } from '../../stores/useUiStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { AppText } from '../ui/AppText';

/**
 * Shop-location capture for vendor forms. Vendors pin their shop once —
 * customers then see true GPS distance, sorted nearest-first.
 */
export function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number } | null) => void;
}) {
  const { colors } = useAppColors();
  const { t } = useT();
  const showToast = useToastStore((s) => s.show);
  const captureOnce = useLocationStore((s) => s.captureOnce);
  const [busy, setBusy] = useState(false);

  const capture = async () => {
    setBusy(true);
    try {
      const coords = await captureOnce();
      onChange(coords);
      showToast(t('loc.captured'));
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('verify.wrong'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.box, { backgroundColor: colors.card }, shadows.card]}>
      <View style={[styles.ic, { backgroundColor: value ? colors.successBg : colors.primarySoft }]}>
        <MaterialCommunityIcons
          name={value ? 'map-marker-check' : 'map-marker-plus'}
          size={24}
          color={value ? colors.success : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        {value ? (
          <AppText variant="calloutStrong" numberOfLines={1}>
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </AppText>
        ) : (
          <AppText variant="callout" color={colors.textSecondary}>
            {t('loc.useMine')}
          </AppText>
        )}
      </View>
      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : value ? (
        <Pressable onPress={() => onChange(null)} hitSlop={10} style={{ padding: 6 }}>
          <AppText variant="calloutStrong" color={colors.error}>
            {t('loc.clear')}
          </AppText>
        </Pressable>
      ) : (
        <Pressable onPress={capture} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="crosshairs-gps" size={17} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, padding: spacing.lg },
  ic: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
