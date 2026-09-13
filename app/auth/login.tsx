import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows, spacing } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useToastStore } from '../../src/stores/useUiStore';
import { useT } from '../../src/i18n/store';
import { AppText } from '../../src/components/ui/AppText';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { emailOk } from '../../src/utils/format';
import { tap } from '../../src/utils/device';
import { config } from '../../src/api/config';
import { ClayBlobs } from '../../src/components/ui/Clay';

export default function Login() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const showToast = useToastStore((s) => s.show);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const submit = async () => {
    const e: typeof errors = {};
    if (mode === 'register' && name.trim().length < 2) e.name = t('auth.nameErr');
    if (!emailOk(email)) e.email = t('auth.emailErr');
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    tap('medium');
    try {
      const res = mode === 'login'
        ? await login(email.trim(), undefined)
        : await register(name.trim(), email.trim(), phone.trim() || undefined);
      if (res.needsVerification) {
        router.replace({ pathname: '/auth/verify', params: { email: email.trim().toLowerCase(), demoCode: res.demoCode ?? '' } } as never);
        return;
      }
      showToast(mode === 'login' ? t('auth.welcomeToast') : t('auth.createdToast'));
      router.back();
    } catch {
      showToast(t('auth.emailErr'), 'error');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <ClayBlobs />
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="close" size={22} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: layout.screenPad }} keyboardShouldPersistTaps="handled">
        <View style={[styles.logo, { backgroundColor: colors.primary }, shadows.glow]}>
          <MaterialCommunityIcons name="lightning-bolt" size={34} color="#fff" />
        </View>
        <AppText variant="tiny" color={colors.primary} align="center" style={{ marginTop: 16, letterSpacing: 2.5 }}>
          {config.appName.toUpperCase()}
        </AppText>
        <AppText variant="h1" align="center" style={{ marginTop: 6 }}>
          {mode === 'login' ? t('auth.welcome') : t('auth.create')}
        </AppText>
        <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 6 }}>
          {mode === 'login' ? t('auth.welcomeSub') : t('auth.createSub')}
        </AppText>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
          {mode === 'register' ? (
            <Input label={t('auth.name')} placeholder={t('auth.namePh')} value={name} onChangeText={setName} error={errors.name} leftIcon="account" />
          ) : null}
          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPh')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            leftIcon="email"
          />
          {mode === 'register' ? (
            <Input label={t('auth.phone')} placeholder="+91 …" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="phone" />
          ) : null}
          <Button label={mode === 'login' ? t('auth.loginBtn') : t('auth.createBtn')} loading={loading} fullWidth onPress={submit} />
          <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ alignItems: 'center', padding: 8 }}>
            <AppText variant="calloutStrong" color={colors.primary}>
              {mode === 'login' ? t('auth.newHere') : t('auth.haveAccount')}
            </AppText>
          </Pressable>
        </View>

        <View style={[styles.info, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="shield-check" size={20} color={colors.primary} />
          <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
            {t('auth.secureNote')}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingHorizontal: 16 },
  back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  card: { gap: 14, borderRadius: radius.lg, padding: spacing.lg, marginTop: 22, borderWidth: 1, ...shadows.card },
  info: { flexDirection: 'row', gap: 10, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.xl },
});
