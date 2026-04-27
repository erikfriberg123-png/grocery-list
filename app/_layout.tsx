import '../global.css';
import '../src/lib/i18n';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { useRouter, useSegments, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';
import { queryClient } from '@/src/lib/query-client';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, initialized, setSession, setInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

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

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && !onboardingDone && !inOnboarding) {
      router.replace('/onboarding');
    } else if (session && onboardingDone && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments, onboardingDone]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ CormorantGaramond_500Medium });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="guest/[token]" options={{ headerShown: false }} />
          <Stack.Screen name="import" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
        <StatusBar style="dark" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
