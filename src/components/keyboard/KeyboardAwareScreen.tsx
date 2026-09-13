import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  /** Extra container styling (screen padding etc.). Applied AFTER the safe-area base. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  bottomOffset?: number;
  extraKeyboardSpace?: number;
  /** Screens with an autofocused top search field keep the keyboard while scrolling results. */
  dismissOnDrag?: boolean;
}

/**
 * GLOBAL form/scroll container — use on EVERY screen that contains a
 * TextInput (login, OTP, passwords, request forms, onboarding, edit
 * screens, search results…).
 *
 * Native keyboard tracking (react-native-keyboard-controller, already
 * mounted once at the root via <KeyboardProvider>) scrolls the focused
 * input above the keyboard on iOS and Android — no hardcoded heights,
 * no magic padding. The bottom safe-area default keeps action buttons
 * reachable above the home indicator when the keyboard is closed.
 */
export function KeyboardAwareScreen({
  children,
  contentContainerStyle,
  style,
  bottomOffset = 16,
  extraKeyboardSpace = 32,
  dismissOnDrag = true,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      extraKeyboardSpace={extraKeyboardSpace}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={dismissOnDrag ? 'on-drag' : 'none'}
      showsVerticalScrollIndicator={false}
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[{ paddingBottom: Math.max(32, insets.bottom + 24) }, contentContainerStyle]}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
