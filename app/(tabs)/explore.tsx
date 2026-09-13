import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows } from '../../src/theme/tokens';
import { useAppStore } from '../../src/stores/useAppStore';
import { CategoryService } from '../../src/services';
import { Category } from '../../src/types/models';
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
});
