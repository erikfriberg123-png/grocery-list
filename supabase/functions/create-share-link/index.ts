import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Unauthorized');

    // Verify caller via their JWT
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error('Unauthorized');

    const { listId, expiresInDays, permission = 'view' } = await req.json();
    if (!listId) throw new Error('listId required');

    // Confirm caller is a household member of this list
    const { data: sl } = await userClient
      .from('shopping_lists').select('household_id').eq('id', listId).single();
    if (!sl) throw new Error('List not found');

    const { data: member } = await userClient
      .from('household_members')
      .select('id').eq('household_id', sl.household_id).eq('user_id', user.id).single();
    if (!member) throw new Error('Not a household member');

    // Generate 32-byte random token → base64url
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // SHA-256 hash — the plaintext token is never stored
    const hashBuf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(token),
    );
    const tokenHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString()
      : null;

    // Insert via service role (bypasses RLS — we already verified membership above)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { error: insertErr } = await admin.from('share_links').insert({
      list_id: listId,
      token_hash: tokenHash,
      token_salt: crypto.randomUUID(), // row identifier, not used for hashing
      permission,
      created_by: user.id,
      expires_at: expiresAt,
    });
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ token }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
