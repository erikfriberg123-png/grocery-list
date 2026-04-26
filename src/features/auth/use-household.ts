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
        .maybeSingle();
      if (error) throw error;

      if (data) return data.household_id as string;

      // User pre-dates the trigger — bootstrap their household now
      const { data: newId, error: bootstrapError } = await supabase.rpc('bootstrap_user_household');
      if (bootstrapError) throw bootstrapError;
      return newId as string;
    },
    enabled: !!user,
  });
}
