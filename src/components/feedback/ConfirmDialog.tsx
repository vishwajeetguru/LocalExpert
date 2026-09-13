import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { radius, spacing } from '../../theme/tokens';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  destructive,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  destructive?: boolean;
}) {
  const { colors } = useAppColors();
  if (!visible) return null;
  return (
    <Modal transparent onRequestClose={onClose}>
      <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={ZoomIn.springify()} style={[styles.box, { backgroundColor: colors.surface }]}>
          <View style={[styles.icon, { backgroundColor: destructive ? colors.errorBg : colors.primarySoft }]}>
            <MaterialCommunityIcons
              name={destructive ? 'alert' : 'help-circle'}
              size={28}
              color={destructive ? colors.error : colors.primary}
            />
          </View>
          <AppText variant="h3" align="center" style={{ marginTop: 12 }}>
            {title}
          </AppText>
          <AppText variant="callout" color={colors.textSecondary} align="center" style={{ marginTop: 6 }}>
            {body}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.xl }}>
            <View style={{ flex: 1 }}>
              <Button label={cancelLabel} variant="outline" fullWidth onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={confirmLabel} fullWidth onPress={() => { onClose(); onConfirm(); }} />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, padding: spacing.xl, width: '100%' },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
