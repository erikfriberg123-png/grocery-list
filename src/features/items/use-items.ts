import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';
import { parseItem, type ParsedItem } from '@/src/lib/parse-item';

/** Tries the Edge Function with a 3-second timeout, falls back to client-side parser. */
async function normalizeItem(text: string): Promise<ParsedItem> {
  const edgeFn = supabase.functions.invoke('normalize-shopping-item', {
    body: { text },
  });
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 3000),
  );
  try {
    const { data, error } = await Promise.race([edgeFn, timeout]);
    if (error || !data?.name) throw error ?? new Error('empty');
    return data as ParsedItem;
  } catch {
    return parseItem(text);
  }
}

export function useItems(listId: string) {
  const qc = useQueryClient();

  // Realtime subscription — one per mounted list view, cleaned up on unmount
  useEffect(() => {
    const channel = supabase
      .channel(`items:${listId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_items', filter: `list_id=eq.${listId}` },
        () => { qc.invalidateQueries({ queryKey: ['items', listId] }); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listId]);

  return useQuery({
    queryKey: ['items', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('list_id', listId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddItems() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ listId, raw }: { listId: string; raw: string }) => {
      const texts = raw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      // Normalize all items in parallel (AI with client-side fallback)
      const parsed = await Promise.all(texts.map(normalizeItem));

      const base = Math.floor(Date.now() / 1000);
      const rows = parsed.map((item, i) => ({
        list_id:         listId,
        name:            item.name,
        normalized_name: item.normalized_name,
        quantity:        item.quantity,
        unit:            item.unit,
        category:        item.category,
        sort_order:      base + i,
        added_by:        user?.id ?? null,
      }));

      const { error } = await supabase.from('shopping_items').insert(rows);
      if (error) throw error;
    },
    onSuccess: (_data, { listId }) =>
      qc.invalidateQueries({ queryKey: ['items', listId] }),
  });
}

export function useToggleItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      listId,
      status,
    }: {
      id: string;
      listId: string;
      status: 'active' | 'checked';
    }) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { listId }) =>
      qc.invalidateQueries({ queryKey: ['items', listId] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, listId }: { id: string; listId: string }) => {
      const { error } = await supabase.from('shopping_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { listId }) =>
      qc.invalidateQueries({ queryKey: ['items', listId] }),
  });
}

export function useClearChecked() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('list_id', listId)
        .eq('status', 'checked');
      if (error) throw error;
    },
    onSuccess: (_data, listId) =>
      qc.invalidateQueries({ queryKey: ['items', listId] }),
  });
}

export function useReorderItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      listId,
      category,
      sortOrder,
    }: {
      id: string;
      listId: string;
      category: string | null;
      sortOrder: number;
    }) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({ category, sort_order: sortOrder, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { listId }) =>
      qc.invalidateQueries({ queryKey: ['items', listId] }),
  });
}

export function useAddParsedItems() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ listId, items }: { listId: string; items: ParsedItem[] }) => {
      const base = Math.floor(Date.now() / 1000);
      const rows = items.map((item, i) => ({
        list_id:         listId,
        name:            item.name,
        normalized_name: item.normalized_name,
        quantity:        item.quantity,
        unit:            item.unit,
        category:        item.category,
        sort_order:      base + i,
        added_by:        user?.id ?? null,
      }));
      const { error } = await supabase.from('shopping_items').insert(rows);
      if (error) throw error;
    },
    onSuccess: (_data, { listId }) =>
      qc.invalidateQueries({ queryKey: ['items', listId] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, listId, name }: { id: string; listId: string; name: string }) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { listId }) =>
      qc.invalidateQueries({ queryKey: ['items', listId] }),
  });
}
