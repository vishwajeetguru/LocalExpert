import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, spacing } from '../../src/theme/tokens';
import { useAppStore } from '../../src/stores/useAppStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useToastStore } from '../../src/stores/useUiStore';
import { useOnboardStore } from '../../src/stores/useOnboardStore';
import { useT } from '../../src/i18n/store';
import { VendorService, AuthService } from '../../src/services';
import { AppText } from '../../src/components/ui/AppText';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Input } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Pills';
import { LocationPicker } from '../../src/components/vendor/LocationPicker';
import { phoneOk } from '../../src/utils/format';
import { KeyboardAwareScreen } from '../../src/components/keyboard/KeyboardAwareScreen';
import { groupsOf, childrenOf } from '../../src/utils/taxonomy';

const SERVICE_PRESETS: Record<string, string[]> = {
  electrician: ['House wiring', 'Switch & socket repair', 'Fan installation', 'Inverter connection'],
  plumber: ['Tap repair', 'Leakage fixing', 'Bathroom fittings', 'Tank cleaning'],
  'cooler-repair': ['Pump replacement', 'Pad change', 'Motor winding', 'Summer servicing'],
  default: ['General service', 'Repair', 'Installation', 'Home visit'],
};

export default function VendorOnboard() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { categories, loadHome } = useAppStore();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const draft = useOnboardStore();
  const { t, catName } = useT();
  const [step, setStep] = useState(0);
  const [customService, setCustomService] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill the business phone from the vendor's account (captured at
  // signup) so step 3 starts filled — still editable before submit.
  useEffect(() => {
    if (user?.phone && !useOnboardStore.getState().phone) {
      useOnboardStore.getState().set({ phone: user.phone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cat = categories.find((c) => c.id === draft.categoryId);
  const serviceGroups = groupsOf(categories, 'services');
  const [groupId, setGroupId] = useState<string>(cat?.parentId ?? serviceGroups[0]?.id ?? '');
  const leaves = childrenOf(categories, groupId);
  const presets = useMemo(() => {
    if (!cat) return SERVICE_PRESETS.default;
    return SERVICE_PRESETS[cat.slug] ?? SERVICE_PRESETS.default;
  }, [cat]);

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top + 40 }]}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="store-plus" size={36} color="#fff" />
        </View>
        <AppText variant="h1" align="center" style={{ marginTop: 14 }}>
          {t('onboard.needLoginTitle')}
        </AppText>
        <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 320 }}>
          {t('onboard.needLoginBody')}
        </AppText>
        <Button label={t('onboard.createAccount')} fullWidth onPress={() => router.replace('/vendor-onboard/signup')} style={{ marginTop: 20 }} />
        <Button label={t('onboard.haveAccount')} variant="ghost" fullWidth onPress={() => router.push('/auth/login')} style={{ marginTop: 8 }} />
        <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }} />
      </View>
    );
  }

  const next = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !draft.categoryId) {
      showToast(t('onboard.chooseCat'), 'info');
      return;
    }
    if (step === 1) {
      if (draft.businessName.trim().length < 3) e.businessName = t('onboard.eBiz');
      if (draft.description.trim().length < 20) e.description = t('onboard.eAbout');
      if (draft.servicesOffered.length === 0) e.services = t('onboard.eServices');
    }
    if (step === 2) {
      if (!phoneOk(draft.phone)) e.phone = t('onboard.ePhone');
      if (!draft.address.trim()) e.address = t('onboard.eAddr');
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (step < 3) setStep(step + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const vendor = await VendorService.createDraft({
        categoryId: draft.categoryId,
        businessName: draft.businessName.trim(),
        description: draft.description.trim(),
        servicesOffered: draft.servicesOffered,
        phone: draft.phone.trim(),
        email: draft.email.trim() || user.email,
        address: draft.address.trim(),
        area: draft.area.trim(),
        city: 'Shegaon',
        homeVisitAvailable: draft.homeVisitAvailable,
        photos: [],
        lat: draft.lat,
        lng: draft.lng,
        ownerId: user.id,
        ownerName: user.name,
      });
      // Refresh the user from the server — WordPress promotes the role on submit.
      const fresh = await AuthService.currentUser();
      if (fresh) useAuthStore.setState({ user: fresh });
      draft.reset();
      router.replace({ pathname: '/vendor-onboard/success', params: { id: vendor.id } } as never);
    } catch {
      showToast('Could not submit. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Pressable onPress={() => (step === 0 ? router.back() : setStep(step - 1))} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{t('onboard.title')}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {t('onboard.free').replace('{{n}}', String(step + 1))}
          </AppText>
        </View>
      </View>
      <View style={styles.progress}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
        ))}
      </View>

      {/* Action button lives INSIDE the scroll content (not an absolute
          footer) so the keyboard can never cover Save/Next: the focused input
          scrolls above the keyboard and the button stays reachable below it. */}
      <KeyboardAwareScreen
        contentContainerStyle={{ padding: layout.screenPad, paddingBottom: Math.max(32, insets.bottom + 24) }}
      >
        {step === 0 ? (
          serviceGroups.length === 0 ? (
            <EmptyState
              icon="cloud-off"
              title={t('common.offline')}
              body=""
              actionLabel={t('common.retry')}
              onAction={() => void loadHome()}
            />
          ) : (
          <>
            <AppText variant="h3">{t('onboard.sGroup')}</AppText>
            <AppText variant="callout" color={colors.textSecondary} style={{ marginBottom: 12 }}>
              {t('onboard.s1Sub')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {serviceGroups.map((g) => (
                <Chip key={g.id} label={catName(g.slug || g.id, g.name)} icon={g.icon} selected={groupId === g.id} onPress={() => { setGroupId(g.id); draft.set({ categoryId: '' }); }} />
              ))}
            </View>
            {leaves.length > 0 ? (
              <>
                <AppText variant="h3" style={{ marginTop: 20 }}>{t('onboard.sLeaf')}</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {leaves.map((c) => (
                    <Chip key={c.id} label={catName(c.slug || c.id, c.name)} selected={draft.categoryId === c.id} onPress={() => draft.set({ categoryId: c.id })} />
                  ))}
                </View>
              </>
            ) : null}
          </>
          )
        ) : null}

        {step === 1 ? (
          <View style={{ gap: 12 }}>
            <AppText variant="h3">{t('onboard.s2')}</AppText>
            <Input label={t('onboard.bizName')} placeholder="e.g. Sharma Electricals" value={draft.businessName} onChangeText={(v) => draft.set({ businessName: v })} error={errors.businessName} />
            <Input label={t('onboard.about')} placeholder={t('onboard.aboutPh')} value={draft.description} onChangeText={(v) => draft.set({ description: v })} multiline numberOfLines={4} error={errors.description} />
            <AppText variant="calloutStrong">{t('onboard.servicesL')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {presets.map((p) => (
                <Chip key={p} label={p} selected={draft.servicesOffered.includes(p)} onPress={() => draft.toggleService(p)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input placeholder={t('onboard.customPh')} value={customService} onChangeText={setCustomService} />
              </View>
              <Pressable
                onPress={() => {
                  if (customService.trim()) {
                    draft.toggleService(customService.trim());
                    setCustomService('');
                  }
                }}
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialCommunityIcons name="plus" size={22} color="#fff" />
              </Pressable>
            </View>
            {errors.services ? (
              <AppText variant="caption" color={colors.error}>
                {errors.services}
              </AppText>
            ) : null}
            {draft.servicesOffered.length > 0 ? (
              <AppText variant="caption" color={colors.textSecondary}>
                Selected: {draft.servicesOffered.join(', ')}
              </AppText>
            ) : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: 12 }}>
            <AppText variant="h3">{t('onboard.s3')}</AppText>
            <Input label={t('onboard.phoneL')} placeholder="+91 …" value={draft.phone} onChangeText={(v) => draft.set({ phone: v })} keyboardType="phone-pad" error={errors.phone} leftIcon="phone" />
            <Input label={t('onboard.emailL')} placeholder="shop@example.com" value={draft.email} onChangeText={(v) => draft.set({ email: v })} keyboardType="email-address" autoCapitalize="none" leftIcon="email" />
            <Input label={t('onboard.addrL')} placeholder="Shop no, road, landmark" value={draft.address} onChangeText={(v) => draft.set({ address: v })} error={errors.address} leftIcon="map-marker" />
            <Input label={t('onboard.areaL')} placeholder={t('onboard.areaPh')} value={draft.area} onChangeText={(v) => draft.set({ area: v })} />
            <LocationPicker
              value={draft.lat != null && draft.lng != null ? { lat: draft.lat, lng: draft.lng } : null}
              onChange={(v) => draft.set({ lat: v?.lat ?? null, lng: v?.lng ?? null })}
            />
            <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{t('onboard.homeT')}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {t('onboard.homeS')}
                </AppText>
              </View>
              <Switch value={draft.homeVisitAvailable} onValueChange={(v) => draft.set({ homeVisitAvailable: v })} />
            </View>
            <View style={[styles.info, { backgroundColor: colors.primarySoft }]}>
              <AppText variant="caption" color={colors.textSecondary}>
                {t('onboard.photosNote')}
              </AppText>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={{ gap: 12 }}>
            <AppText variant="h3">{t('onboard.review')}</AppText>
            <View style={[styles.review, { backgroundColor: colors.card }]}>
              <ReviewRow label={t('onboard.rCat')} value={cat ? catName(cat.slug || cat.id, cat.name) : '—'} />
              <ReviewRow label={t('onboard.rBiz')} value={draft.businessName} />
              <ReviewRow label={t('onboard.rServices')} value={draft.servicesOffered.join(', ')} />
              <ReviewRow label={t('onboard.rPhone')} value={draft.phone} />
              <ReviewRow label={t('onboard.rAddr')} value={`${draft.address}${draft.area ? `, ${draft.area}` : ''}, Shegaon`} />
              <ReviewRow label={t('onboard.rHome')} value={draft.homeVisitAvailable ? t('onboard.yes') : t('onboard.no')} />
            </View>
            <View style={[styles.info, { backgroundColor: colors.warningBg }]}>
              <MaterialCommunityIcons name="shield-check" size={20} color={colors.warning} />
              <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                {t('onboard.agree')}
              </AppText>
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 20 }}>
          {step < 3 ? (
            <Button label={step === 0 ? t('common.continue') : t('onboard.next')} fullWidth onPress={next} />
          ) : (
            <Button label={t('onboard.submit')} loading={submitting} fullWidth onPress={submit} />
          )}
        </View>
      </KeyboardAwareScreen>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppColors();
  return (
    <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}>
      <AppText variant="tiny" color={colors.textSecondary}>
        {label.toUpperCase()}
      </AppText>
      <AppText variant="bodyStrong" style={{ marginTop: 2 }}>
        {value || '—'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  bar: { flex: 1, height: 8, borderRadius: 4 },
  addBtn: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.lg },
  info: { flexDirection: 'row', gap: 10, borderRadius: radius.md, padding: spacing.lg },
  review: { borderRadius: radius.lg, padding: spacing.lg },
});
