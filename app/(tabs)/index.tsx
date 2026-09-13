import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows } from '../../src/theme/tokens';
import { useAppStore } from '../../src/stores/useAppStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSyncStore } from '../../src/stores/useSyncStore';
import { useToastStore } from '../../src/stores/useUiStore';
import { RequestService, VendorService } from '../../src/services';
import { ServiceRequest, Vendor } from '../../src/types/models';
import { statusLabel } from '../../src/i18n/status';
import { useLocationStore } from '../../src/stores/useLocationStore';
import { vendorKm } from '../../src/utils/distance';
import { AppText } from '../../src/components/ui/AppText';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { SectionHeader } from '../../src/components/ui/bits';
import { CategoryTile, ProCard } from '../../src/components/vendor/Cards';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Animations } from '../../src/components/motion/animations';
import { ClayBlobs } from '../../src/components/ui/Clay';
import { LocationSheet } from '../../src/components/sheets/LocationSheet';
import { popularGroups } from '../../src/utils/taxonomy';
import { useT } from '../../src/i18n/store';
import { tap } from '../../src/utils/device';

export default function Home() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { city, categories, popularVendors, loadingHome, homeError, loadHome } = useAppStore();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [locSheet, setLocSheet] = useState(false);
  const syncRev = useSyncStore((s) => s.rev);
  const gps = useLocationStore((s) => s.coords);
  const locStatus = useLocationStore((s) => s.status);
  const locPlace = useLocationStore((s) => s.place);
  const requestGps = useLocationStore((s) => s.request);
  const h = new Date().getHours();
  const greetKey = h < 12 ? 'home.greetMorning' : h < 17 ? 'home.greetAfternoon' : 'home.greetEvening';
  const popular = popularGroups(categories);

  // Nearby means NEARBY when GPS is on — live-sorted by true distance.
  const nearby = useMemo(() => {
    if (!gps) return popularVendors.slice(0, 5);
    return [...popularVendors]
      .map((v) => ({ v, km: vendorKm(v, gps) ?? 999 }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 5)
      .map((x) => x.v);
  }, [popularVendors, gps]);

  const onLocPress = () => {
    tap('light');
    if (locStatus === 'unknown') setLocSheet(true);
    else void requestGps();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHome(gps);
    setRefreshing(false);
  }, [loadHome, gps]);

  // Live data: a new category / vendor / approval lands without reload.
  // (Skips the very first fingerprint — boot already fetched fresh data.)
  const firstSync = useRef(true);
  useEffect(() => {
    if (syncRev === null || firstSync.current) {
      firstSync.current = syncRev === null;
      return;
    }
    void loadHome(gps);
  }, [syncRev, loadHome, gps]);

  // Vendors get a business home — not the customer discovery feed.
  if (user?.role === 'vendor') {
    return <VendorHome />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ClayBlobs />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Location + account */}
        <View style={[styles.topRow, { paddingTop: insets.top + 10 }]}>
          <Pressable style={styles.loc} onPress={onLocPress}>
            <View style={[styles.pin, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons
                name={locStatus === 'granted' ? 'map-marker-check' : 'map-marker'}
                size={20}
                color={colors.primary}
              />
            </View>
            <View>
              <AppText variant="caption" color={colors.textSecondary}>
                {t('home.location')}{locStatus === 'granted' ? ' • GPS' : ''}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <AppText variant="bodyStrong">{locPlace ?? `${city}, Maharashtra`}</AppText>
                <MaterialCommunityIcons name="chevron-down" size={18} color={colors.text} />
              </View>
            </View>
          </Pressable>
          <Pressable
            onPress={() => (user ? router.push('/(tabs)/profile') : router.push('/auth/login'))}
            style={styles.avatarBtn}
          >
            {user ? (
              <View>
                <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                  <AppText variant="bodyStrong" color={colors.primary}>
                    {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </AppText>
                </View>
                <View style={[styles.avatarDot, { borderColor: colors.background }]} />
              </View>
            ) : (
              <MaterialCommunityIcons name="account-circle-outline" size={36} color={colors.textTertiary} />
            )}
          </Pressable>
        </View>

        {/* Greeting + headline */}
        <View style={{ paddingHorizontal: layout.screenPad, marginTop: 14 }}>
          <AppText variant="callout" color={colors.textSecondary}>
            {t(greetKey)}, {city}
          </AppText>
          <AppText variant="display" style={{ marginTop: 4 }}>
            {t('home.needToday')}
          </AppText>
          <AppText variant="callout" color={colors.textSecondary} style={{ marginTop: 6 }}>
            {t('home.promise')}
          </AppText>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: layout.screenPad, marginTop: 16 }}>
          <Pressable onPress={() => router.push('/search')}>
            <View pointerEvents="none">
              <SearchBar value="" onChange={() => {}} readonly placeholder={t('home.searchHint')} />
            </View>
          </Pressable>
        </View>

        {/* Trust banner */}
        <View style={{ paddingHorizontal: layout.screenPad, marginTop: 16 }}>
          <View style={[styles.trust, { backgroundColor: '#FFEDE3' }]}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, paddingRight: 6 }}>
                <View style={styles.trustShield}>
                  <MaterialCommunityIcons name="shield-check" size={28} color={colors.primary} />
                </View>
                <AppText variant="h2" style={{ marginTop: 10, fontSize: 20, lineHeight: 26 }}>
                  {t('home.trustTitle')}
                </AppText>
                <AppText variant="callout" color={colors.textSecondary} style={{ marginTop: 5, fontSize: 13.5 }} numberOfLines={3}>
                  {t('home.trustSub')}
                </AppText>
              </View>
              <View style={styles.trustPhotoRing}>
                <Image
                  source={require('../../assets/service-provider-employee.png')}
                  style={styles.trustPhoto}
                  contentFit="cover"
                  transition={300}
                />
              </View>
            </View>
            <View style={styles.trustFoot}>
              <View style={styles.trustPills}>
                <View style={[styles.trustPill, { backgroundColor: '#fff' }]}>
                  <MaterialCommunityIcons name="shield-check" size={14} color={colors.primary} />
                  <AppText variant="tiny" color={colors.text}>{t('home.trustVerified')}</AppText>
                </View>
                <View style={[styles.trustPill, { backgroundColor: '#fff' }]}>
                  <MaterialCommunityIcons name="account-check" size={14} color={colors.primary} />
                  <AppText variant="tiny" color={colors.text}>{t('home.trustBg')}</AppText>
                </View>
                <View style={[styles.trustPill, { backgroundColor: '#fff' }]}>
                  <MaterialCommunityIcons name="star" size={14} color={colors.primary} />
                  <AppText variant="tiny" color={colors.text}>{t('home.trustReliable')}</AppText>
                </View>
              </View>
              <Pressable
                onPress={() => router.push('/(tabs)/explore')}
                style={[styles.learnMore, { backgroundColor: '#FFE0CF' }]}
              >
                <AppText variant="calloutStrong" color={colors.primary} numberOfLines={1}>
                  {t('home.learnMore')}
                </AppText>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Popular categories rail */}
        <View style={{ marginTop: 24 }}>
          <View style={{ paddingHorizontal: layout.screenPad }}>
            <SectionHeader title={t('home.popular')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/explore')} />
          </View>
          {loadingHome ? (
            <View style={{ paddingHorizontal: layout.screenPad }}>
              <SkeletonList count={1} />
            </View>
          ) : homeError && categories.length === 0 ? (
            <View style={{ paddingHorizontal: layout.screenPad }}>
              <EmptyState
                icon="cloud-off"
                lottie={{ source: Animations.emptyInbox, fallbackIcon: 'cloud-off' }}
                title={t('common.offline')}
                body={homeError}
                actionLabel={t('common.retry')}
                onAction={() => void loadHome()}
              />
            </View>
          ) : (
            <FlatList
              horizontal
              data={popular}
              keyExtractor={(c) => c.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: layout.screenPad }}
              snapToInterval={98}
              decelerationRate="fast"
              renderItem={({ item, index }) => <CategoryTile item={item} index={index} variant="rail" />}
            />
          )}
        </View>

        {/* Nearby verified pros */}
        <View style={{ paddingHorizontal: layout.screenPad, marginTop: 24 }}>
          <SectionHeader title={t('home.nearby')} subtitle={t('home.nearbySub')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/explore')} />
          {loadingHome ? (
            <SkeletonList count={3} />
          ) : (
            <View style={{ gap: 14 }}>
              {nearby.map((v, i) => (
                <ProCard key={v.id} vendor={v} index={i} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <LocationSheet visible={locSheet} onClose={() => setLocSheet(false)} />
    </View>
  );
}

/**
 * Vendor home: business greeting + verification status + today's pipeline +
 * quick actions. No discovery content (search banner, popular, nearby) — a
 * vendor opens the app to run their business, not to hire one.
 */
function VendorHome() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const me = useAuthStore.getState().user;
    if (!me) return;
    try {
      const v = me.vendorId ? await VendorService.getById(me.vendorId) : await VendorService.myVendor(me.id);
      setVendor(v);
      if (v) setRequests(await RequestService.forVendor(v.id));
    } catch {
      // cards keep cached content; dashboard surfaces errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const syncRev = useSyncStore((s) => s.rev);
  useEffect(() => { void load(); }, [load, syncRev]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const fresh = requests.filter((r) => r.status === 'pending');
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
      <ClayBlobs />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topRow, { paddingTop: insets.top + 10 }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="callout" color={colors.textSecondary}>
              {t('home.vendorHi')}, {user?.name?.split(' ')[0] ?? ''}
            </AppText>
            <AppText variant="display" numberOfLines={1} style={{ marginTop: 2 }}>
              {vendor?.businessName ?? t('dash.title')}
            </AppText>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              <AppText variant="bodyStrong" color={colors.primary}>
                {(vendor?.businessName ?? user?.name ?? 'V').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </AppText>
            </View>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: layout.screenPad, marginTop: 14, gap: 12 }}>
          {/* Verification status */}
          <View style={[styles.vBanner, { backgroundColor: isLive ? colors.successBg : isPending ? colors.warningBg : colors.errorBg }]}>
            <MaterialCommunityIcons
              name={isLive ? 'check-decagram' : isPending ? 'clock' : 'alert'}
              size={26}
              color={isLive ? colors.success : isPending ? colors.warning : colors.error}
            />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" color={isLive ? colors.success : isPending ? colors.warning : colors.error}>
                {loading ? '…' : isLive ? t('dash.live') : isPending ? t('dash.pending') : vendor?.verificationStatus ?? ''}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {isLive ? t('dash.liveSub') : t('dash.pendingSub')}
              </AppText>
            </View>
          </View>

          {/* Pipeline stats */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.vStat, { backgroundColor: colors.card }]}>
              <AppText variant="h1" color={colors.warning}>{String(fresh.length)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{t('dash.new')}</AppText>
            </View>
            <View style={[styles.vStat, { backgroundColor: colors.card }]}>
              <AppText variant="h1" color={colors.primary}>{String(active)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{t('dash.active')}</AppText>
            </View>
            <View style={[styles.vStat, { backgroundColor: colors.card }]}>
              <AppText variant="h1" color={colors.success}>{String(done)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{t('dash.done')}</AppText>
            </View>
          </View>

          {/* Fresh requests with quick actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <AppText variant="h3">{t('hub.newRequests')} ({fresh.length})</AppText>
            <Pressable onPress={() => router.push('/vendor-dashboard')}>
              <AppText variant="calloutStrong" color={colors.primary}>{t('common.seeAll')}</AppText>
            </Pressable>
          </View>
          {fresh.length === 0 ? (
            <View style={[styles.vCard, { backgroundColor: colors.card }]}>
              <AppText variant="callout" color={colors.textSecondary} align="center">
                {isLive ? t('dash.emptyLive') : t('dash.emptyPending')}
              </AppText>
            </View>
          ) : (
            fresh.slice(0, 3).map((r) => (
              <View key={r.id} style={[styles.vCard, { backgroundColor: colors.card }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <StatusTone status={r.status} />
                  <AppText variant="caption" color={colors.textSecondary}>
                    {r.preferredDate} • {r.preferredTime}
                  </AppText>
                </View>
                <AppText variant="bodyStrong" style={{ marginTop: 6 }}>{r.serviceSummary}</AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {r.customerName} • {r.phone}
                </AppText>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Pressable onPress={() => void setStatus(r.id, 'accepted')} style={[styles.vAction, { backgroundColor: colors.primary }]}>
                    <AppText variant="calloutStrong" color="#fff">{t('dash.accept')}</AppText>
                  </Pressable>
                  <Pressable onPress={() => void setStatus(r.id, 'cancelled')} style={[styles.vAction, { borderColor: colors.border, borderWidth: 1.5 }]}>
                    <AppText variant="calloutStrong">{t('dash.decline')}</AppText>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          {/* Quick actions */}
          <AppText variant="h3" style={{ marginTop: 4 }}>{t('hub.quick')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <QuickTile icon="view-dashboard" tint="#E9F6EE" iconColor="#16A34A" label={t('profile.dashboard')} onPress={() => router.push('/vendor-dashboard')} />
            <QuickTile icon="pencil" tint="#FFF1EB" iconColor={colors.primary} label={t('edit.title')} onPress={() => router.push('/vendor-dashboard/edit')} />
            <QuickTile icon="store" tint="#E8F1FE" iconColor="#2563EB" label={t('dash.preview')} onPress={() => vendor && router.push({ pathname: '/vendor/[id]', params: { id: vendor.id } } as never)} />
            <QuickTile icon="chat" tint="#F3E8FF" iconColor="#7C3AED" label={t('profile.chats')} onPress={() => router.push('/(tabs)/chats')} />
          </View>
        </View>
      </ScrollView>
    </View>
  );

  function StatusTone({ status }: { status: ServiceRequest['status'] }) {
    return (
      <AppText variant="captionStrong" color={colors.warning}>
        {statusLabel(t, status)}
      </AppText>
    );
  }

  function QuickTile({ icon, tint, iconColor, label, onPress }: { icon: string; tint: string; iconColor: string; label: string; onPress: () => void }) {
    return (
      <Pressable onPress={onPress} style={[styles.vTile, { backgroundColor: colors.card }]}>
        <View style={[styles.vTileIcon, { backgroundColor: tint }]}>
          <MaterialCommunityIcons name={icon as never} size={24} color={iconColor} />
        </View>
        <AppText variant="calloutStrong" align="center" numberOfLines={2}>
          {label}
        </AppText>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pin: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarBtn: { padding: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarDot: { position: 'absolute', right: 0, bottom: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: '#FF4D24', borderWidth: 2.5 },
  trust: { borderRadius: radius.lg, padding: 18, ...shadows.card },
  trustShield: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,77,36,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  trustPhotoRing: {
    width: 132, height: 132, borderRadius: 66, overflow: 'hidden',
    backgroundColor: '#FAD9C5', alignSelf: 'flex-start', marginTop: 2,
  },
  trustPhoto: { width: 150, height: 150, marginLeft: -9, marginTop: -9 },
  trustFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  trustPills: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  trustPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  learnMore: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  vBanner: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: radius.lg, padding: 16 },
  vStat: { flex: 1, borderRadius: radius.lg, padding: 16, alignItems: 'center', gap: 4, ...shadows.card },
  vCard: { borderRadius: radius.lg, padding: 16, ...shadows.card },
  vAction: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  vTile: { flex: 1, minWidth: '47%', borderRadius: radius.lg, padding: 16, alignItems: 'center', gap: 8, ...shadows.card },
  vTileIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
