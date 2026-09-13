import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows, spacing } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useGateStore } from '../../src/stores/useUiStore';
import { useT } from '../../src/i18n/store';
import { useSyncStore } from '../../src/stores/useSyncStore';
import { ChatService } from '../../src/services';
import { Conversation } from '../../src/types/models';
import { AppText } from '../../src/components/ui/AppText';
import { Avatar } from '../../src/components/ui/bits';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import { Animations } from '../../src/components/motion/animations';
import { timeAgo } from '../../src/utils/format';

export default function ChatsTab() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const openAuthGate = useGateStore((s) => s.openAuthGate);
  const { t } = useT();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await ChatService.conversationsFor(user.id, user.role));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { void load(); }, [load, attempt]);

  // Live inbox: new replies arrive without reload.
  const syncRev = useSyncStore((s) => s.rev);
  useEffect(() => {
    if (user && syncRev !== null) void load();
  }, [syncRev, user, load]);

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="chat"
          lottie={{ source: Animations.emptyChat, fallbackIcon: 'chat' }}
          title={t('chats.guestTitle')}
          body={t('chats.guestBody')}
          actionLabel={t('profile.emailBtn')}
          onAction={() => openAuthGate(t('chats.guestBody'), t('chats.title'))}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <View style={{ paddingHorizontal: layout.screenPad, marginBottom: 12 }}>
        <AppText variant="h1">{t('chats.title')}</AppText>
        <AppText variant="callout" color={colors.textSecondary}>
          {items.length}
        </AppText>
      </View>
      {loading ? (
        <View style={{ paddingHorizontal: layout.screenPad }}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: layout.screenPad, gap: 10, paddingBottom: 32 }}
          ListEmptyComponent={
            err ? (
              <EmptyState
                icon="cloud-off"
                title={t('common.offline')}
                body={err}
                actionLabel={t('common.retry')}
                onAction={() => setAttempt((a) => a + 1)}
              />
            ) : (
              <EmptyState icon="chat-outline" lottie={{ source: Animations.emptyChat, fallbackIcon: 'chat-outline' }} title={t('chats.emptyTitle')} body={t('chats.emptyBody')} />
            )
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
              <Avatar name={item.vendorName} size={52} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {item.vendorName}
                  </AppText>
                  <AppText variant="tiny" color={colors.textTertiary}>
                    {timeAgo(item.lastAt)}
                  </AppText>
                </View>
                <AppText variant="callout" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
                  {item.lastMessage || 'Say namaste to start…'}
                </AppText>
                {item.vendorCategory ? (
                  <AppText variant="tiny" color={colors.primary} style={{ marginTop: 2 }}>
                    {item.vendorCategory}
                  </AppText>
                ) : null}
              </View>
              {item.unreadCount > 0 ? <View style={styles.unread}><AppText variant="tiny" color="#fff">{String(item.unreadCount)}</AppText></View> : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center', borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, ...shadows.card },
  unread: { backgroundColor: '#FF4D24', minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
