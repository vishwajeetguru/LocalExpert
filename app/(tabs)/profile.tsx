import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useToastStore } from '../../src/stores/useUiStore';
import { VendorService } from '../../src/services';
import { Vendor } from '../../src/types/models';
import { useLocale, useT } from '../../src/i18n/store';
import { LOCALES } from '../../src/i18n/locales';
import { AppText } from '../../src/components/ui/AppText';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { VerifiedBadge } from '../../src/components/ui/Pills';
import { BottomSheet } from '../../src/components/sheets/BottomSheet';
import { ConfirmDialog } from '../../src/components/feedback/ConfirmDialog';

export default function ProfileTab() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const savedLocale = useLocale((s) => s.locale) ?? 'en';
  const langLabel = LOCALES.find((l) => l.code === savedLocale)?.native ?? 'English';
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const showToast = useToastStore((s) => s.show);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState<Vendor | null>(null);

  const isVendorAccount = !!user && user.role === 'vendor';
  const loadVendor = useCallback(async () => {
    const me = useAuthStore.getState().user;
    if (!me || me.role !== 'vendor') {
      setVendor(null);
      return;
    }
    try {
      setVendor(me.vendorId ? await VendorService.getById(me.vendorId) : await VendorService.myVendor(me.id));
    } catch {
      // identity card keeps account-level info; dashboard shows errors
    }
  }, []);
  useFocusEffect(useCallback(() => { void loadVendor(); }, [loadVendor]));

  const openEdit = () => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? '');
    setCity(user.city);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (name.trim().length < 2) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim(), city: city.trim() || undefined } as never);
      setEditOpen(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('verify.wrong'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
        <View style={{ paddingHorizontal: layout.screenPad }}>
          <AppText variant="display">{t('tabs.profile')}</AppText>
          <AppText variant="callout" color={colors.textSecondary} style={{ marginTop: 4 }}>
            {t('profile.guestBody')}
          </AppText>
        </View>
        <View style={{ paddingHorizontal: layout.screenPad, marginTop: 20 }}>
          <View style={[styles.idCard, { backgroundColor: colors.card }]}>
            <Blob color={colors.primarySoft} />
            <View style={[styles.bigAvatar, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="account" size={44} color={colors.primary} />
            </View>
            <AppText variant="h2" align="center" style={{ marginTop: 12 }}>
              {t('profile.guestTitle')}
            </AppText>
            <Button label={t('profile.emailBtn')} icon="email" fullWidth onPress={() => router.push('/auth/login')} style={{ marginTop: 16 }} />
          </View>
          <View style={{ marginTop: 12, gap: 12 }}>
            {/* Vendor entry — deliberately NOT a MenuRow: a solid partner
                card so vendors instantly see a different action from the
                customer login above. Routes to vendor SIGNUP (account +
                business wizard), never the login screen. */}
            <Pressable
              onPress={() => router.push('/vendor-onboard/signup')}
              style={[styles.vendorCta, { backgroundColor: colors.primary }, shadows.glow]}
            >
              <View style={styles.vendorIc}>
                <MaterialCommunityIcons name="store-plus" size={26} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" color="#fff">
                  {t('profile.joinTitle')}
                </AppText>
                <AppText variant="callout" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
                  {t('profile.joinSub')}
                </AppText>
              </View>
              <View style={styles.vendorGo}>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primary} />
              </View>
            </Pressable>
            <MenuRow icon="translate" tint="#F3E8FF" iconColor="#7C3AED" label={t('profile.language')} sub={langLabel} onPress={() => router.push('/language')} />
          </View>
        </View>
      </View>
    );
  }

  const isVendor = user.role === 'vendor';
  const displayName = isVendor && vendor ? vendor.businessName : user.name;
  const initials = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: layout.screenPad, paddingBottom: 32 }}
      >
        <View style={styles.headRow}>
          <View>
            <AppText variant="display">{t('tabs.profile')}</AppText>
            <AppText variant="callout" color={colors.textSecondary} style={{ marginTop: 4 }}>
              {t('profile.manage')}
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/language')}
            style={[styles.gear, { backgroundColor: colors.surface, borderColor: colors.borderSoft }, shadows.card]}
          >
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Identity card */}
        <View style={[styles.idCard, { backgroundColor: colors.card }]}>
          <Blob color={colors.primarySoft} />
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <View style={[styles.bigAvatar, { backgroundColor: '#FFE3D6' }]}>
              <AppText variant="display" color={colors.primary}>
                {initials}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h2" numberOfLines={1}>
                {displayName}
              </AppText>
              <AppText variant="callout" color={colors.textSecondary} numberOfLines={1}>
                {user.email}
              </AppText>
              {isVendor && vendor ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {vendor.isVerified ? <VerifiedBadge compact /> : null}
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {vendor.categoryName} • {vendor.phone}
                  </AppText>
                </View>
              ) : (
                <View style={[styles.locPill, { backgroundColor: colors.surface2 }]}>
                  <MaterialCommunityIcons name="map-marker" size={13} color={colors.text} />
                  <AppText variant="captionStrong" numberOfLines={1}>
                    {user.city}, Maharashtra
                  </AppText>
                </View>
              )}
              <AppText variant="calloutStrong" color={colors.primary} style={{ marginTop: 6 }}>
                {isVendor ? t('profile.vendorAcc') : t('profile.customer')}
              </AppText>
            </View>
            <Pressable onPress={openEdit} style={[styles.editPill, { borderColor: colors.border }]}>
              <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.text} />
              <AppText variant="calloutStrong">{t('profile.edit')}</AppText>
            </Pressable>
          </View>
        </View>

        {/* Menu — Saved is a customer feature; vendors manage work, not bookmarks. */}
        <View style={{ marginTop: 14, gap: 12 }}>
          {isVendor ? null : (
            <MenuRow icon="bookmark" tint="#FFF1EB" iconColor={colors.primary} label={t('profile.saved')} sub={`${user.savedVendorIds.length}`} onPress={() => router.push('/saved')} />
          )}
          <MenuRow icon="clipboard-text" tint="#FFF4E5" iconColor="#D97706" label={t('profile.requests')} sub={t('profile.requestsSub')} onPress={() => router.push('/(tabs)/requests')} />
          <MenuRow icon="chat" tint="#E8F1FE" iconColor="#2563EB" label={t('profile.chats')} sub={t('profile.chatsSub')} onPress={() => router.push('/(tabs)/chats')} />
          {/* Vendor entry points live ONLY on the logged-out profile — a user
              logged in as a customer cannot join as a vendor from here. */}
          {isVendor ? (
            <MenuRow icon="view-dashboard" tint="#E9F6EE" iconColor="#16A34A" label={t('profile.dashboard')} sub={t('profile.dashSub')} onPress={() => router.push('/vendor-dashboard')} />
          ) : null}
          <MenuRow icon="translate" tint="#F3E8FF" iconColor="#7C3AED" label={t('profile.language')} sub={langLabel} onPress={() => router.push('/language')} />
          <MenuRow icon="logout" tint="#FDECEC" iconColor={colors.error} label={t('profile.logout')} sub={user.email} danger onPress={() => setConfirmLogout(true)} />
        </View>
      </ScrollView>

      {/* Edit profile sheet */}
      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)}>
        <AppText variant="h3" align="center">
          {t('profile.editTitle')}
        </AppText>
        <View style={{ gap: 12, marginTop: 16 }}>
          <Input label={t('auth.name')} value={name} onChangeText={setName} leftIcon="account" />
          <Input label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="phone" />
          <Input label={t('onboard.areaL')} value={city} onChangeText={setCity} leftIcon="map-marker" />
          <Button label={t('edit.save')} loading={saving} fullWidth onPress={saveEdit} />
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={confirmLogout}
        title={t('profile.logoutTitle')}
        body={t('profile.logoutBody')}
        confirmLabel={t('profile.logoutBtn')}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          void logout();
          showToast(t('profile.loggedOut'));
        }}
      />
    </View>
  );
}

