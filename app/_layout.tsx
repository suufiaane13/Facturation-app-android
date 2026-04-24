import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import { Asset } from 'expo-asset';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ThemeProvider as AppThemeProvider } from '@/components/ThemeProvider';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '@/db/client';
import migrations from '@/drizzle/migrations';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { success, error: migrationError } = useMigrations(db, migrations);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [shouldOnboard, setShouldOnboard] = useState(false);

  useEffect(() => {
    if (error) throw error;
    if (migrationError) throw migrationError;
  }, [error, migrationError]);

  useEffect(() => {
    async function loadImages() {
      try {
        await Asset.loadAsync([
          require('../assets/logo-light.png'),
          require('../assets/logo-dark.png'),
          require('../assets/logo-app.png')
        ]);
      } catch (e) {
        console.warn('Failed to load assets', e);
      } finally {
        setAssetsLoaded(true);
      }
    }
    loadImages();
  }, []);

  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log('Update check failed', e);
      }
    }
    if (!__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const finished = await AsyncStorage.getItem('hasFinishedOnboarding');
        setShouldOnboard(finished !== 'true');
      } catch (e) {
        console.warn(e);
      } finally {
        setOnboardingChecked(true);
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (loaded && success && assetsLoaded && onboardingChecked) {
      SplashScreen.hideAsync();
    }
  }, [loaded, success, assetsLoaded, onboardingChecked]);

  if (!loaded || !success || !assetsLoaded || !onboardingChecked) {
    return null;
  }

  return (
    <AppThemeProvider>
      <RootLayoutNav shouldOnboard={shouldOnboard} />
    </AppThemeProvider>
  );
}

function RootLayoutNav({ shouldOnboard }: { shouldOnboard: boolean }) {
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (shouldOnboard) {
      router.replace('/onboarding');
    }
  }, [shouldOnboard]);
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#1E1E1A',
      card: '#1E1E1A',
      text: '#F8FAFC',
      border: '#343A40',
      primary: '#A1262A',
    },
  };

  const CustomDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#F8FAFC',
      card: '#FFFFFF',
      text: '#1E1E1A',
      border: '#E9ECEF',
      primary: '#2F7AA9',
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider value={isDark ? CustomDarkTheme : CustomDefaultTheme}>
      <View style={{ flex: 1, backgroundColor: isDark ? '#1E1E1A' : '#F8FAFC' }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: isDark ? '#1E1E1A' : '#FFFFFF',
            },
            headerTintColor: isDark ? '#F8FAFC' : '#1E1E1A',
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen
            name="documents/new"
            options={{ title: 'Nouveau Document', presentation: 'modal' }}
          />
          <Stack.Screen
            name="documents/[id]"
            options={{ title: 'Détail Document' }}
          />
          <Stack.Screen
            name="clients/new"
            options={{ title: 'Nouveau Client', presentation: 'modal' }}
          />
          <Stack.Screen
            name="clients/[id]"
            options={{ title: 'Profil Client' }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Info' }} />
        </Stack>
      </View>
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}
