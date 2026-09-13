import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../theme';
import { spacing } from '../theme/tokens';
import { useT } from '../i18n/store';
import { AppText } from './ui/AppText';
import { Button } from './ui/Button';
import { Float } from './motion/AnimatedIcon';
import { refreshSyncNow } from '../hooks/useLiveSync';

/** Shown instead of the whole app while the server reports maintenance mode. */
export function MaintenanceScreen({ message }: { message: string }) {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const [checking, setChecking] = useState(false);

  const retry = async () => {
    setChecking(true);
    await refreshSyncNow();
    setChecking(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 40 }]}>
      <Float dy={6}>
        <View style={[styles.badge, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
          <MaterialCommunityIcons name="wrench-clock" size={40} color={colors.warning} />
        </View>
      </Float>
      <AppText variant="h1" align="center" style={{ marginTop: 20 }}>
        {t('maint.title')}
      </AppText>
      <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 10, maxWidth: 320 }}>
        {message}
      </AppText>
      <Button label={t('maint.retry')} loading={checking} onPress={retry} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', padding: spacing.xxl },
  badge: { width: 96, height: 96, borderRadius: 30, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
