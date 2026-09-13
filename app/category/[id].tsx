import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout } from '../../src/theme/tokens';
import { CategoryService, VendorService } from '../../src/services';
import { Category, Vendor } from '../../src/types/models';
import { useVendorActions } from '../../src/hooks/useVendorActions';
import { AppText } from '../../src/components/ui/AppText';
import { VendorCard } from '../../src/components/vendor/Cards';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import { Chip } from '../../src/components/ui/Pills';
import { CallConfirmSheet } from '../../src/components/sheets/CallConfirmSheet';
import { Animations } from '../../src/components/motion/animations';
import { useT } from '../../src/i18n/store';
import { useSyncStore } from '../../src/stores/useSyncStore';
import { childrenOf } from '../../src/utils/taxonomy';
import { vendorKm } from '../../src/utils/distance';
import { useLocationStore } from '../../src/stores/useLocationStore';
import { CategoryTile } from '../../src/components/vendor/Cards';
import { SectionHeader } from '../../src/components/ui/bits';

export default function CategoryScreen() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t, catName } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { callVendor, setCallVendor, onCall, onChat } = useVendorActions();
  const [cat, setCat] = useState<Category | null>(null);
  const [allCats, setAllCats] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [sort, setSort] = useState<'reco' | 'rated' | 'near'>('reco');
  const gps = useLocationStore((s) => s.coords);
  const syncRev = useSyncStore((s) => s.rev);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, page] = await Promise.all([CategoryService.list(), VendorService.byCategory(String(id), 0)]);
      setAllCats(cats);
      setCat(cats.find((c: Category) => c.id === String(id)) ?? null);
      setVendors(page.items);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load, syncRev, attempt]);

  // Fresh on return (e.g. vendor approved while browsing) + on live changes.
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const leaves = cat && !cat.parentId ? childrenOf(allCats, cat.id) : [];
  const isGroup = leaves.length > 0;

  const shown = [...vendors].sort((a, b) => {
    if (sort === 'rated') return b.rating - a.rating || b.reviewCount - a.reviewCount;
    if (sort === 'near') return (vendorKm(a, gps) ?? 999) - (vendorKm(b, gps) ?? 999);
    return b.reviewCount - a.reviewCount;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        {cat ? (
          <View style={[styles.catBadge, { backgroundColor: cat.tint }]}>
            <MaterialCommunityIcons name={cat.icon as never} size={22} color="#131313" />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{cat ? catName(cat.slug || cat.id, cat.name) : ''}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {cat?.tagline ?? ''} {vendors.length > 0 ? `• ${vendors.length} ${t('category.verifiedPros')}` : ''}
          </AppText>
        </View>
        <Pressable onPress={() => router.push('/search')} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={{ paddingLeft: 20, marginBottom: 4 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          <Chip label={t('explore.all')} selected={sort === 'reco'} onPress={() => setSort('reco')} />
          <Chip label={t('common.topRated')} icon="star" selected={sort === 'rated'} onPress={() => setSort('rated')} />
          <Chip label={t('common.nearest')} icon="map-marker" selected={sort === 'near'} onPress={() => setSort('near')} />
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ padding: layout.screenPad }}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: layout.screenPad, gap: 16, paddingBottom: 32 }}
          ListHeaderComponent={
            isGroup ? (
              <View style={{ marginBottom: 4 }}>
                <SectionHeader title={t('category.subcategories')} subtitle={`${leaves.length}`} />
                <FlatList
                  data={leaves}
                  keyExtractor={(c) => c.id}
                  numColumns={3}
                  scrollEnabled={false}
                  columnWrapperStyle={{ gap: 12 }}
                  contentContainerStyle={{ gap: 12 }}
                  renderItem={({ item, index }) => <CategoryTile item={item} index={index} fluid variant="showcase" />}
                />
                <View style={{ marginTop: 12 }}>
                  <SectionHeader title={t('explore.prosTitle')} subtitle={`${vendors.length}`} />
                </View>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => <VendorCard vendor={item} index={index} onCall={() => onCall(item)} onChat={() => void onChat(item)} />}
          ListEmptyComponent={
            err && vendors.length === 0 ? (
              <EmptyState
                icon="cloud-off"
                lottie={{ source: Animations.emptyInbox, fallbackIcon: 'cloud-off' }}
                title={t('common.offline')}
                body={err}
                actionLabel={t('common.retry')}
                onAction={() => setAttempt((a) => a + 1)}
              />
            ) : (
              <EmptyState
                icon="store-search"
                lottie={{ source: Animations.emptySearch, fallbackIcon: 'store-search' }}
                title={t('category.emptyTitle')}
                body={t('category.emptyBody')}
                actionLabel={t('common.seeAll')}
                onAction={() => router.push('/(tabs)/explore')}
              />
            )
          }
        />
      )}
      <CallConfirmSheet vendor={callVendor} visible={!!callVendor} onClose={() => setCallVendor(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catBadge: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
