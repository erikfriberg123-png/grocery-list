import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';

export type HouseholdMember = {
  id: string;
  user_id: string;
  role: 'owner' | 'member';
  profiles: {
    email: string;
    display_name: string | null;
  } | null;
};

async function getHouseholdId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  if (error || !data) throw error ?? new Error('No household found');
  return data.household_id as string;
}

export function useHouseholdMembers() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['household_members'],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const householdId = await getHouseholdId(user.id);

      const { data: members, error: membersError } = await supabase
        .from('household_members')
        .select('id, user_id, role')
        .eq('household_id', householdId)
        .order('role');
      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const userIds = members.map((m) => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds);
      if (profilesError) throw profilesError;

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, { email: p.email as string, display_name: p.display_name as string | null }]),
      );

      return members.map((m) => ({
        id: m.id as string,
        user_id: m.user_id as string,
        role: m.role as 'owner' | 'member',
        profiles: profileMap.get(m.user_id as string) ?? null,
      })) satisfies HouseholdMember[];
    },
    enabled: !!user,
  });
}

export function useRemoveHouseholdMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household_members'] }),
  });
}
