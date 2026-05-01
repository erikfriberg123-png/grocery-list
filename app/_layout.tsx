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
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';
import { queryClient } from '@/src/lib/query-client';
import { useThemeStore } from '@/src/features/theme/use-theme';

// SplashScreen is native-only; on web it throws if called
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

async function acceptPendingInvite(accessToken: string) {
  const token = await AsyncStorage.getItem('pending_invite');
  if (!token) return;
  await AsyncStorage.removeItem('pending_invite');
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const anonKey     = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  try {
    await fetch(`${supabaseUrl}/functions/v1/accept-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ token }),
    });
    queryClient.invalidateQueries({ queryKey: ['household_members'] });
  } catch (e) {
    console.warn('auto-accept invite failed:', e);
  }
}

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

  // Auto-accept a pending invite whenever a session becomes available
  useEffect(() => {
    if (session?.access_token) {
      acceptPendingInvite(session.access_token);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!initialized || onboardingDone === null) return;
    const inAuthGroup  = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs       = segments[0] === '(tabs)';
    const inInvite     = (segments[0] as string) === 'invite';

    if (session) {
      if (!onboardingDone) {
        // Show onboarding even for logged-in users (e.g. "show intro again")
        if (!inOnboarding) router.replace('/onboarding');
      } else {
        if (inAuthGroup || inOnboarding) router.replace('/(tabs)');
      }
    } else {
      // Invite links are public — show the invite page without redirecting
      if (inInvite) return;
      if (onboardingDone) {
        if (!inAuthGroup) router.replace('/(auth)/sign-in');
      } else {
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
    if (fontsLoaded && Platform.OS !== 'web') SplashScreen.hideAsync();
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="invite/[token]" options={{ headerShown: false }} />
          <Stack.Screen name="import" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
