import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, spacing } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useToastStore } from '../../src/stores/useUiStore';
import { VendorService } from '../../src/services';
import { Vendor } from '../../src/types/models';
import { useT } from '../../src/i18n/store';
import { AppText } from '../../src/components/ui/AppText';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { LocationPicker } from '../../src/components/vendor/LocationPicker';

export default function EditService() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const { t } = useT();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [desc, setDesc] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [homeVisit, setHomeVisit] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const v = user.vendorId ? await VendorService.getById(user.vendorId) : await VendorService.myVendor(user.id);
      if (v) {
        setVendor(v);
        setDesc(v.description);
        setPhone(v.phone);
        setAddress(v.location.address);
        setHomeVisit(v.homeVisitAvailable);
        setGeo(v.location.geo ?? null);
      }
      } catch {
        router.back();
      }
    })();
  }, [user]);

  const pickPhotos = async () => {
    if (!vendor || photos.length >= 5) {
      showToast(t('photos.limit'), 'info');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast(t('photos.limit'), 'info');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.7,
    });
    if (res.canceled) return;
    setUploading(true);
    try {
      let current = photos;
      for (const a of res.assets.slice(0, 5 - photos.length)) {
        const name = a.fileName ?? `photo-${Date.now()}.jpg`;
        const updated = await VendorService.addPhoto(vendor.id, { uri: a.uri, name, type: a.mimeType ?? 'image/jpeg' });
        current = updated.photos;
        setPhotos(current);
      }
      showToast(t('photos.uploaded'));
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('verify.wrong'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const dropPhoto = async (url: string) => {
    if (!vendor) return;
    try {
      const updated = await VendorService.removePhoto(vendor.id, url);
      setPhotos(updated.photos);
      showToast(t('photos.removed'));
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('verify.wrong'), 'error');
    }
  };

  const save = async () => {
    if (!vendor) return;
    setSaving(true);
    try {
      await VendorService.updateVendor(vendor.id, {
        description: desc,
        phone,
        homeVisitAvailable: homeVisit,
        location: { ...vendor.location, address, geo: geo ?? undefined },
      });
      setSaving(false);
      showToast(t('edit.saved'));
      router.back();
    } catch (e) {
      setSaving(false);
      showToast(e instanceof Error ? e.message : t('edit.saved'), 'error');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="close" size={22} color={colors.text} />
        </Pressable>
        <AppText variant="h2">{t('edit.title')}</AppText>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: layout.screenPad, gap: 12 }}>
        <View style={[styles.info, { backgroundColor: colors.primarySoft }]}>
          <AppText variant="caption" color={colors.textSecondary}>
            {t('edit.note')}
          </AppText>
        </View>
        <Input label={t('onboard.about')} value={desc} onChangeText={setDesc} multiline numberOfLines={4} />
        <Input label={t('onboard.rPhone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="phone" />
        <Input label={t('onboard.rAddr')} value={address} onChangeText={setAddress} leftIcon="map-marker" />
        <LocationPicker value={geo} onChange={setGeo} />
        <View style={[styles.row, { backgroundColor: colors.card }]}>
          <AppText variant="bodyStrong" style={{ flex: 1 }}>
            {t('onboard.homeT')}
          </AppText>
          <Switch value={homeVisit} onValueChange={setHomeVisit} />
        </View>
        <View>
          <AppText variant="calloutStrong" style={{ marginBottom: 8 }}>
            {t('photos.title')} ({photos.length}/5)
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {photos.map((p) => (
              <View key={p} style={styles.thumbWrap}>
                <Image source={{ uri: p }} style={styles.thumb} contentFit="cover" transition={200} />
                <Pressable onPress={() => void dropPhoto(p)} hitSlop={8} style={[styles.thumbX, { backgroundColor: colors.error }]}>
                  <MaterialCommunityIcons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            {photos.length < 5 ? (
              <Pressable
                onPress={() => void pickPhotos()}
                style={[styles.addTile, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="camera-plus" size={26} color={colors.primary} />
                    <AppText variant="captionStrong" color={colors.primary} style={{ marginTop: 4 }}>
                      {t('photos.add')}
                    </AppText>
                  </>
                )}
              </Pressable>
            ) : null}
          </View>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 6 }}>
            {t('photos.limit')}
          </AppText>
        </View>
        <Button label={t('edit.save')} loading={saving} fullWidth onPress={save} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info: { borderRadius: radius.md, padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.lg },
  thumbWrap: { position: 'relative' },
  thumb: { width: 104, height: 104, borderRadius: 16 },
  thumbX: { position: 'absolute', top: -8, right: -8, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  addTile: { width: 104, height: 104, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
