import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from './store';

export function useHousehold() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['household', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data.household_id as string;
    },
    enabled: !!user,
  });
}
