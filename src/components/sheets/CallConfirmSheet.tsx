import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { spacing } from '../../theme/tokens';
import { Vendor } from '../../types/models';
import { callPhoneNumber } from '../../utils/device';
import { AppText } from '../ui/AppText';
import { Avatar } from '../ui/bits';
import { Button } from '../ui/Button';
import { BottomSheet } from './BottomSheet';
import { useT } from '../../i18n/store';

export function CallConfirmSheet({ vendor, visible, onClose }: { vendor: Vendor | null; visible: boolean; onClose: () => void }) {
  const { colors } = useAppColors();
  const { t, catName } = useT();
  if (!vendor) return null;
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ alignItems: 'center' }}>
        <Avatar name={vendor.businessName} size={64} />
        <AppText variant="h3" align="center" style={{ marginTop: 12 }}>
          {t('sheet.callTitle')} {vendor.businessName}?
        </AppText>
        <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 6 }}>
          {vendor.phone} • {catName(vendor.categorySlug || vendor.categoryId, vendor.categoryName)}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: colors.surface2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
          <MaterialCommunityIcons name="clock" size={15} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary}>
            {t('sheet.callNote')}
          </AppText>
        </View>
        <View style={{ width: '100%', gap: 10, marginTop: spacing.xl, flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Button label={t('common.cancel')} variant="outline" fullWidth onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('sheet.callNow')}
              icon="phone"
              fullWidth
              onPress={() => {
                onClose();
                void callPhoneNumber(vendor.phone);
              }}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}
