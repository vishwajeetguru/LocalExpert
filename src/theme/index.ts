import { useColorScheme } from 'react-native';
import { darkColors, lightColors, AppColors } from './colors';

export function useAppColors(): { colors: AppColors; isDark: boolean } {
  const scheme = useColorScheme();
  // Light-first per spec, but architecture supports dark.
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}

export { lightColors, darkColors };
export type { AppColors };
export * from './tokens';
export * from './typography';
