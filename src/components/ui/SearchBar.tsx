import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { radius } from '../../theme/tokens';
import { ClayView } from './Clay';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  readonly?: boolean;
}

/** Clay search — puffy 20px shell, concave input well, candy mic button. */
export function SearchBar({ value, onChange, onFocus, onSubmit, placeholder, autoFocus, readonly }: Props) {
  const { colors } = useAppColors();
  return (
    <ClayView radius={24}>
      <View style={[styles.wrap, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="magnify" size={23} color={colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
          editable={!readonly}
          placeholder={placeholder ?? 'Try “electrician” or “cooler repair”…'}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.text }]}
        />
        {value.length > 0 && !readonly ? (
          <Pressable onPress={() => onChange('')} hitSlop={12}>
            <MaterialCommunityIcons name="close-circle" size={21} color={colors.textTertiary} />
          </Pressable>
        ) : (
          <View style={[styles.mic, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="microphone" size={19} color="#fff" />
          </View>
        )}
      </View>
    </ClayView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 62,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15.5, paddingVertical: 12, fontFamily: 'DMSans_500Medium' },
  mic: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
