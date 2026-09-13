import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppColors } from '../../theme';
import { spacing } from '../../theme/tokens';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { BottomSheet } from './BottomSheet';
import { useGateStore } from '../../stores/useUiStore';
import { useT } from '../../i18n/store';

export function AuthRequiredSheet() {
  const { colors } = useAppColors();
  const { t } = useT();
  const { authSheetVisible, authSheetReason, pendingActionLabel, closeAuthGate } = useGateStore();
  return (
    <BottomSheet visible={authSheetVisible} onClose={closeAuthGate}>
      <View style={{ alignItems: 'center', paddingTop: 4 }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="account-check" size={32} color={colors.primary} />
        </View>
        <AppText variant="h2" align="center" style={{ marginTop: 14 }}>
          {t('sheet.authTitle')}
        </AppText>
        <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 320 }}>
          {authSheetReason || t('sheet.authBody')}
        </AppText>
        {pendingActionLabel ? (
          <AppText variant="captionStrong" color={colors.primary} style={{ marginTop: 8 }}>
            {t('sheet.toContinue')}: {pendingActionLabel}
          </AppText>
        ) : null}
        <View style={{ width: '100%', gap: 10, marginTop: spacing.xl }}>
          <Button
            label={t('sheet.emailBtn')}
            icon="email"
            fullWidth
            onPress={() => {
              closeAuthGate();
              router.push('/auth/login');
            }}
          />
          <Button label={t('sheet.later')} variant="ghost" fullWidth onPress={closeAuthGate} />
        </View>
        <AppText variant="tiny" color={colors.textTertiary} align="center" style={{ marginTop: 12 }}>
          {t('sheet.freeNote')}
        </AppText>
      </View>
    </BottomSheet>
  );
}
