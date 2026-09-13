import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useAppColors } from '../../theme';
import { shadows, spacing } from '../../theme/tokens';

/**
 * SCOPED sheet — "Rate your experience / Write a review" flow ONLY.
 * Do not reuse for other sheets; do not merge back into BottomSheet.
 *
 * Why a dedicated sheet: the review content is SHORT (title + stars +
 * one input + button, everything fits the viewport, nothing to scroll).
 * A keyboard-aware inner scroll view therefore cannot help here — worse,
 * it adds keyboard bottom-padding INSIDE the sheet while the sheet itself
 * is also lifted, and that double compensation pushed content off-screen
 * (blank gap above the keyboard, disappearing content). This sheet lifts
 * exactly ONCE: a position-independent sticky translate driven by the
 * real keyboard height on the UI thread (smooth, incl. interactive-drag
 * tracking, auto-restores to 0 on close — no blank space left behind).
 * Deliberately NO KeyboardAvoidingView / KeyboardAwareScrollView inside.
 *
 * Long reviews: the review field is height-capped (see usage) so it
 * scrolls INTERNALLY with native cursor-following; the sheet total stays
 * bounded and the input + submit button always fit above the keyboard.
 * iOS-only lift: on Android the window resizes
 * (softwareKeyboardLayoutMode=resize) so layout already adapts.
 */
export function ReviewSheet({
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
              {children}
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
