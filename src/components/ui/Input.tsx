import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
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
}

export function Input({ label, error, leftIcon, containerStyle, onFocus, onBlur, ...rest }: Props) {
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
            style={[styles.input, { color: colors.text }]}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
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
