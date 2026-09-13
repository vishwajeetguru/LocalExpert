import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useAppColors } from '../../theme';
import { shadows, spacing } from '../../theme/tokens';

export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <Modal transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Overlay + bottom-anchored sheet. A Modal does NOT resize for the
          keyboard on iOS, so the sheet itself must ride above it. That lift
          is a position-independent sticky translate driven by the keyboard
          height on the UI thread (smooth, incl. interactive-drag tracking):
          it needs NO position measuring, so — unlike padding-based avoiding
          views — it cannot misfire inside a Modal where layout coordinates
          don't line up with the keyboard frame. That misfire is what kept
          short sheets (write-a-review: nothing to scroll, fully dependent
          on the lift) buried while taller scrollable ones (edit profile)
          happened to survive via inner scroll alone. The inner
          KeyboardAwareScrollView remains as the second layer: it scrolls
          the focused input — incl. multiline fields — into view within the
          lifted sheet. iOS-only: on Android the window resizes
          (softwareKeyboardLayoutMode=resize) so layout already adapts and
          an extra translate would double-lift. */}
      <View style={{ flex: 1 }}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <View style={styles.anchor} pointerEvents="box-none">
          <KeyboardStickyView enabled={Platform.OS === 'ios'} style={styles.anchor} pointerEvents="box-none">
          <Animated.View
            entering={SlideInDown.springify().damping(26).stiffness(300)}
            exiting={SlideOutDown}
            style={[styles.sheet, shadows.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={[styles.grab, { backgroundColor: colors.border }]} />
            <KeyboardAwareScrollView
              bottomOffset={16}
              extraKeyboardSpace={24}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {children}
            </KeyboardAwareScrollView>
          </Animated.View>
          </KeyboardStickyView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  anchor: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '88%',
  },
  grab: { width: 48, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
});
