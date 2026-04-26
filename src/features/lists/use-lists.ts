import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';
import { useHousehold } from '@/src/features/auth/use-household';

export function useLists() {
  const { data: householdId } = useHousehold();

  return useQuery({
    queryKey: ['lists', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('household_id', householdId!)
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!householdId,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: householdId } = useHousehold();

  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('shopping_lists').insert({
        household_id: householdId!,
        name: name.trim(),
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists', householdId] }),
  });
}

export function useRenameList() {
  const qc = useQueryClient();
  const { data: householdId } = useHousehold();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists', householdId] }),
  });
}

export function useArchiveList() {
  const qc = useQueryClient();
  const { data: householdId } = useHousehold();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists', householdId] }),
  });
}
