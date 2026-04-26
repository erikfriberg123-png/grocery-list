import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { token } = await req.json();
    if (!token) throw new Error('token required');

    const hashBuf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(token),
    );
    const tokenHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0')).join('');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: link, error } = await admin
      .from('share_links')
      .select('*, shopping_lists(id, name)')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .single();

    if (error || !link) throw new Error('Invalid link');
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new Error('Link has expired');
    }

    const { data: items } = await admin
      .from('shopping_items')
      .select('*')
      .eq('list_id', link.list_id)
      .order('sort_order', { ascending: true });

    return new Response(
      JSON.stringify({
        listId: link.list_id,
        listName: (link.shopping_lists as { id: string; name: string }).name,
        permission: link.permission,
        items: items ?? [],
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
