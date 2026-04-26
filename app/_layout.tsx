import '../global.css';
import '../src/lib/i18n';

import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { useRouter, useSegments, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';
import { queryClient } from '@/src/lib/query-client';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, initialized, setSession, setInitialized } = useAuthStore();
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

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/(auth)/sign-in');
    else if (session && inAuthGroup) router.replace('/(tabs)');
  }, [session, initialized, segments]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ CormorantGaramond_500Medium });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="guest/[token]" options={{ headerShown: false }} />
        <Stack.Screen name="import" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}
