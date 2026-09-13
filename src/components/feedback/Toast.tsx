import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToastStore } from '../../stores/useUiStore';
import { AppText } from '../ui/AppText';

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const { message, kind, hide } = useToastStore();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2600);
    return () => clearTimeout(t);
  }, [message, hide]);

  if (!message) return null;
  const icon = kind === 'success' ? 'check-circle' : kind === 'error' ? 'alert-circle' : 'information';

  return (
    <View style={[styles.host, { top: insets.top + 12 }]} pointerEvents="none">
      <Animated.View entering={FadeInUp.springify()} exiting={FadeOutDown} style={styles.toast}>
        <MaterialCommunityIcons name={icon} size={20} color={kind === 'error' ? '#F08070' : '#FF6A3D'} />
        <AppText variant="calloutStrong" color="#F4F2EC" style={{ flex: 1 }}>
          {message}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 20, right: 20, zIndex: 99, alignItems: 'center' },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    maxWidth: 480, width: '100%',
    backgroundColor: '#131313',
    borderWidth: 1, borderColor: 'rgba(255,77,36,0.35)',
  },
});

