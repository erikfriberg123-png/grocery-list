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

    const { imageBase64, mimeType = 'image/jpeg' } =
      await req.json() as { imageBase64: string; mimeType?: string };

    if (!imageBase64) return json({ error: 'imageBase64 required' }, 400);

    const prompt =
      `This image may show a shopping list, a handwritten note, a recipe, or grocery items.

Extract every distinct food or household item you can identify. For each item return:
- name: clean item name (same language as the image)
- normalized_name: canonical/corrected form (fix typos, singular where natural)
- quantity: numeric amount if shown, otherwise null
- unit: standardized unit (g, kg, ml, l, dl, pcs, pack) if shown, otherwise null
- category: one of ${VALID_CATEGORIES.join(', ')}

Return ONLY a JSON array, no markdown, no explanation:
[{"name":"...","normalized_name":"...","quantity":null,"unit":null,"category":"..."}]

If no items are identifiable, return: []`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': anthropicKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    if (!aiRes.ok) {
      console.error('Anthropic error', aiRes.status, await aiRes.text());
      return json({ error: 'AI error' }, 502);
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.content?.[0]?.text?.trim() ?? '[]';

    let items: unknown[];
    try {
      items = JSON.parse(raw);
      if (!Array.isArray(items)) throw new Error('not array');
    } catch {
      console.error('AI returned non-JSON:', raw);
      return json({ items: [] });
    }

    // Sanitize each item
    const sanitized = items
      .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
      .map((x) => ({
        name:            String(x.name            ?? '').trim().slice(0, 200),
        normalized_name: String(x.normalized_name ?? x.name ?? '').trim().slice(0, 200),
        quantity:        typeof x.quantity === 'number' && isFinite(x.quantity as number) ? x.quantity : null,
        unit:            x.unit ? String(x.unit).slice(0, 20) : null,
        category:        VALID_CATEGORIES.includes(x.category as string) ? x.category : 'other',
      }))
      .filter((x) => x.name.length > 0);

    return json({ items: sanitized });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal error' }, 500);
  }
});
