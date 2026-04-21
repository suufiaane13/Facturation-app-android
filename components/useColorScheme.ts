import { useThemeContext } from './ThemeProvider';

export function useColorScheme() {
  const { colorScheme } = useThemeContext();
  return colorScheme;
}
