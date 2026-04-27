import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';

export type Template = {
  id: string;
  name: string;
  created_at: string;
  list_template_items: { id: string }[];
};

export function useTemplates() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_templates')
        .select('id, name, created_at, list_template_items(id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Template[];
    },
    enabled: !!user,
  });
}

/** Save the active items of a list as a named template. */
export function useSaveAsTemplate() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ listId, name }: { listId: string; name: string }) => {
      // Resolve household_id from the list itself
      const { data: listData, error: listErr } = await supabase
        .from('shopping_lists')
        .select('household_id')
        .eq('id', listId)
        .single();
      if (listErr || !listData) throw listErr ?? new Error('List not found');

      // Create the template record
      const { data: tpl, error: tplErr } = await supabase
        .from('list_templates')
        .insert({ household_id: listData.household_id, name: name.trim(), created_by: user!.id })
        .select('id')
        .single();
      if (tplErr || !tpl) throw tplErr ?? new Error('Failed to create template');

      // Copy all active items from the list
      const { data: items, error: itemsErr } = await supabase
        .from('shopping_items')
        .select('name, normalized_name, category, quantity, unit, sort_order')
        .eq('list_id', listId)
        .eq('status', 'active')
        .order('sort_order');
      if (itemsErr) throw itemsErr;

      if (items && items.length > 0) {
        const rows = items.map((item) => ({
          template_id:     tpl.id,
          name:            item.name,
          normalized_name: item.normalized_name,
          category:        item.category,
          quantity:        item.quantity,
          unit:            item.unit,
          sort_order:      item.sort_order,
        }));
        const { error: insertErr } = await supabase.from('list_template_items').insert(rows);
        if (insertErr) throw insertErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

/** Create a new shopping list pre-populated with a template's items. */
export function useCreateFromTemplate() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ templateId, name }: { templateId: string; name: string }) => {
      // Resolve household_id via the template
      const { data: tpl, error: tplErr } = await supabase
        .from('list_templates')
        .select('household_id')
        .eq('id', templateId)
        .single();
      if (tplErr || !tpl) throw tplErr ?? new Error('Template not found');

      // Create the new list
      const { data: list, error: listErr } = await supabase
        .from('shopping_lists')
        .insert({ household_id: tpl.household_id, name: name.trim(), created_by: user!.id })
        .select('id')
        .single();
      if (listErr || !list) throw listErr ?? new Error('Failed to create list');

      // Fetch template items
      const { data: items, error: itemsErr } = await supabase
        .from('list_template_items')
        .select('name, normalized_name, category, quantity, unit, sort_order')
        .eq('template_id', templateId)
        .order('sort_order');
      if (itemsErr) throw itemsErr;

      if (items && items.length > 0) {
        const base = Math.floor(Date.now() / 1000);
        const rows = items.map((item, i) => ({
          list_id:         list.id,
          name:            item.name,
          normalized_name: item.normalized_name,
          category:        item.category,
          quantity:        item.quantity,
          unit:            item.unit,
          sort_order:      item.sort_order ?? base + i,
          added_by:        user!.id,
        }));
        const { error: insertErr } = await supabase.from('shopping_items').insert(rows);
        if (insertErr) throw insertErr;
      }

      return list.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from('list_templates').delete().eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}
