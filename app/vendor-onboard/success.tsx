import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAppColors } from '../../src/theme';
import { spacing } from '../../src/theme/tokens';
import { useT } from '../../src/i18n/store';
import { AppText } from '../../src/components/ui/AppText';
import { Button } from '../../src/components/ui/Button';
import { LottieMoment } from '../../src/components/motion/LottieMoment';
import { Animations } from '../../src/components/motion/animations';
import { AuthService, VendorService } from '../../src/services';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSyncStore } from '../../src/stores/useSyncStore';
import { Vendor } from '../../src/types/models';

export default function OnboardSuccess() {
  const { colors } = useAppColors();
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const vendorId = typeof id === 'string' ? id : '';
  const [vendor, setVendor] = useState<Vendor | null>(null);

  const load = useCallback(async () => {
    if (!vendorId) return;
    try {
      const v = await VendorService.getById(vendorId);
      if (v) {
        setVendor(v);
        // Keep role/vendorId fresh — admin approval promotes the user.
        const freshUser = await AuthService.currentUser();
        if (freshUser) useAuthStore.setState({ user: freshUser });
      }
    } catch {
      // stay on cached status card, retry next tick
    }
  }, [vendorId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Live status: global sync bump + direct poll while pending, so the moment
  // admin approves, this screen flips to live with no manual refresh.
  const syncRev = useSyncStore((s) => s.rev);
  useEffect(() => {
    if (syncRev !== null) void load();
  }, [syncRev, load]);

  const status = vendor?.verificationStatus;
  useEffect(() => {
    if (!vendorId || (status && status !== 'pending')) return;
    const timer = setInterval(() => void load(), 8000);
    return () => clearInterval(timer);
  }, [vendorId, status, load]);

  const isLive = status === 'approved';
  return (
    <ScrollView
      contentContainerStyle={[styles.root, { backgroundColor: colors.background }]}
      style={{ backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.primary} />}
    >
      {/* Peak moment — confetti burst behind a drawing check */}
      <View style={styles.stage}>
        <LottieMoment source={Animations.celebration} size={240} fallbackIcon="party-popper" />
        <View style={styles.check}>
          <LottieMoment source={Animations.successCheck} size={132} fallbackIcon="check-decagram" />
        </View>
      </View>
      <AppText variant="h1" align="center" style={{ marginTop: 8 }}>
        {isLive ? t('dash.live') : t('success.title')}
      </AppText>
      <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 320 }}>
        {isLive ? t('dash.liveSub') : t('success.body')}
      </AppText>
      <View style={[styles.status, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}>
        <AppText variant="tiny" color={colors.textSecondary}>
          {t('success.status')}
        </AppText>
        {isLive ? (
          <>
            <AppText variant="h3" color={colors.success} style={{ marginTop: 2 }}>
              ● {t('dash.live')}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
              {t('dash.liveSub')}
            </AppText>
          </>
        ) : (
          <>
            <AppText variant="h3" color={colors.warning} style={{ marginTop: 2 }}>
              {t('success.pending')}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
              {t('success.pendingSub')}
            </AppText>
          </>
        )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  stage: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  status: { borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 18, minWidth: 280, borderWidth: 1 },
});
