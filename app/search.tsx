import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../src/theme';
import { layout } from '../src/theme/tokens';
import { useAppStore } from '../src/stores/useAppStore';
import { VendorService } from '../src/services';
import { popularSearches } from '../src/api/mock/categories';
import { Category, Vendor } from '../src/types/models';
import { useDebouncedValue } from '../src/hooks/useDebouncedValue';
import { useVendorActions } from '../src/hooks/useVendorActions';
import { AppText } from '../src/components/ui/AppText';
import { SearchBar } from '../src/components/ui/SearchBar';
import { VendorCard } from '../src/components/vendor/Cards';
import { EmptyState } from '../src/components/ui/EmptyState';
import { SkeletonList } from '../src/components/ui/Skeleton';
import { CallConfirmSheet } from '../src/components/sheets/CallConfirmSheet';
import { Animations } from '../src/components/motion/animations';
import { useT } from '../src/i18n/store';

export default function Search() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const { categories, recentSearches, pushRecentSearch, clearRecentSearches } = useAppStore();
  const { callVendor, setCallVendor, onCall, onChat } = useVendorActions();
  const { t, catName } = useT();
  const [query, setQuery] = useState(typeof params.q === 'string' ? params.q : '');
  const debounced = useDebouncedValue(query, 350);
  const [cats, setCats] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (typeof params.q === 'string' && params.q) setQuery(params.q);
  }, [params.q]);

  useEffect(() => {
    (async () => {
      const q = debounced.trim();
      if (!q) {
        setCats([]);
        setVendors([]);
        return;
      }
      setLoading(true);
      try {
        const res = await VendorService.search(q);
        setCats(res.categories);
        setVendors(res.vendors);
        setErr(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    })();
  }, [debounced, attempt]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return categories.filter((c: Category) => c.name.toLowerCase().includes(q) || c.keywords.some((k: string) => k.includes(q))).slice(0, 5);
  }, [query, categories]);

  const submit = (q: string) => {
    if (!q.trim()) return;
    pushRecentSearch(q.trim());
    setQuery(q.trim());
  };

  const showBlank = !query.trim();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <View style={{ paddingHorizontal: layout.screenPad, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <SearchBar value={query} onChange={setQuery} onSubmit={() => submit(query)} autoFocus placeholder={t('search.hint')} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: layout.screenPad, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {showBlank ? (
          <>
            {recentSearches.length > 0 ? (
              <View style={{ marginBottom: 18 }}>
                <View style={styles.rowHead}>
                  <AppText variant="h3">{t('search.recent')}</AppText>
                  <Pressable onPress={clearRecentSearches}>
                    <AppText variant="calloutStrong" color={colors.primary}>
                      {t('common.clear')}
                    </AppText>
                  </Pressable>
                </View>
                {recentSearches.map((r: string) => (
                  <Pressable key={r} onPress={() => submit(r)} style={[styles.row, { borderBottomColor: colors.borderSoft }]}>
                    <MaterialCommunityIcons name="history" size={19} color={colors.textSecondary} />
                    <AppText variant="body" style={{ flex: 1 }}>
                      {r}
                    </AppText>
                    <MaterialCommunityIcons name="arrow-top-left" size={19} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
            ) : null}
            <AppText variant="h3" style={{ marginBottom: 10 }}>
              {t('search.popularIn')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {popularSearches.map((p: string) => (
                <Pressable key={p} onPress={() => submit(p)} style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="trending-up" size={15} color={colors.primary} />
                  <AppText variant="calloutStrong">{p}</AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="h3" style={{ marginTop: 20, marginBottom: 10 }}>
              {t('search.browse')}
            </AppText>
            {categories.slice(0, 8).map((c: Category) => (
              <Pressable key={c.id} onPress={() => router.push(`/category/${c.id}`)} style={[styles.row, { borderBottomColor: colors.borderSoft }]}>
                <View style={[styles.cicon, { backgroundColor: c.tint }]}>
                  <MaterialCommunityIcons name={c.icon as never} size={22} color="#131313" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{catName(c.slug || c.id, c.name)}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {c.tagline} • {c.vendorCount} {t('common.pros')}
                  </AppText>
                </View>
                <View style={[styles.goCircle, { backgroundColor: colors.surface2 }]}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </View>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            {suggestions.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                {suggestions.map((s: Category) => (
                  <Pressable key={s.id} onPress={() => router.push(`/category/${s.id}`)} style={styles.suggest}>
                    <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
                    <AppText variant="body">
                      {catName(s.slug || s.id, s.name)}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {loading ? (
              <SkeletonList count={3} />
            ) : err ? (
              <EmptyState
                icon="cloud-off"
                lottie={{ source: Animations.emptyInbox, fallbackIcon: 'cloud-off' }}
                title={t('common.offline')}
                body={err}
                actionLabel={t('common.retry')}
                onAction={() => setAttempt((a) => a + 1)}
              />
            ) : cats.length === 0 && vendors.length === 0 ? (
              <EmptyState
                icon="magnify-close"
                lottie={{ source: Animations.emptySearch, fallbackIcon: 'magnify-close' }}
                title={t('search.noTitle')}
                body={t('search.noBody')}
                actionLabel={t('search.browseAction')}
                onAction={() => router.push('/(tabs)/explore')}
              />
            ) : (
              <View style={{ gap: 12 }}>
                {cats.length > 0 ? (
                  <AppText variant="captionStrong" color={colors.textSecondary}>
                    {t('search.catsLabel')} • {cats.length}
                  </AppText>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {cats.map((c: Category) => {
                    const parent = c.parentId ? categories.find((p) => p.id === c.parentId) : null;
                    return (
                      <Pressable key={c.id} onPress={() => router.push(`/category/${c.id}`)} style={[styles.pill, { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }]}>
                        <AppText variant="calloutStrong" color={colors.primary}>
                          {parent ? `${catName(parent.slug || parent.id, parent.name)} › ` : ''}{catName(c.slug || c.id, c.name)} →
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
                {vendors.length > 0 ? (
                  <AppText variant="captionStrong" color={colors.textSecondary} style={{ marginTop: 6 }}>
                    {t('search.vendorsLabel')} • {vendors.length}
                  </AppText>
                ) : null}
                {vendors.map((v: Vendor, i: number) => (
                  <VendorCard key={v.id} index={i} vendor={v} onCall={() => onCall(v)} onChat={() => void onChat(v)} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <CallConfirmSheet vendor={callVendor} visible={!!callVendor} onClose={() => setCallVendor(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  cicon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  goCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  suggest: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
});

