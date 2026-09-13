import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../src/theme';
import { layout, radius, shadows } from '../src/theme/tokens';
import { LOCALES, Locale } from '../src/i18n/locales';
import { useLocale, useT } from '../src/i18n/store';
import { useToastStore } from '../src/stores/useUiStore';
import { AppText } from '../src/components/ui/AppText';
import { Button } from '../src/components/ui/Button';
import { Pop, StaggerItem } from '../src/components/motion/AnimatedIcon';
import { ClayBlobs } from '../src/components/ui/Clay';
import { tap } from '../src/utils/device';

/**
 * Language gate — shown once after splash, changeable anytime via Profile.
 * Senior-UX rules: one question per screen, 56px+ targets, selection preview
 * translates instantly so users feel the choice before committing.
 */
export default function LanguageScreen() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const saved = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);
  const showToast = useToastStore((s) => s.show);
  const { t } = useT();
  const [picked, setPicked] = useState<Locale>(saved ?? 'en');
  const [saving, setSaving] = useState(false);
  const isChangeMode = saved !== null;

  const preview: Record<Locale, { title: string; sub: string }> = {
    en: { title: 'Choose your language', sub: 'Pick the language you are most comfortable with.' },
    hi: { title: 'अपनी भाषा चुनें', sub: 'आप जिस भाषा में सहज हैं उसे चुनें।' },
    mr: { title: 'तुमची भाषा निवडा', sub: 'तुम्हाला सोपी वाटणारी भाषा निवडा.' },
  };

  const commit = async () => {
    setSaving(true);
    tap('medium');
    await setLocale(picked);
    showToast(translate_saved(picked));
    setSaving(false);
    if (isChangeMode) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <ClayBlobs />
      <View style={styles.head}>
        {isChangeMode ? (
          <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={[styles.brand, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color="#fff" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <AppText variant="tiny" color={colors.primary} style={{ letterSpacing: 2 }}>
            {t('lang.eyebrow')}
          </AppText>
        </View>
      </View>

      <View style={{ paddingHorizontal: layout.screenPad, marginTop: 8 }}>
        <AppText variant="display">{preview[picked].title}</AppText>
        <AppText variant="callout" color={colors.textSecondary} style={{ marginTop: 6 }}>
          {preview[picked].sub}
        </AppText>
        <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
          {t('lang.subtitle')}
        </AppText>
      </View>

      <View style={{ paddingHorizontal: layout.screenPad, marginTop: 24, gap: 12 }}>
        {LOCALES.map((l, i) => {
          const selected = picked === l.code;
          return (
            <StaggerItem key={l.code} index={i}>
              <Pressable
                onPress={() => {
                  tap('light');
                  setPicked(l.code);
                }}
                style={[
                  styles.opt,
                  {
                    backgroundColor: selected ? colors.primarySoft : colors.card,
                    borderColor: selected ? colors.primary : colors.borderSoft,
                  },
                  shadows.card,
                ]}
              >
                <View style={[styles.letter, { backgroundColor: selected ? colors.primary : colors.surface2 }]}>
                  <AppText variant="h2" color={selected ? '#fff' : colors.text}>
                    {l.letter}
                  </AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="h3">{l.native}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {l.latin}
                  </AppText>
                </View>
                <Pop popKey={selected}>
                  <View
                    style={[
                      styles.radio,
                      { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' },
                    ]}
                  >
                    {selected ? <MaterialCommunityIcons name="check" size={16} color="#fff" /> : null}
                  </View>
                </Pop>
              </Pressable>
            </StaggerItem>
          );
        })}
      </View>

      <View style={[styles.footer, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
        <Button label={t('lang.continue')} loading={saving} fullWidth onPress={commit} />
      </View>
    </View>
  );
}

function translate_saved(picked: Locale): string {
  if (picked === 'hi') return 'भाषा सहेजी गई';
  if (picked === 'mr') return 'भाषा जतन केली';
  return 'Language saved';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  back: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brand: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1.5, borderRadius: radius.lg, padding: 20 },
  letter: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
});
