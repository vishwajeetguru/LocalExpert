import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { spacing } from '../../theme/tokens';
import { useT } from '../../i18n/store';
import { useLocationStore } from '../../stores/useLocationStore';
import { useToastStore } from '../../stores/useUiStore';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { BottomSheet } from './BottomSheet';

/** Permission rationale sheet — GPS is opt-in, asked only on tap, never at launch. */
export function LocationSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useAppColors();
  const { t } = useT();
  const request = useLocationStore((s) => s.request);
  const deny = useLocationStore((s) => s.deny);
  const status = useLocationStore((s) => s.status);
  const showToast = useToastStore((s) => s.show);

  const allow = async () => {
    const coords = await request();
    onClose();
    if (coords) showToast(t('loc.captured'));
    else showToast(t('loc.denied'), 'info');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ alignItems: 'center', paddingTop: 4 }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="map-marker-radius" size={32} color={colors.primary} />
        </View>
        <AppText variant="h2" align="center" style={{ marginTop: 14 }}>
          {t('loc.title')}
        </AppText>
        <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 320 }}>
          {t('loc.body')}
        </AppText>
        <View style={{ width: '100%', gap: 10, marginTop: spacing.xl }}>
          <Button label={t('loc.allow')} icon="crosshairs-gps" fullWidth loading={status === 'requesting'} onPress={allow} />
          <Button
            label={t('loc.later')}
            variant="ghost"
            fullWidth
            onPress={() => {
              deny();
              onClose();
            }}
          />
        </View>
      </View>
    </BottomSheet>
  );
}
