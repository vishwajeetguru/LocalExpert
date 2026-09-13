import { Component, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import * as SplashScreen from 'expo-splash-screen';
import {
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts as useNunito,
} from '@expo-google-fonts/nunito';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts as useDmSans,
} from '@expo-google-fonts/dm-sans';
import { useAppColors } from '../src/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useAppStore } from '../src/stores/useAppStore';
import { useLocale } from '../src/i18n/store';
import { useLiveSync } from '../src/hooks/useLiveSync';
import { usePush } from '../src/hooks/usePush';
import { useSyncStore } from '../src/stores/useSyncStore';
import { MaintenanceScreen } from '../src/components/MaintenanceScreen';
import { AuthRequiredSheet } from '../src/components/sheets/AuthRequiredSheet';
import { ToastHost } from '../src/components/feedback/Toast';

void SplashScreen.preventAutoHideAsync();

/**
 * Last-resort safety net: a crash above Expo Router's route boundaries used
 * to present as a permanent white screen. This renders the actual error
 * (dev) with a restart path instead of silence.
 */
class RootErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.error('[root-boundary]', error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAF8', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#131313', textAlign: 'center' }}>Something went wrong</Text>
        <Text style={{ fontSize: 14, color: '#5F6368', textAlign: 'center', marginTop: 8 }}>
          {__DEV__ ? String(error.message || error) : 'Please restart the app.'}
        </Text>
        <Pressable
          onPress={() => this.setState({ error: null })}
          style={{ marginTop: 20, backgroundColor: '#FF4D24', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

export default function RootLayout() {
  const { colors, isDark } = useAppColors();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const loadHome = useAppStore((s) => s.loadHome);
  const hydrateLocale = useLocale((s) => s.hydrate);
  const maintenance = useSyncStore((s) => s.maintenance);
  const [nunitoLoaded] = useNunito({ Nunito_800ExtraBold, Nunito_900Black });
  const [dmLoaded] = useDmSans({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  // Fonts load in the background and swap in when ready — boot never waits
  // on them (a stuck font fetch used to trap the app on a white screen).
  // Unloaded families fall back to the system font silently.
  void nunitoLoaded;
  void dmLoaded;
  useLiveSync();
  usePush();

  useEffect(() => {
    // Boot can never hang on the network: local state first, then at most
    // 5s of network fetch — screens own their loading/error/retry states
    // and keep resolving in the background after the splash lifts.
    const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    (async () => {
      try {
        if (__DEV__) console.log('[boot] hydrate start');
        await hydrate();
        await hydrateLocale();
        if (__DEV__) console.log('[boot] hydrate done, loading home');
        await Promise.race([loadHome(), timeout(5000)]);
        if (__DEV__) console.log('[boot] home settled');
      } catch (e) {
        if (__DEV__) console.log('[boot] failed (non-fatal):', e instanceof Error ? e.message : e);
      } finally {
        await SplashScreen.hideAsync();
        if (__DEV__) console.log('[boot] splash hidden');
      }
    })();
  }, [hydrate, hydrateLocale, loadHome]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardProvider>
      <SafeAreaProvider>
        <RootErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {maintenance.enabled ? (
          <MaintenanceScreen message={maintenance.message} />
        ) : (
          <>
            <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="language" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="vendor/[id]" />
          <Stack.Screen name="vendor/[id]/request" options={{ presentation: 'modal' }} />
          <Stack.Screen name="request/[id]" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/verify" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/set-password" options={{ presentation: 'modal' }} />
          <Stack.Screen name="saved" />
          <Stack.Screen name="vendor-onboard/index" />
          <Stack.Screen name="vendor-onboard/signup" />
          <Stack.Screen name="vendor-onboard/success" options={{ gestureEnabled: false }} />
          <Stack.Screen name="vendor-dashboard/index" />
          <Stack.Screen name="vendor-dashboard/edit" options={{ presentation: 'modal' }} />
        </Stack>
        <AuthRequiredSheet />
        <ToastHost />
          </>
        )}
        </RootErrorBoundary>
      </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
