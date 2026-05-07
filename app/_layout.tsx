import '../global.css';
import '../src/lib/i18n';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password' as never);
      }
    });

    AsyncStorage.getItem('onboarding_complete').then(val => {
      setOnboardingDone(val === 'true');
    });

    // Exchange the PKCE code (or parse hash tokens) from password-reset deep links
    async function handleDeepLink(url: string) {
      if (!url.includes('reset-password')) return;
      await supabase.auth.exchangeCodeForSession(url).catch(() => {});
    }
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
    const { remove } = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    return () => {
      subscription.unsubscribe();
      remove();
    };
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
    const inReset      = (segments[0] as string) === 'reset-password';

    if (session) {
      if (inReset) return; // let the reset-password screen handle this
      if (!onboardingDone) {
        // Show onboarding even for logged-in users (e.g. "show intro again")
        if (!inOnboarding) router.replace('/onboarding');
      } else {
        if (inAuthGroup || inOnboarding) router.replace('/(tabs)');
      }
    } else {
      // Invite and reset links are public — show the page without redirecting
      if (inInvite || inReset) return;
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
          <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
