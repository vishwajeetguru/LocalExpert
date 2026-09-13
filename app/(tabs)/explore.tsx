import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows } from '../../src/theme/tokens';
import { useAppStore } from '../../src/stores/useAppStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSyncStore } from '../../src/stores/useSyncStore';
import { CategoryService, RequestService, VendorService } from '../../src/services';
import { Category, ServiceRequest, Vendor } from '../../src/types/models';
import { useT } from '../../src/i18n/store';
import { AppText } from '../../src/components/ui/AppText';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { SectionHeader } from '../../src/components/ui/bits';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { StaggerItem } from '../../src/components/motion/AnimatedIcon';
import { groupsOf } from '../../src/utils/taxonomy';
import { tap } from '../../src/utils/device';

export default function Explore() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t, catName } = useT();
  const { city } = useAppStore();
  const user = useAuthStore((s) => s.user);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCats(await CategoryService.list());
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const services = groupsOf(cats, 'services');
  const government = groupsOf(cats, 'government');

  // Vendors get a business hub — category discovery is a customer need.
  if (user?.role === 'vendor') {
    return <VendorHub />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <View style={styles.headRow}>
        <AppText variant="display">{t('explore.title')}</AppText>
        <Pressable
          onPress={() => router.push('/search')}
          style={[styles.searchBtn, { backgroundColor: colors.surface, borderColor: colors.borderSoft }, shadows.card]}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={colors.text} />
        </Pressable>
      </View>
      <Pressable style={styles.locRow} onPress={() => tap()}>
        <MaterialCommunityIcons name="map-marker" size={18} color={colors.primary} />
        <AppText variant="bodyStrong">{city}, Maharashtra</AppText>
        <MaterialCommunityIcons name="chevron-down" size={18} color={colors.text} />
      </Pressable>

      <View style={{ paddingHorizontal: layout.screenPad, marginTop: 14 }}>
        <SearchBar value="" onChange={() => {}} readonly onFocus={() => router.push('/search')} placeholder={t('search.hint')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: layout.screenPad, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <SkeletonList count={4} />
        ) : err && cats.length === 0 ? (
          <EmptyState
            icon="cloud-off"
            title={t('common.offline')}
            body={err}
            actionLabel={t('common.retry')}
            onAction={() => setAttempt((a) => a + 1)}
          />
        ) : (
          <>
            <SectionHeader title={t('explore.services')} subtitle={`${services.length}`} />
            <View style={{ gap: 10 }}>
              {services.map((g, i) => (
                <GroupRow key={g.id} item={g} index={i} />
              ))}
            </View>
            <View style={{ marginTop: 8 }}>
              <SectionHeader title={t('explore.government')} subtitle={`${government.length}`} />
            </View>
            <View style={{ gap: 10 }}>
              {government.map((g, i) => (
                <GroupRow key={g.id} item={g} index={i} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );

  function GroupRow({ item, index }: { item: Category; index: number }) {
    return (
      <StaggerItem index={Math.min(index, 6)}>
        <Pressable
          onPress={() => {
            tap('light');
            router.push(`/category/${item.id}`);
          }}
          style={[styles.row, { backgroundColor: colors.card }, shadows.card]}
        >
          <View style={[styles.tile, { backgroundColor: item.tint }]}>
            <MaterialCommunityIcons name={item.icon as never} size={26} color="#131313" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {catName(item.slug || item.id, item.name)}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {item.tagline} • {item.vendorCount} {t('common.pros')}
            </AppText>
          </View>
          <View style={[styles.go, { backgroundColor: colors.surface2 }]}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
        </Pressable>
      </StaggerItem>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  searchBtn: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 14 },
  tile: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  go: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hubCard: { borderRadius: radius.lg, padding: 16, ...shadows.card },
  hubTile: { flex: 1, minWidth: '47%', borderRadius: radius.lg, padding: 16, alignItems: 'center', gap: 8, ...shadows.card },
  hubTileIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statCell: { flex: 1, alignItems: 'center' },
});

/**
 * Vendor business hub: pipeline, performance and listing shortcuts — instead
 * of customer category discovery.
 */
function VendorHub() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const me = useAuthStore.getState().user;
    if (!me) return;
    try {
      const v = me.vendorId ? await VendorService.getById(me.vendorId) : await VendorService.myVendor(me.id);
      setVendor(v);
      if (v) setRequests(await RequestService.forVendor(v.id));
    } catch {
      // hub keeps cached content; dashboard surfaces errors
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const syncRev = useSyncStore((s) => s.rev);
  useEffect(() => { void load(); }, [load, syncRev]);

  const fresh = requests.filter((r) => r.status === 'pending');
  const ordered = [...requests].sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1)).slice(0, 5);
  const isLive = vendor?.verificationStatus === 'approved';

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="display">{t('hub.title')}</AppText>
          <AppText variant="callout" color={colors.textSecondary} numberOfLines={1}>
            {vendor?.businessName ?? t('hub.sub')}
          </AppText>
        </View>
        <Pressable
          onPress={() => vendor && router.push({ pathname: '/vendor/[id]', params: { id: vendor.id } } as never)}
          style={[styles.searchBtn, { backgroundColor: colors.surface, borderColor: colors.borderSoft }, shadows.card]}
        >
          <MaterialCommunityIcons name="eye" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: layout.screenPad, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load().finally(() => setRefreshing(false)); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Listing performance */}
        <View style={[styles.hubCard, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons
              name={isLive ? 'check-decagram' : 'clock'}
              size={22}
              color={isLive ? colors.success : colors.warning}
            />
            <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              {vendor?.businessName ?? '…'}
            </AppText>
            <AppText variant="captionStrong" color={isLive ? colors.success : colors.warning}>
              {isLive ? t('dash.live') : t('dash.pending')}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 14 }}>
            <View style={styles.statCell}>
              <AppText variant="h2">{vendor?.rating ? vendor.rating.toFixed(1) : '—'}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{t('hub.rating')}</AppText>
            </View>
            <View style={styles.statCell}>
              <AppText variant="h2">{String(vendor?.reviewCount ?? 0)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{t('hub.reviews')}</AppText>
            </View>
            <View style={styles.statCell}>
              <AppText variant="h2">{String(vendor?.completedJobs ?? 0)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{t('hub.jobs')}</AppText>
            </View>
            <View style={styles.statCell}>
              <AppText variant="h2" color={fresh.length > 0 ? colors.warning : undefined}>{String(fresh.length)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{t('dash.new')}</AppText>
            </View>
          </View>
        </View>

        {/* Shortcuts */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <HubTile icon="inbox" tint="#FBF1DE" iconColor="#B45309" label={t('dash.reqs')} badge={fresh.length > 0 ? String(fresh.length) : undefined} onPress={() => router.push('/vendor-dashboard')} />
          <HubTile icon="pencil" tint="#FFF1EB" iconColor={colors.primary} label={t('edit.title')} onPress={() => router.push('/vendor-dashboard/edit')} />
          <HubTile icon="chat" tint="#E8F1FE" iconColor="#2563EB" label={t('profile.chats')} onPress={() => router.push('/(tabs)/chats')} />
          <HubTile icon="clipboard-text" tint="#E9F6EE" iconColor="#16A34A" label={t('profile.requests')} onPress={() => router.push('/(tabs)/requests')} />
        </View>

        {/* Latest incoming */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <AppText variant="h3">{t('hub.latest')}</AppText>
          <Pressable onPress={() => router.push('/vendor-dashboard')}>
            <AppText variant="calloutStrong" color={colors.primary}>{t('common.seeAll')}</AppText>
          </Pressable>
        </View>
        {ordered.length === 0 ? (
          <View style={[styles.hubCard, { backgroundColor: colors.card }]}>
            <AppText variant="callout" color={colors.textSecondary} align="center">
              {t('dash.emptyPending')}
            </AppText>
          </View>
        ) : (
          ordered.map((r) => (
            <Pressable key={r.id} onPress={() => router.push('/vendor-dashboard')} style={[styles.hubCard, { backgroundColor: colors.card }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText variant="captionStrong" color={r.status === 'pending' ? colors.warning : colors.textSecondary}>
                  {r.status.toUpperCase()}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {r.preferredDate} • {r.preferredTime}
                </AppText>
              </View>
              <AppText variant="bodyStrong" style={{ marginTop: 6 }} numberOfLines={1}>
                {r.serviceSummary}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {r.customerName} • {r.phone}
              </AppText>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );

  function HubTile({ icon, tint, iconColor, label, badge, onPress }: { icon: string; tint: string; iconColor: string; label: string; badge?: string; onPress: () => void }) {
    const { colors: c } = useAppColors();
    return (
      <Pressable onPress={onPress} style={[styles.hubTile, { backgroundColor: c.card }]}>
        <View style={[styles.hubTileIcon, { backgroundColor: tint }]}>
          <MaterialCommunityIcons name={icon as never} size={24} color={iconColor} />
          {badge ? (
            <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#FF4D24', minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
              <AppText variant="tiny" color="#fff">{badge}</AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="calloutStrong" align="center" numberOfLines={2}>
          {label}
        </AppText>
      </Pressable>
    );
  }
}
