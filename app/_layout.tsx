import '../global.css';
import '../src/lib/i18n';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { useRouter, useSegments, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';
import { queryClient } from '@/src/lib/query-client';
import { useThemeStore } from '@/src/features/theme/use-theme';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, initialized, onboardingDone, setSession, setInitialized, setOnboardingDone } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    AsyncStorage.getItem('onboarding_complete').then(val => {
      setOnboardingDone(val === 'true');
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized || onboardingDone === null) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    if (session) {
      if (!onboardingDone) {
        // Logged in without seeing onboarding — complete silently
        AsyncStorage.setItem('onboarding_complete', 'true');
        setOnboardingDone(true);
        if (!inTabs) router.replace('/(tabs)');
      } else {
        if (inAuthGroup || inOnboarding) router.replace('/(tabs)');
      }
    } else {
      if (onboardingDone) {
        // Returning user who logged out — go straight to sign-in
        if (!inAuthGroup) router.replace('/(auth)/sign-in');
      } else {
        // New user — go through onboarding (login is the last step)
        if (!inOnboarding) router.replace('/onboarding');
      }
    }
  }, [session, initialized, segments, onboardingDone]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ CormorantGaramond_500Medium });
  const isDark = useThemeStore((s) => s.mode === 'dark');

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
        {fontsLoaded ? (
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="guest/[token]" options={{ headerShown: false }} />
            <Stack.Screen name="import" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          </Stack>
        ) : null}
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
