import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows } from '../../src/theme/tokens';
import { useAppStore } from '../../src/stores/useAppStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSyncStore } from '../../src/stores/useSyncStore';
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
    await loadHome();
    setRefreshing(false);
  }, [loadHome]);

  // Live data: a new category / vendor / approval lands without reload.
  // (Skips the very first fingerprint — boot already fetched fresh data.)
  const firstSync = useRef(true);
  useEffect(() => {
    if (syncRev === null || firstSync.current) {
      firstSync.current = syncRev === null;
      return;
    }
    void loadHome();
  }, [syncRev, loadHome]);

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
});
