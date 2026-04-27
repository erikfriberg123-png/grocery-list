import { useState } from 'react';
import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/src/lib/supabase';

export type ExpiryOption = { key: string; days: number | null };

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { key: 'share.expiry_1day',    days: 1 },
  { key: 'share.expiry_7days',   days: 7 },
  { key: 'share.expiry_30days',  days: 30 },
  { key: 'share.expiry_forever', days: null },
];

function getBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For native, use the web URL (configure via env in production)
  return 'http://localhost:8081';
}

export function useShareLink(listId: string) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);

  const createLink = async (expiresInDays: number | null) => {
    setLoading(true);
    setError(null);
    setShareUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not logged in');

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(`${supabaseUrl}/functions/v1/create-share-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ listId, expiresInDays, permission: 'view' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (data?.error) throw new Error(data.error);

      const url = `${getBaseUrl()}/guest/${data.token}`;
      setShareUrl(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setShareUrl(null); setError(null); setCopied(false); };

  return { shareUrl, loading, error, copied, createLink, copyLink, reset };
}
