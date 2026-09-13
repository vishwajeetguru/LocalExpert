import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppColors } from '../../src/theme';
import { spacing } from '../../src/theme/tokens';
import { useT } from '../../src/i18n/store';
import { AppText } from '../../src/components/ui/AppText';
import { Button } from '../../src/components/ui/Button';
import { LottieMoment } from '../../src/components/motion/LottieMoment';
import { Animations } from '../../src/components/motion/animations';

export default function OnboardSuccess() {
  const { colors } = useAppColors();
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Peak moment — confetti burst behind a drawing check */}
      <View style={styles.stage}>
        <LottieMoment source={Animations.celebration} size={240} fallbackIcon="party-popper" />
        <View style={styles.check}>
          <LottieMoment source={Animations.successCheck} size={132} fallbackIcon="check-decagram" />
        </View>
      </View>
      <AppText variant="h1" align="center" style={{ marginTop: 8 }}>
        {t('success.title')}
      </AppText>
      <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 320 }}>
        {t('success.body')}
      </AppText>
      <View style={[styles.status, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}>
        <AppText variant="tiny" color={colors.textSecondary}>
          {t('success.status')}
        </AppText>
        <AppText variant="h3" color={colors.warning} style={{ marginTop: 2 }}>
          {t('success.pending')}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
          {t('success.pendingSub')}
        </AppText>
      </View>
      <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
        <Button label={t('success.dashboard')} fullWidth onPress={() => router.replace('/vendor-dashboard')} />
        <Button label={t('success.home')} variant="ghost" fullWidth onPress={() => router.replace('/(tabs)')} />
      </View>
      {id ? (
        <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 12 }}>
          Ref: {String(id).slice(-8).toUpperCase()}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  stage: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  status: { borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 18, minWidth: 280, borderWidth: 1 },
});
