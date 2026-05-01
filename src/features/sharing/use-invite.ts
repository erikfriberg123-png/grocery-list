import { useEffect, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { supabase } from '@/src/lib/supabase';

export function useCreateInvite() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState<string | null>(null);
  const [copied, setCopied]      = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);

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

      setInviteUrl(Linking.createURL(`/invite/${data.token}`));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    try {
      await Clipboard.setStringAsync(inviteUrl);
      setCopied(true);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const reset = () => { setInviteUrl(null); setError(null); setCopied(false); };

  return { inviteUrl, loading, error, copied, createInvite, copyLink, reset };
}
