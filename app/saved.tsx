import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../src/theme';
import { layout } from '../src/theme/tokens';
import { VendorService } from '../src/services';
import { Vendor } from '../src/types/models';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useGateStore } from '../src/stores/useUiStore';
import { useVendorActions } from '../src/hooks/useVendorActions';
import { useT } from '../src/i18n/store';
import { AppText } from '../src/components/ui/AppText';
import { VendorCard } from '../src/components/vendor/Cards';
import { EmptyState } from '../src/components/ui/EmptyState';
import { SkeletonList } from '../src/components/ui/Skeleton';
import { CallConfirmSheet } from '../src/components/sheets/CallConfirmSheet';
import { Animations } from '../src/components/motion/animations';

export default function Saved() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const openAuthGate = useGateStore((s) => s.openAuthGate);
  const { t } = useT();
  const { callVendor, setCallVendor, onCall, onChat } = useVendorActions();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const list: Vendor[] = [];
        for (const vid of user.savedVendorIds) {
          const v = await VendorService.getById(vid);
          if (v) list.push(v);
        }
        setVendors(list);
        setErr(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, attempt]);

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <EmptyState icon="bookmark" lottie={{ source: Animations.emptyInbox, fallbackIcon: 'bookmark' }} title={t('saved.guestTitle')} body={t('saved.guestBody')} actionLabel={t('profile.emailBtn')} onAction={() => openAuthGate()} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <AppText variant="h2">{t('saved.title')} ({vendors.length})</AppText>
        <View style={{ width: 42 }} />
      </View>
      {loading ? (
        <View style={{ padding: layout.screenPad }}>
          <SkeletonList count={3} />
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: layout.screenPad, gap: 12 }}
          ListEmptyComponent={
            err && vendors.length === 0 ? (
              <EmptyState icon="cloud-off" title={t('common.offline')} body={err} actionLabel={t('common.retry')} onAction={() => setAttempt((a) => a + 1)} />
            ) : (
              <EmptyState icon="bookmark-outline" lottie={{ source: Animations.emptyInbox, fallbackIcon: 'bookmark-outline' }} title={t('saved.emptyTitle')} body={t('saved.emptyBody')} actionLabel={t('req.findBtn')} onAction={() => router.push('/(tabs)')} />
            )
          }
          renderItem={({ item, index }) => <VendorCard vendor={item} index={index} onCall={() => onCall(item)} onChat={() => void onChat(item)} />}
        />
      )}
      <CallConfirmSheet vendor={callVendor} visible={!!callVendor} onClose={() => setCallVendor(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
