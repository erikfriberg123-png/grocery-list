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

    const body = await req.json();
    const { token } = body ?? {};
    if (!token) return json({ error: 'token required' }, 400);

    // Hash the incoming token and look it up
    const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const tokenHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0')).join('');

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: invite, error: inviteErr } = await admin
      .from('household_invites')
      .select('id, household_id, expires_at, max_uses, use_count')
      .eq('token_hash', tokenHash)
      .single();
    if (inviteErr || !invite) return json({ error: 'Invalid or expired invite' }, 404);

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return json({ error: 'Invite has expired' }, 410);
    }

    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      return json({ error: 'Invite has reached its maximum uses' }, 410);
    }

    // Fetch household name for the response
    const { data: household } = await admin
      .from('households')
      .select('name')
      .eq('id', invite.household_id)
      .single();

    // Idempotent: if already a member just return success
    const { data: existing } = await admin
      .from('household_members')
      .select('id')
      .eq('household_id', invite.household_id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      const { error: memberErr } = await admin
        .from('household_members')
        .insert({ household_id: invite.household_id, user_id: user.id, role: 'member' });
      if (memberErr) return json({ error: memberErr.message }, 500);

      await admin
        .from('household_invites')
        .update({ use_count: invite.use_count + 1 })
        .eq('id', invite.id);
    }

    return json({ householdId: invite.household_id, householdName: household?.name ?? '' });
  } catch (err) {
    console.error('unexpected error:', err);
    return json({ error: (err as Error).message }, 500);
  }
});
