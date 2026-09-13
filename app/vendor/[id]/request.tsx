import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../../src/theme';
import { layout, radius, shadows, spacing } from '../../../src/theme/tokens';
import { RequestService, VendorService } from '../../../src/services';
import { Vendor } from '../../../src/types/models';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useToastStore } from '../../../src/stores/useUiStore';
import { useT } from '../../../src/i18n/store';
import { AppText } from '../../../src/components/ui/AppText';
import { Avatar } from '../../../src/components/ui/bits';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Chip } from '../../../src/components/ui/Pills';
import { phoneOk } from '../../../src/utils/format';

const TIMES = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM', '07:30 PM'];

export default function NewRequest() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t, catName } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [summary, setSummary] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('2026-09-12');
  const [time, setTime] = useState(TIMES[4]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        setVendor(await VendorService.getById(String(id)));
      } catch {
        router.back();
      }
    })();
  }, [id]);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (summary.trim().length < 4) e.summary = t('newReq.eNeed');
    if (desc.trim().length < 10) e.desc = t('newReq.eDesc');
    if (!address.trim()) e.address = t('newReq.eAddr');
    if (!phoneOk(phone)) e.phone = t('newReq.ePhone');
    setErrors(e);
    if (Object.keys(e).length > 0 || !vendor || !user) return;
    setSending(true);
    try {
      const req = await RequestService.create({
        vendorId: vendor.id,
        vendorName: vendor.businessName,
        vendorAvatar: undefined,
        categoryName: vendor.categoryName,
        customerId: user.id,
        customerName: user.name,
        serviceSummary: summary.trim(),
        description: desc.trim(),
        preferredDate: date,
        preferredTime: time,
        address: address.trim(),
        phone: phone.trim(),
      });
      showToast(t('newReq.sent'));
      router.replace(`/request/${req.id}`);
    } catch {
      showToast(t('newReq.eNeed'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="close" size={22} color={colors.text} />
        </Pressable>
        <AppText variant="h2">{t('newReq.title')}</AppText>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: layout.screenPad, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {vendor ? (
          <View style={[styles.vrow, { backgroundColor: colors.card }]}>
            <Avatar name={vendor.businessName} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{vendor.businessName}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {catName(vendor.categorySlug || vendor.categoryId, vendor.categoryName)} • {vendor.phone}
              </AppText>
            </View>
          </View>
        ) : null}

        <View style={{ gap: 12, marginTop: 14 }}>
          <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
            <Input label={t('newReq.need')} placeholder={t('newReq.needPh')} value={summary} onChangeText={setSummary} error={errors.summary} />
            <Input label={t('newReq.desc')} placeholder={t('newReq.descPh')} value={desc} onChangeText={setDesc} multiline numberOfLines={4} error={errors.desc} />
          </View>
          <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
            <AppText variant="calloutStrong" style={{ marginBottom: 10 }}>
              {t('newReq.time')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {TIMES.map((tm) => (
                <Chip key={tm} label={tm} selected={time === tm} onPress={() => setTime(tm)} />
              ))}
            </View>
            <Input label={t('newReq.date')} value={date} onChangeText={setDate} containerStyle={{ marginTop: 12 }} />
          </View>
          <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
            <Input label={t('newReq.addr')} placeholder={t('newReq.addrPh')} value={address} onChangeText={setAddress} error={errors.address} leftIcon="map-marker" />
            <Input label={t('newReq.phone')} placeholder="+91 …" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} leftIcon="phone" />
          </View>
          <Button label={t('newReq.send')} loading={sending} fullWidth onPress={submit} />
          <AppText variant="caption" color={colors.textSecondary} align="center">
            {t('newReq.note')}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  vrow: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: radius.lg, padding: spacing.lg },
  group: { gap: 14, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, ...shadows.card },
});
