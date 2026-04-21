import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themePref: ThemePreference;
  setThemePref: (pref: ThemePreference) => Promise<void>;
  colorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  themePref: 'system',
  setThemePref: async () => {},
  colorScheme: 'light',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? 'light';
  const [themePref, setThemePrefState] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!AsyncStorage) throw new Error("AsyncStorage not found");
        const stored = await AsyncStorage.getItem('@theme_pref').catch(() => null);
        if (mounted && (stored === 'light' || stored === 'dark')) {
          setThemePrefState(stored as ThemePreference);
        }
      } catch (e) {
        console.log('AsyncStorage not ready, defaulting to system theme');
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setThemePref = async (pref: ThemePreference) => {
    setThemePrefState(pref);
    try {
      if (AsyncStorage) {
        await AsyncStorage.setItem('@theme_pref', pref).catch(() => {});
      }
    } catch (e) {
      console.log('Failed to save theme preference');
    }
  };

  const colorScheme = themePref === 'system' ? systemScheme : themePref;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ themePref, setThemePref, colorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => useContext(ThemeContext);
