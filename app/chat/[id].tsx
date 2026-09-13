import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
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

  useEffect(() => {
    (async () => {
      try {
        setMessages(await ChatService.messages(String(id)));
      } catch {
        // thread stays empty; poll retries while open
      }
    })();
  }, [id]);

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.head, { backgroundColor: colors.surface, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Avatar name="Vendor Chat" size={40} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{t('chats.title')}</AppText>
          <AppText variant="caption" color={colors.success}>
            ● {t('chats.onlineNote')}
          </AppText>
        </View>
        <Pressable hitSlop={12} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="phone" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 12 }}
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

      <View style={[styles.inputBar, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 10 }]}>
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  bubble: { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 11 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, maxHeight: 110 },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
