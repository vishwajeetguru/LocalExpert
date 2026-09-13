import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import { KeyboardAwareScreen } from '../../src/components/keyboard/KeyboardAwareScreen';

/**
 * VENDOR signup — step 0 of becoming a partner.
 *
 * Login stays identical for customers and vendors, but the signup paths
 * differ: customers self-register from the login screen, while vendors
 * start here (account details) and then continue into the business
 * onboarding wizard (category → business → contact → review → success).
 *
 * Flow: signup → OTP verify (next=vendor) → set password → /vendor-onboard.
 * Already-logged-in users land straight on the wizard.
 */
export default function VendorSignup() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const showToast = useToastStore((s) => s.show);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  // Set once OUR register call starts — guards the auto-redirect below so a
  // freshly staged (unverified) account is never yanked into the wizard
  // before completing OTP + password.
  const registering = useRef(false);

  // Logged-in pros (or returning vendors) skip straight to the wizard.
  useEffect(() => {
    if (user?.emailVerified && !registering.current) {
      router.replace('/vendor-onboard');
    }
  }, [user]);

  const submit = async () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = t('auth.nameErr');
    if (!emailOk(email)) e.email = t('auth.emailErr');
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    tap('medium');
    registering.current = true;
    try {
      const res = await register(name.trim(), email.trim(), phone.trim() || undefined);
      router.replace({
        pathname: '/auth/verify',
        params: { email: email.trim().toLowerCase(), demoCode: res.demoCode ?? '', next: 'vendor' },
      } as never);
    } catch (err) {
      registering.current = false;
      showToast(err instanceof Error ? err.message : t('auth.emailErr'), 'error');
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
        contentContainerStyle={{ padding: layout.screenPad, paddingBottom: Math.max(32, insets.bottom + 24) }}
      >
        <View style={[styles.logo, { backgroundColor: colors.success }, shadows.glow]}>
          <MaterialCommunityIcons name="store-plus" size={34} color="#fff" />
        </View>
        <AppText variant="tiny" color={colors.success} align="center" style={{ marginTop: 16, letterSpacing: 2.5 }}>
          {t('vsignup.perks')}
        </AppText>
        <AppText variant="h1" align="center" style={{ marginTop: 6 }}>
          {t('vsignup.title')}
        </AppText>
        <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 6 }}>
          {t('vsignup.sub')}
        </AppText>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
          <Input label={t('auth.name')} placeholder={t('auth.namePh')} value={name} onChangeText={setName} error={errors.name} leftIcon="account" />
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
          <Input label={t('auth.phone')} placeholder="+91 …" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="phone" />
          <Button label={t('auth.createBtn')} loading={loading} fullWidth onPress={() => void submit()} />
          <Pressable onPress={() => router.push('/auth/login')} style={{ alignItems: 'center', padding: 8 }}>
            <AppText variant="calloutStrong" color={colors.primary}>
              {t('vsignup.haveAccount')}
            </AppText>
          </Pressable>
        </View>

        <View style={[styles.info, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="shield-check" size={20} color={colors.primary} />
          <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
            {t('auth.secureNote')}
          </AppText>
        </View>
      </KeyboardAwareScreen>
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
