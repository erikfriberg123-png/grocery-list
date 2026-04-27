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

const VALID_CATEGORIES = [
  'produce', 'dairy', 'meat', 'seafood', 'frozen', 'pantry',
  'bakery', 'drinks', 'snacks', 'hygiene', 'cleaning',
  'pets', 'baby', 'pharmacy', 'other',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicKey) return json({ error: 'AI not configured' }, 503);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { text } = await req.json() as { text: string };
    if (!text?.trim()) return json({ error: 'text required' }, 400);

    const prompt = `You are a shopping list parser. Parse the item text and return JSON only.

Item: "${text.trim()}"

Rules:
- name: the clean item name without quantity/unit
- normalized_name: fix spelling ("milkk"→"milk", "banans"→"bananas"), canonical form
- quantity: numeric value if present, otherwise null
- unit: standardized unit (g, kg, ml, l, dl, pcs, pack) if present, otherwise null
- category: one of: ${VALID_CATEGORIES.join(', ')}

Respond ONLY with JSON, no markdown, no explanation:
{"name":"...","normalized_name":"...","quantity":null,"unit":null,"category":"..."}`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': anthropicKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      console.error('Anthropic HTTP error:', aiRes.status, await aiRes.text());
      return json({ error: 'AI error' }, 502);
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.content?.[0]?.text?.trim() ?? '';

    let parsed: {
      name: string;
      normalized_name: string;
      quantity: number | null;
      unit: string | null;
      category: string | null;
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('AI returned non-JSON:', raw);
      return json({ error: 'parse error' }, 502);
    }

    return json({
      name:             String(parsed.name             || text).trim().slice(0, 200),
      normalized_name:  String(parsed.normalized_name  || parsed.name || text).trim().slice(0, 200),
      quantity:         typeof parsed.quantity === 'number' && isFinite(parsed.quantity) ? parsed.quantity : null,
      unit:             parsed.unit   ? String(parsed.unit).slice(0, 20)   : null,
      category:         VALID_CATEGORIES.includes(parsed.category as string) ? parsed.category : null,
    });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal error' }, 500);
  }
});
