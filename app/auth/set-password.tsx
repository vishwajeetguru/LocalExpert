import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { tap } from '../../src/utils/device';
import { ClayBlobs } from '../../src/components/ui/Clay';
import { KeyboardAwareScreen } from '../../src/components/keyboard/KeyboardAwareScreen';

/**
 * Two modes:
 * - setup: logged-in via OTP (post-signup), session token present → setPassword.
 * - reset: logged-out with an email; OTP code + new password together → confirm.
 */
export default function SetPassword() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { mode, email, next } = useLocalSearchParams<{ mode?: string; email?: string; next?: string }>();
  const isReset = mode === 'reset';
  const address = typeof email === 'string' ? email : '';

  const setPassword = useAuthStore((s) => s.setPassword);
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const confirmPasswordReset = useAuthStore((s) => s.confirmPasswordReset);
  const loading = useAuthStore((s) => s.loading);
  const showToast = useToastStore((s) => s.show);

  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset mode usually arrives with a code already requested; a repeat send is
  // harmless (server enforces the 60s resend wait, we swallow that error).
  useEffect(() => {
    if (isReset && address) {
      requestPasswordReset(address).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (isReset && code.replace(/\D/g, '').length !== 6) {
      setError(t('verify.wrong'));
      return;
    }
    if (pw.length < 6) {
      setError(t('auth.pwShort'));
      return;
    }
    if (pw !== pw2) {
      setError(t('auth.pwMismatch'));
      return;
    }
    tap('medium');
    setError(null);
    try {
      if (isReset) {
        await confirmPasswordReset(address, code.replace(/\D/g, ''), pw);
      } else {
        await setPassword(pw);
      }
      showToast(t('auth.pwSaved'));
      // Vendor signups continue into the business onboarding wizard.
      router.replace((next === 'vendor' ? '/vendor-onboard' : '/(tabs)') as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('verify.wrong'));
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <ClayBlobs />
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
      </View>
      <KeyboardAwareScreen
        contentContainerStyle={{ padding: layout.screenPad, paddingBottom: Math.max(32, insets.bottom + 24) }}
      >
        <View style={[styles.logo, { backgroundColor: colors.primary }, shadows.glow]}>
          <MaterialCommunityIcons name="lock-check" size={34} color="#fff" />
        </View>
        <AppText variant="h1" align="center" style={{ marginTop: 16 }}>
          {isReset ? t('auth.resetTitle') : t('auth.setPwTitle')}
        </AppText>
        <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 6 }}>
          {isReset ? t('auth.resetBody') : t('auth.setPwBody')}
        </AppText>
        {isReset && address ? (
          <AppText variant="calloutStrong" color={colors.primary} align="center" style={{ marginTop: 4 }}>
            {address}
          </AppText>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
          {isReset ? (
            <Input
              label={t('auth.codeLabel')}
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              leftIcon="email-check"
            />
          ) : null}
          <Input
            label={t('auth.newPw')}
            placeholder={t('auth.passwordPh')}
            value={pw}
            onChangeText={setPw}
            secureTextEntry={!showPw}
            autoCapitalize="none"
            leftIcon="lock"
          />
          <Input
            label={t('auth.confirmPw')}
            placeholder={t('auth.passwordPh')}
            value={pw2}
            onChangeText={setPw2}
            secureTextEntry={!showPw}
            autoCapitalize="none"
            leftIcon="lock-check"
            onSubmitEditing={() => void submit()}
          />
          <Pressable onPress={() => setShowPw((v) => !v)} style={{ alignItems: 'center', padding: 4 }}>
            <AppText variant="calloutStrong" color={colors.primary}>
              {showPw ? t('auth.hide') : t('auth.show')}
            </AppText>
          </Pressable>
          {error ? (
            <AppText variant="calloutStrong" color={colors.error} align="center">
              {error}
            </AppText>
          ) : null}
          <Button label={isReset ? t('auth.resetBtn') : t('auth.savePwBtn')} loading={loading} fullWidth onPress={() => void submit()} />
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
});