/** Soft decorative blobs on the identity card (purely ornamental). */
function Blob({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.blobA, { backgroundColor: color }]} />
      <View style={[styles.blobB, { backgroundColor: color }]} />
    </View>
  );
}

function MenuRow({
  icon, tint, iconColor, label, sub, onPress, danger,
}: {
  icon: string; tint: string; iconColor: string; label: string; sub: string; onPress: () => void; danger?: boolean;
}) {
  const { colors } = useAppColors();
  return (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: colors.card }, shadows.card]}>
      <View style={[styles.ic, { backgroundColor: tint }]}>
        <MaterialCommunityIcons name={icon as never} size={24} color={danger ? colors.error : iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" color={danger ? colors.error : undefined}>
          {label}
        </AppText>
        <AppText variant="callout" color={colors.textSecondary} numberOfLines={1}>
          {sub}
        </AppText>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  gear: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  idCard: { borderRadius: radius.lg, padding: 20, marginTop: 16, overflow: 'hidden', ...shadows.card },
  blobA: { position: 'absolute', right: -70, top: -90, width: 220, height: 220, borderRadius: 110, opacity: 0.7 },
  blobB: { position: 'absolute', right: 30, bottom: -120, width: 190, height: 190, borderRadius: 95, opacity: 0.45 },
  bigAvatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  locPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8 },
  editPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 16, ...shadows.card },
  ic: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  vendorCta: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 18 },
  vendorIc: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  vendorGo: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
