import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows, spacing } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useGateStore } from '../../src/stores/useUiStore';
import { useT } from '../../src/i18n/store';
import { useSyncStore } from '../../src/stores/useSyncStore';
import { statusLabel } from '../../src/i18n/status';
import { RequestService } from '../../src/services';
import { ServiceRequest } from '../../src/types/models';
import { AppText } from '../../src/components/ui/AppText';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import { StatusPill, Chip } from '../../src/components/ui/Pills';
import { Animations } from '../../src/components/motion/animations';
import { prettyDate } from '../../src/utils/format';

const toneFor = (s: ServiceRequest['status']) =>
  s === 'completed' ? 'success' : s === 'cancelled' ? 'error' : s === 'pending' ? 'warning' : 'info';

export default function RequestsTab() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const openAuthGate = useGateStore((s) => s.openAuthGate);
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = user.role === 'vendor' && user.vendorId
        ? await RequestService.forVendor(user.vendorId)
        : await RequestService.forCustomer(user.id);
      // vendors without linked vendor profile fall back to customer list
      const fallback = user.role === 'vendor' && !user.vendorId ? await RequestService.forCustomer(user.id) : list;
      setItems(fallback);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { void load(); }, [load, attempt]);

  // Live statuses: vendor accepts while this screen is open.
  const syncRev = useSyncStore((s) => s.rev);
  useEffect(() => {
    if (user && syncRev !== null) void load();
  }, [syncRev, user, load]);

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <EmptyState
          icon="clipboard-text"
          lottie={{ source: Animations.emptyInbox, fallbackIcon: 'clipboard-text' }}
          title={t('req.guestTitle')}
          body={t('req.guestBody')}
          actionLabel={t('profile.emailBtn')}
          onAction={() => openAuthGate(t('req.guestBody'), t('req.title'))}
        />
      </View>
    );
  }

  const visible = items.filter((r) => {
    if (filter === 'active') return r.status === 'pending' || r.status === 'accepted' || r.status === 'in_progress';
    if (filter === 'done') return r.status === 'completed' || r.status === 'cancelled';
    return true;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <View style={{ paddingHorizontal: layout.screenPad, marginBottom: 12 }}>
        <AppText variant="h1">{t('req.title')}</AppText>
        <AppText variant="callout" color={colors.textSecondary}>
          {items.length}
        </AppText>
      </View>
      <View style={{ paddingLeft: layout.screenPad, marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: layout.screenPad }}>
          <Chip label={t('explore.all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label={t('dash.active')} selected={filter === 'active'} onPress={() => setFilter('active')} />
          <Chip label={t('dash.done')} selected={filter === 'done'} onPress={() => setFilter('done')} />
        </ScrollView>
      </View>
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: layout.screenPad, gap: 12, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.primary} />}
        ListEmptyComponent={
          loading ? <SkeletonList count={3} /> : err && items.length === 0 ? (
            <EmptyState
              icon="cloud-off"
              title={t('common.offline')}
              body={err}
              actionLabel={t('common.retry')}
              onAction={() => setAttempt((a) => a + 1)}
            />
          ) : (
            <EmptyState
              icon="clipboard-plus"
              lottie={{ source: Animations.emptyInbox, fallbackIcon: 'clipboard-plus' }}
              title={t('req.emptyTitle')}
              body={t('req.emptyBody')}
              actionLabel={user?.role === 'vendor' ? t('profile.dashboard') : t('req.findBtn')}
              onAction={() => (user?.role === 'vendor' ? router.push('/vendor-dashboard') : router.push('/(tabs)'))}
            />
          )
        }
        renderItem={({ item }) => {
          const tone = toneFor(item.status);
          const edge = tone === 'success' ? colors.success : tone === 'error' ? colors.error : tone === 'warning' ? colors.warning : colors.primary;
          // Vendors see WHO requested (customer + slot); customers see WHAT/WHO they booked.
          const isVendorView = user?.role === 'vendor';
          return (
            <Pressable onPress={() => router.push(`/request/${item.id}`)} style={[styles.card, { backgroundColor: colors.card, borderLeftColor: edge }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <StatusPill tone={tone as never} label={statusLabel(t, item.status)} icon="pulse" />
                <AppText variant="caption" color={colors.textSecondary}>
                  {prettyDate(item.preferredDate)} • {item.preferredTime}
                </AppText>
              </View>
              <AppText variant="bodyStrong" style={{ marginTop: 8 }}>
                {item.serviceSummary}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {isVendorView ? `${item.customerName} • ${item.phone}` : `${item.vendorName} • ${item.categoryName}`}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <MaterialCommunityIcons name="map-marker" size={15} color={colors.textSecondary} />
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {item.address}
                </AppText>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { borderRadius: radius.lg, padding: spacing.lg, borderLeftWidth: 4, ...shadows.card },
});
