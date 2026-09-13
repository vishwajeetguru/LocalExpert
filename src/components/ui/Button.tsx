import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../../theme';
import { radius, shadows } from '../../theme/tokens';
import { AppText } from './AppText';
import { ClayPressable } from './Clay';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

/**
 * Clay button — puffy 20px radius, ember gradient primary, squish-to-0.92
 * spring press + haptic. Secondary/outline ride the clay canvas.
 */
export function Button({ label, onPress, variant = 'primary', size = 'md', icon, loading, disabled, fullWidth, style }: Props) {
  const { colors, isDark } = useAppColors();

  const heights: Record<Size, number> = { sm: 48, md: 56, lg: 60 };
  const fg =
    variant === 'primary' || variant === 'dark' || variant === 'gold'
      ? '#fff'
      : variant === 'secondary'
        ? colors.primary
        : colors.primary;

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <MaterialCommunityIcons name={icon} size={21} color={fg} style={{ marginRight: 8 }} /> : null}
          <AppText variant="button" color={fg}>
            {label}
          </AppText>
        </>
      )}
    </>
  );

  const body = (
    <View style={[styles.base, { minHeight: heights[size] }, fullWidth && { alignSelf: 'stretch' }, style]}>
      {inner}
    </View>
  );

  if (variant === 'primary') {
    return (
      <ClayPressable onPress={onPress} disabled={disabled || loading} radius={radius.md} bg={isDark ? colors.primary : undefined}>
        <LinearGradient
          colors={isDark ? [colors.primary, colors.primary] : ['#FF6A3D', '#E63E12']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.base, { minHeight: heights[size] }, fullWidth && { alignSelf: 'stretch' }, style, shadows.glow]}
        >
          {inner}
        </LinearGradient>
      </ClayPressable>
    );
  }

  if (variant === 'gold') {
    return (
      <ClayPressable onPress={onPress} disabled={disabled || loading} radius={radius.md}>
        <LinearGradient
          colors={['#E8A04C', '#C77F2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.base, { minHeight: heights[size] }, fullWidth && { alignSelf: 'stretch' }, style]}
        >
          {inner}
        </LinearGradient>
      </ClayPressable>
    );
  }

  if (variant === 'dark') {
    return (
      <ClayPressable onPress={onPress} disabled={disabled || loading} radius={radius.md} bg="#332F3A">
        {body}
      </ClayPressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <ClayPressable onPress={onPress} disabled={disabled || loading} radius={radius.md} bg={colors.primarySoft}>
        {body}
      </ClayPressable>
    );
  }

  if (variant === 'outline') {
    return (
      <ClayPressable onPress={onPress} disabled={disabled || loading} radius={radius.md}>
        <View style={[styles.base, { minHeight: heights[size], borderWidth: 2, borderColor: colors.primaryBorder }, fullWidth && { alignSelf: 'stretch' }, style]}>
          {inner}
        </View>
      </ClayPressable>
    );
  }

  // ghost
  return (
    <ClayPressable onPress={onPress} disabled={disabled || loading} radius={radius.md} bg="transparent" plain>
      {body}
    </ClayPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
});
