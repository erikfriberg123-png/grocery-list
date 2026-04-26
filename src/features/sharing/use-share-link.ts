import { useState } from 'react';
import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/src/lib/supabase';

export type ExpiryOption = { label: string; days: number | null };

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1 dag',    days: 1 },
  { label: '7 dagar',  days: 7 },
  { label: '30 dagar', days: 30 },
  { label: 'Alltid',   days: null },
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
      const { data, error: fnErr } = await supabase.functions.invoke('create-share-link', {
        body: { listId, expiresInDays, permission: 'view' },
      });
      if (fnErr) throw fnErr;
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
