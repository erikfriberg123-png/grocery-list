import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // 1. Verify the caller's JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey    = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    // 2. Parse body
    const body = await req.json();
    const { listId, expiresInDays, permission = 'view' } = body ?? {};
    if (!listId) return json({ error: 'listId required' }, 400);

    // 3. Verify membership using service role (avoids RLS edge cases inside functions)
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: sl, error: slErr } = await admin
      .from('shopping_lists').select('household_id').eq('id', listId).single();
    if (slErr || !sl) return json({ error: 'List not found' }, 404);

    const { data: member } = await admin
      .from('household_members')
      .select('id')
      .eq('household_id', sl.household_id)
      .eq('user_id', user.id)
      .single();
    if (!member) return json({ error: 'Not a household member' }, 403);

    // 4. Generate 32-byte random token → base64url
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // 5. SHA-256 hash — plaintext never stored
    const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const tokenHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = expiresInDays
      ? new Date(Date.now() + Number(expiresInDays) * 86_400_000).toISOString()
      : null;

    // 6. Insert
    const { error: insertErr } = await admin.from('share_links').insert({
      list_id: listId,
      token_hash: tokenHash,
      token_salt: crypto.randomUUID(),
      permission,
      created_by: user.id,
      expires_at: expiresAt,
    });
    if (insertErr) {
      console.error('insert error:', insertErr);
      return json({ error: insertErr.message }, 500);
    }

    return json({ token });
  } catch (err) {
    console.error('unexpected error:', err);
    return json({ error: (err as Error).message }, 500);
  }
});
