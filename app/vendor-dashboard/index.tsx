import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows, spacing } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { AuthService, RequestService, VendorService } from '../../src/services';
import { useSyncStore } from '../../src/stores/useSyncStore';
import { ServiceRequest, Vendor } from '../../src/types/models';
import { AppText } from '../../src/components/ui/AppText';
import { Avatar } from '../../src/components/ui/bits';
import { StatusPill } from '../../src/components/ui/Pills';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useToastStore } from '../../src/stores/useUiStore';
import { useT } from '../../src/i18n/store';
import { statusLabel } from '../../src/i18n/status';
import { Animations } from '../../src/components/motion/animations';

export default function VendorDashboard() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t, catName } = useT();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    setLoading(true);
    try {
      const v = currentUser.vendorId
        ? await VendorService.getById(currentUser.vendorId)
        : await VendorService.myVendor(currentUser.id);
      setVendor(v);
      if (v) setRequests(await RequestService.forVendor(v.id));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Live approval: global fingerprint bump (admin approves anywhere) refetches
  // immediately — same pattern as requests/chats/category screens.
  const syncRev = useSyncStore((s) => s.rev);
  useEffect(() => {
    if (syncRev !== null) void load();
  }, [syncRev, load]);

  // While pending, poll the vendor directly every 8s so approval appears in
  // real time even before the 20s global sync tick. Stops on its own once live.
  // Also refreshes the user — WordPress promotes role/vendorId on approval.
  const verificationStatus = vendor?.verificationStatus;
  useEffect(() => {
    if (verificationStatus !== 'pending') return;
    const timer = setInterval(async () => {
      try {
        const freshUser = await AuthService.currentUser();
        if (freshUser) useAuthStore.setState({ user: freshUser });
        await load();
      } catch {
        // stay on cached pending state, retry next tick
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [verificationStatus, load]);

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <EmptyState icon="view-dashboard" title={t('dash.title')} body={t('dash.pendingSub')} actionLabel={t('auth.loginBtn')} onAction={() => router.push('/auth/login')} />
      </View>
    );
  }

  if (!loading && !vendor) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {err ? (
          <EmptyState icon="cloud-off" title={t('common.offline')} body={err} actionLabel={t('common.retry')} onAction={() => void load()} />
        ) : (
          <EmptyState icon="store-plus" title={t('dash.noService')} body={t('dash.noServiceBody')} actionLabel={t('profile.become')} onAction={() => router.push('/vendor-onboard')} />
        )}
      </View>
    );
  }

  const pending = requests.filter((r) => r.status === 'pending').length;
  const active = requests.filter((r) => r.status === 'accepted' || r.status === 'in_progress').length;
  const done = requests.filter((r) => r.status === 'completed').length;
  const isLive = vendor?.verificationStatus === 'approved';
  const isPending = vendor?.verificationStatus === 'pending';

  const setStatus = async (id: string, status: ServiceRequest['status']) => {
    try {
      await RequestService.updateStatus(id, status);
      showToast(t('dash.updated'));
      void load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('dash.updated'), 'error');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: layout.screenPad, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
      >
        <View style={styles.head}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="h2">{t('dash.title')}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {vendor?.businessName ?? 'Loading…'}
            </AppText>
          </View>
          <Pressable onPress={() => router.push('/vendor-dashboard/edit')} hitSlop={10} style={[styles.back, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <View style={[styles.banner, { backgroundColor: isLive ? colors.successBg : isPending ? colors.warningBg : colors.errorBg }]}>
          <View style={[styles.bannerIcon, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons
              name={isLive ? 'check-decagram' : isPending ? 'clock' : 'alert'}
              size={26}
              color={isLive ? colors.success : isPending ? colors.warning : colors.error}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" color={isLive ? colors.success : isPending ? colors.warning : colors.error}>
              {isLive ? t('dash.live') : isPending ? t('dash.pending') : `Status: ${vendor?.verificationStatus}`}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {isLive ? t('dash.liveSub') : t('dash.pendingSub')}
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <StatCard value={String(pending)} label={t('dash.new')} icon="inbox" tone={colors.warning} tint={colors.warningBg} />
          <StatCard value={String(active)} label={t('dash.active')} icon="progress-wrench" tone={colors.primary} tint={colors.primarySoft} />
          <StatCard value={String(done)} label={t('dash.done')} icon="check-circle" tone={colors.success} tint={colors.successBg} />
        </View>

        <View style={[styles.profile, { backgroundColor: colors.card }]}>
          <Avatar name={vendor?.businessName ?? 'V'} size={52} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">{vendor?.businessName}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {vendor?.categoryId && vendor ? catName(vendor.categorySlug || vendor.categoryId, vendor.categoryName) : vendor?.categoryName} • {vendor?.phone}
            </AppText>
          </View>
          {vendor?.isVerified ? <StatusPill tone="success" label="Verified" icon="check-decagram" /> : <StatusPill tone="warning" label="Pending" icon="clock" />}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 }}>
          <AppText variant="h3">{t('dash.reqs')} ({requests.length})</AppText>
          <Pressable onPress={() => vendor && router.push({ pathname: '/vendor/[id]', params: { id: vendor.id } } as never)}>
            <AppText variant="calloutStrong" color={colors.primary}>
              {t('dash.preview')}
            </AppText>
          </Pressable>
        </View>

        {requests.length === 0 ? (
          <EmptyState icon="inbox" lottie={{ source: Animations.emptyInbox, fallbackIcon: 'inbox' }} title={t('dash.emptyTitle')} body={isLive ? t('dash.emptyLive') : t('dash.emptyPending')} />
        ) : (
          <View style={{ gap: 10 }}>
            {requests.map((r) => (
              <View key={r.id} style={[styles.req, { backgroundColor: colors.card }]}>
                <Pressable onPress={() => router.push(`/request/${r.id}`)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <StatusPill tone={r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : r.status === 'cancelled' ? 'error' : 'info'} label={statusLabel(t, r.status)} icon="pulse" />
                    <AppText variant="caption" color={colors.textSecondary}>
                      {r.preferredDate} • {r.preferredTime}
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong" style={{ marginTop: 8 }}>
                    {r.serviceSummary}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {r.customerName} • {r.phone} • {r.address}
                  </AppText>
                </Pressable>
                {r.status === 'pending' ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Button label={t('dash.accept')} size="sm" fullWidth onPress={() => void setStatus(r.id, 'accepted')} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button label={t('dash.decline')} size="sm" variant="outline" fullWidth onPress={() => void setStatus(r.id, 'cancelled')} />
                    </View>
                  </View>
                ) : r.status === 'accepted' ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Button label={t('dash.start')} size="sm" variant="secondary" fullWidth onPress={() => void setStatus(r.id, 'in_progress')} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button label={t('dash.complete')} size="sm" fullWidth onPress={() => void setStatus(r.id, 'completed')} />
                    </View>
                  </View>
                ) : r.status === 'in_progress' ? (
                  <View style={{ marginTop: 10 }}>
                    <Button label={t('dash.doneBtn')} size="sm" fullWidth onPress={() => void setStatus(r.id, 'completed')} />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label, icon, tone, tint }: { value: string; label: string; icon: string; tone: string; tint: string }) {
  const { colors } = useAppColors();
  return (
    <View style={[styles.stat, { backgroundColor: colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <MaterialCommunityIcons name={icon as never} size={22} color={tone} />
      </View>
      <AppText variant="h1" color={tone}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: radius.lg, padding: spacing.lg },
  bannerIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: 4, ...shadows.card },
  statIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  profile: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: radius.lg, padding: spacing.lg, marginTop: 12, ...shadows.card },
  req: { borderRadius: radius.lg, padding: spacing.lg, ...shadows.card },
});
