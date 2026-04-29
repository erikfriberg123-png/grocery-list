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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey    = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authErr } = await userClient.auth.getUser(jwt);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    // Get the caller's household (earliest membership if somehow in multiple)
    const { data: member, error: memberErr } = await admin
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    if (memberErr || !member) return json({ error: 'No household found' }, 404);

    const body = await req.json().catch(() => ({}));
    const { expiresInDays } = body ?? {};

    // Generate 32-byte random token → base64url
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // SHA-256 hash — plaintext never stored
    const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const tokenHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = expiresInDays
      ? new Date(Date.now() + Number(expiresInDays) * 86_400_000).toISOString()
      : null;

    const { error: insertErr } = await admin.from('household_invites').insert({
      household_id: member.household_id,
      token_hash:   tokenHash,
      created_by:   user.id,
      expires_at:   expiresAt,
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
