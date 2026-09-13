import { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { radius, shadows } from '../../src/theme/tokens';
import { ChatService } from '../../src/services';
import { Message } from '../../src/types/models';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { isMockMode } from '../../src/api/config';
import { useT } from '../../src/i18n/store';
import { AppText } from '../../src/components/ui/AppText';
import { Avatar } from '../../src/components/ui/bits';
import { timeAgo } from '../../src/utils/format';

export default function ChatDetail() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  // Header shows the OTHER party: customers see the vendor, vendors see
  // the customer (previously hardcoded "Vendor Chat" for both roles).
  const [peerName, setPeerName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setMessages(await ChatService.messages(String(id)));
      } catch {
        // thread stays empty; poll retries while open
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const convs = await ChatService.conversationsFor(user.id, user.role);
        const c = convs.find((x) => x.id === String(id));
        if (c) setPeerName(user.role === 'vendor' ? c.customerName : c.vendorName);
      } catch {
        // header falls back to the generic title
      }
    })();
  }, [id, user]);

  // Live thread: poll for replies while the conversation is open (live API only).
  useEffect(() => {
    if (isMockMode) return;
    const timer = setInterval(async () => {
      try {
        const fresh = await ChatService.messages(String(id));
        setMessages((prev) => (fresh.length === prev.length ? prev : fresh));
      } catch {
        // stay on cached thread, retry next tick
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [id]);

  // Keep the latest message visible while typing: the layout already shrinks
  // around the keyboard (see below); this scrolls the tail back into view
  // once the keyboard has settled open.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => sub.remove();
  }, []);

  const send = async () => {
    const t = text.trim();
    if (!t || !user || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await ChatService.send(String(id), user.id, user.role === 'vendor' ? 'vendor' : 'customer', t);
      setMessages((m) => [...m, msg]);
    } catch {
      setText(t);
    } finally {
      setSending(false);
    }
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.head, { backgroundColor: colors.surface, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Avatar name={peerName ?? 'Vendor Chat'} size={40} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{peerName ?? t('chats.title')}</AppText>
          {user?.role === 'vendor' ? (
            <AppText variant="caption" color={colors.textSecondary}>
              {t('profile.customer')}
            </AppText>
          ) : (
            <AppText variant="caption" color={colors.success}>
              ● {t('chats.onlineNote')}
            </AppText>
          )}
        </View>
        <Pressable hitSlop={12} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="phone" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/*
        Native keyboard tracking (react-native-keyboard-controller, provided
        once at the root). behavior="padding" shrinks this container in
        layout when the keyboard opens — the message list gets shorter and
        the composer rides immediately above the keyboard — then restores
        the exact same layout when it closes. The old RN
        KeyboardAvoidingView is JS-timed and unreliable inside the native
        stack + safe-area, which is what left the composer buried on iOS.

        The composer keeps only a 10px inner gap; the home-indicator gap
        lives in the filler below so the visible gap above the OPEN
        keyboard stays tight (no double-counted safe area).
      */}
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 12, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = user && item.senderId === user.id;
            return (
              <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', paddingHorizontal: 2 }}>
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: colors.primary, borderBottomRightRadius: 6, ...shadows.glow }
                      : { backgroundColor: colors.surface, borderBottomLeftRadius: 6, borderColor: colors.borderSoft, borderWidth: 1 },
                  ]}
                >
                  <AppText variant="body" color={mine ? '#fff' : colors.text}>
                    {item.text}
                  </AppText>
                </View>
                <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 3 }}>
                  {timeAgo(item.createdAt)} {mine ? (item.read ? '• Seen' : '• Sent') : ''}
                </AppText>
              </View>
            );
          }}
        />

        <View style={[styles.inputBar, { backgroundColor: colors.surface }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('chats.typeHint')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surface2, color: colors.text }]}
            multiline
            onSubmitEditing={send}
          />
          <Pressable onPress={send} style={[styles.send, { backgroundColor: colors.primary, opacity: text.trim() ? 1 : 0.5 }]}>
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      {/* Home-indicator safe area — same surface as the composer so the two read as one bar. */}
      <View style={{ height: insets.bottom, backgroundColor: colors.surface }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  bubble: { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 11 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, maxHeight: 110 },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
