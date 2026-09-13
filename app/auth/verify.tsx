import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, spacing } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useToastStore } from '../../src/stores/useUiStore';
import { AuthService } from '../../src/services';
import { isMockMode } from '../../src/api/config';
import { useT } from '../../src/i18n/store';
import { AppText } from '../../src/components/ui/AppText';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Float } from '../../src/components/motion/AnimatedIcon';
import { tap } from '../../src/utils/device';
import { KeyboardAwareScreen } from '../../src/components/keyboard/KeyboardAwareScreen';

const CODE_LEN = 6;
const RESEND_WAIT = 60;

/**
 * Email OTP gate — verification is mandatory before any platform action
 * (call, chat, request, save, submit). Code comes from the WordPress mailer;
 * in mock mode the demo code is shown on-screen.
 */
export default function Verify() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { email, demoCode, next } = useLocalSearchParams<{ email?: string; demoCode?: string; next?: string }>();
  const verify = useAuthStore((s) => s.verify);
  const loading = useAuthStore((s) => s.loading);
  const showToast = useToastStore((s) => s.show);

  const address = typeof email === 'string' ? email : '';
  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_WAIT);
  const [demo, setDemo] = useState(typeof demoCode === 'string' ? demoCode : '');
  const [currentEmail, setCurrentEmail] = useState(address);
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);
  const changeEmail = useAuthStore((s) => s.changeEmail);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const code = digits.join('');

  const submit = async (full?: string) => {
    const value = (full ?? code).replace(/\D/g, '');
    if (value.length !== CODE_LEN || !currentEmail) return;
    tap('medium');
    setError(null);
    try {
      const user = await verify(currentEmail, value);
      showToast(t('verify.done'));
      // Vendor signups continue into the business onboarding wizard;
      // everyone else follows the standard post-verify path below.
      const dest = next === 'vendor' ? '/vendor-onboard' : '/(tabs)';
      // Fresh accounts set a password right after proving the inbox — daily
      // logins then use email + password instead of OTP.
      if (!user.hasPassword) {
        router.replace({ pathname: '/auth/set-password', params: { mode: 'setup', next: next ?? '' } } as never);
        return;
      }
      router.replace(dest as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('verify.wrong'));
    }
  };

  const onChange = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '');
    // Full-code paste (SMS autofill / clipboard).
    if (clean.length > 1) {
      const next = Array(CODE_LEN).fill('');
      clean.slice(0, CODE_LEN).split('').forEach((d, k) => (next[k] = d));
      setDigits(next);
      if (clean.length >= CODE_LEN) void submit(clean);
      else inputs.current[Math.min(clean.length, CODE_LEN - 1)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
    if (clean && i === CODE_LEN - 1) void submit(next.join(''));
  };

  const onKey = (i: number, key: string) => {
    if (key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const resend = async () => {
    if (cooldown > 0 || !currentEmail) return;
    tap('light');
    try {
      const res = await AuthService.requestOtp(currentEmail);
      if (res.demoCode) setDemo(res.demoCode);
      setCooldown(RESEND_WAIT);
      setError(null);
      showToast(t('verify.sent'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('verify.wrong'));
    }
  };

  const fixEmail = async () => {
    const clean = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError(t('auth.emailErr'));
      return;
    }
    tap('medium');
    setError(null);
    try {
      const res = await changeEmail(clean);
      setCurrentEmail(clean);
      if (res.demoCode) setDemo(res.demoCode);
      setDigits(Array(CODE_LEN).fill(''));
      setEditing(false);
      setCooldown(RESEND_WAIT);
      showToast(t('verify.changed'));
      inputs.current[0]?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('verify.wrong'));
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
      </View>
      <KeyboardAwareScreen
        contentContainerStyle={{ paddingHorizontal: layout.screenPad, alignItems: 'center', paddingBottom: Math.max(32, insets.bottom + 24) }}
      >
        <Float dy={5}>
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="email-check" size={36} color={colors.primary} />
          </View>
        </Float>
        <AppText variant="h1" align="center" style={{ marginTop: 16 }}>
          {t('verify.title')}
        </AppText>
        <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 320 }}>
          {t('verify.sub')}
        </AppText>
        <AppText variant="calloutStrong" color={colors.primary} style={{ marginTop: 4 }}>
          {currentEmail}
        </AppText>
        {editing ? (
          <View style={{ width: '100%', marginTop: 12, gap: 10 }}>
            <Input
              label={t('verify.newEmail')}
              placeholder={t('auth.emailPh')}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="email"
            />
            <Button label={t('verify.update')} loading={loading} fullWidth onPress={fixEmail} />
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)} style={{ padding: 8 }}>
            <AppText variant="calloutStrong" color={colors.textSecondary} align="center">
              {t('verify.change')}
            </AppText>
          </Pressable>
        )}

        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                inputs.current[i] = r;
              }}
              value={d}
              onChangeText={(v) => onChange(i, v)}
              onKeyPress={({ nativeEvent }) => onKey(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={i === 0 ? CODE_LEN : 1}
              autoFocus={i === 0}
              selectTextOnFocus
              style={[
                styles.box,
                {
                  backgroundColor: colors.surface,
                  borderColor: error ? colors.error : d ? colors.primary : colors.border,
                  color: colors.text,
                },
              ]}
            />
          ))}
        </View>
        {error ? (
          <AppText variant="calloutStrong" color={colors.error} align="center" style={{ marginTop: 10 }}>
            {error}
          </AppText>
        ) : null}
        {isMockMode && demo ? (
          <View style={[styles.demo, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
            <AppText variant="calloutStrong" color={colors.goldDeep} align="center">
              {t('verify.demo')}: {demo}
            </AppText>
          </View>
        ) : null}

        <Button label={t('verify.submit')} loading={loading} fullWidth onPress={() => void submit()} style={{ marginTop: 20 }} />
        <Pressable onPress={resend} disabled={cooldown > 0} style={{ padding: 12 }}>
          <AppText variant="calloutStrong" color={cooldown > 0 ? colors.textTertiary : colors.primary} align="center">
            {cooldown > 0 ? `${t('verify.resend')} (${cooldown}s)` : t('verify.resend')}
          </AppText>
        </Pressable>
        <AppText variant="caption" color={colors.textTertiary} align="center" style={{ marginTop: 4, maxWidth: 300 }}>
          {t('verify.note')}
        </AppText>
      </KeyboardAwareScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingHorizontal: 16, marginBottom: 8 },
  back: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  boxes: { flexDirection: 'row', gap: 10, marginTop: 24, justifyContent: 'center' },
  box: {
    width: 52, height: 60, borderRadius: radius.md, borderWidth: 1.5,
    fontSize: 24, fontWeight: '700', textAlign: 'center',
  },
  demo: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 16 },
});
