import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';
import { useThemeColors } from '@/src/features/theme/use-theme';

export default function InvitePage() {
  const { token }  = useLocalSearchParams<{ token: string }>();
  const { t }      = useTranslation();
  const colors     = useThemeColors();
  const router     = useRouter();
  const { session } = useAuthStore();

  const [accepting, setAccepting] = useState(false);
  const [joined, setJoined]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // If a logged-in user lands here, auto-prompt them to join immediately
  useEffect(() => {
    // nothing auto — let them tap the button so it's explicit
  }, []);

  const callAcceptInvite = async (accessToken: string): Promise<void> => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const anonKey     = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(`${supabaseUrl}/functions/v1/accept-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  };

  const handleJoin = async () => {
    setAccepting(true);
    setError(null);
    try {
      const { data: { session: current } } = await supabase.auth.getSession();
      if (!current?.access_token) throw new Error('Not logged in');
      await callAcceptInvite(current.access_token);
      setJoined(true);
      setTimeout(() => router.replace('/(tabs)'), 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAccepting(false);
    }
  };

  const storeThenNavigate = async (dest: string) => {
    await AsyncStorage.setItem('pending_invite', token ?? '');
    router.push(dest as Parameters<typeof router.push>[0]);
  };

  if (joined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Ionicons name="checkmark-circle" size={72} color={colors.green} />
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, color: colors.greenDark, marginTop: 20, textAlign: 'center' }}>
          {t('invite.joined')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Image
        source={require('@/assets/images/logo-light.png')}
        style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 28 }}
      />

      <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 34, color: colors.greenDark, textAlign: 'center', marginBottom: 10 }}>
        {t('invite.title')}
      </Text>
      <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 48, lineHeight: 22 }}>
        {t('invite.subtitle')}
      </Text>

      {session ? (
        <>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.green,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              width: '100%',
              opacity: pressed || accepting ? 0.8 : 1,
            })}
            onPress={handleJoin}
            disabled={accepting}>
            {accepting
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('invite.join')}</Text>}
          </Pressable>
          {error ? (
            <Text style={{ color: colors.dangerText, fontSize: 13, textAlign: 'center', marginTop: 14 }}>{error}</Text>
          ) : null}
        </>
      ) : (
        <>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.green,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              width: '100%',
              marginBottom: 12,
              opacity: pressed ? 0.8 : 1,
            })}
            onPress={() => storeThenNavigate('/(auth)/sign-in')}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('auth.sign_in')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.creamCard,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              width: '100%',
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
            onPress={() => storeThenNavigate('/(auth)/sign-up')}>
            <Text style={{ color: colors.greenDark, fontSize: 16, fontWeight: '600' }}>{t('auth.create_account')}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
