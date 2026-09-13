import { useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { radius } from '../../theme/tokens';
import { AppText } from './AppText';
import { ClayView } from './Clay';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  containerStyle?: ViewStyle;
  /** Extra style for the inner TextInput (e.g. maxHeight to bound a multiline field). Optional — nothing changes when omitted. */
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({ label, error, leftIcon, containerStyle, inputStyle, onFocus, onBlur, ...rest }: Props) {
  const { colors } = useAppColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="calloutStrong" style={{ marginBottom: 8 }}>
          {label}
        </AppText>
      ) : null}
      <ClayView radius={radius.md} inset={!(focused && !error)}>
        <View
          style={[
            styles.box,
            {
              borderColor: error ? colors.error : focused ? colors.primary : 'transparent',
              borderWidth: error || focused ? 2 : 0,
            },
          ]}
        >
          {leftIcon ? (
            <MaterialCommunityIcons name={leftIcon} size={20} color={focused ? colors.primary : colors.textSecondary} style={{ marginRight: 8 }} />
          ) : null}
          <TextInput
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }, inputStyle]}
            onFocus={(e) => {
              // Deferred one frame on purpose: a synchronous commit here
              // lands in the same frame as keyboardWillShow, and on iOS that
              // can make Reanimated drop the keyboard animation entirely —
              // the sheet/composer then never lifts and the input stays
              // buried. The 1-frame delay on the focus ring is imperceptible.
              requestAnimationFrame(() => setFocused(true));
              onFocus?.(e);
            }}
            onBlur={(e) => {
              requestAnimationFrame(() => setFocused(false));
              onBlur?.(e);
            }}
            {...rest}
          />
        </View>
      </ClayView>
      {error ? (
        <AppText variant="caption" color={colors.error} style={{ marginTop: 6 }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
});
