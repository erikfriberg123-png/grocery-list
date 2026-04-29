import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';

async function resolveHouseholdId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  if (error || !data) throw error ?? new Error('No household found');
  return data.household_id as string;
}

export type MealPlan = {
  id: string;
  household_id: string;
  week_start: string;
  day: number;
  recipe_id: string | null;
  meal_name: string | null;
  created_at: string;
  updated_at: string;
  recipes: {
    id: string;
    name: string;
    image_path: string | null;
    category: string;
  } | null;
};

export function useMealPlan(weekStart: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['meal_plans', weekStart],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('meal_plans')
        .select('*, recipes(id, name, image_path, category)')
        .eq('week_start', weekStart)
        .order('day');
      if (error) throw error;
      return (data ?? []) as MealPlan[];
    },
    enabled: !!user,
  });
}

export function useUpsertMeal() {
  const qc   = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({
      weekStart,
      day,
      recipeId,
      mealName,
    }: {
      weekStart: string;
      day: number;
      recipeId?: string | null;
      mealName?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const householdId = await resolveHouseholdId(user.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('meal_plans')
        .upsert(
          {
            household_id: householdId,
            week_start:   weekStart,
            day,
            recipe_id:    recipeId  ?? null,
            meal_name:    mealName  ?? null,
            updated_at:   new Date().toISOString(),
          },
          { onConflict: 'household_id,week_start,day' },
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['meal_plans', vars.weekStart] }),
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, weekStart }: { id: string; weekStart: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('meal_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['meal_plans', vars.weekStart] }),
  });
}
