import { useState } from 'react';
import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { supabase } from '@/src/lib/supabase';

function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_APP_URL) return process.env.EXPO_PUBLIC_APP_URL;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri}`;
  return 'http://localhost:8081';
}

export function useCreateInvite() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState<string | null>(null);
  const [copied, setCopied]      = useState(false);

  const createInvite = async () => {
    setLoading(true);
    setError(null);
    setInviteUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not logged in');

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const anonKey     = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(`${supabaseUrl}/functions/v1/create-invite-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ expiresInDays: 7 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      setInviteUrl(`${getBaseUrl()}/invite/${data.token}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await Clipboard.setStringAsync(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setInviteUrl(null); setError(null); setCopied(false); };

  return { inviteUrl, loading, error, copied, createInvite, copyLink, reset };
}
