import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';

export function useItems(listId: string) {
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
      const names = raw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const rows = names.map((name, i) => ({
        list_id: listId,
        name,
        sort_order: Date.now() + i,
        added_by: user?.id ?? null,
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
