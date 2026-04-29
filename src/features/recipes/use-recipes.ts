import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/features/auth/store';

export type RecipeCategory =
  | 'meat' | 'fish' | 'salads' | 'pasta'
  | 'vegetarian' | 'soups' | 'desserts' | 'other';

export type Recipe = {
  id: string;
  household_id: string;
  name: string;
  category: RecipeCategory;
  url: string | null;
  image_path: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeForm = {
  name: string;
  category: RecipeCategory;
  url: string;
  note: string;
  localImageUri: string;
};

export function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('/var/') ||
         uri.startsWith('content://') || uri.startsWith('ph://');
}

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

async function uploadImage(
  householdId: string,
  localUri: string,
  existingPath: string | null,
): Promise<string> {
  // Delete old image if path changed
  if (existingPath) {
    await supabase.storage.from('recipe-images').remove([existingPath]);
  }

  const ext  = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${householdId}/${Date.now()}.${ext}`;

  const response = await fetch(localUri);
  const blob     = await response.blob();

  const { error } = await supabase.storage
    .from('recipe-images')
    .upload(path, blob, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: false });

  if (error) throw error;
  return path;
}

function publicUrl(path: string): string {
  const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
  return data.publicUrl;
}

// Returns the display URL for a recipe: public storage URL or null.
export function recipeImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  return publicUrl(imagePath);
}

export function useRecipes() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Recipe[];
    },
    enabled: !!user,
  });
}

export function useUpsertRecipe() {
  const qc   = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      id,
      form,
      existingImagePath,
    }: {
      id?: string;
      form: RecipeForm;
      existingImagePath?: string | null;
    }) => {
      const householdId = await resolveHouseholdId(user!.id);

      let imagePath: string | null = existingImagePath ?? null;

      if (form.localImageUri === '__remove__') {
        // User explicitly removed the existing image
        if (existingImagePath) {
          await supabase.storage.from('recipe-images').remove([existingImagePath]);
        }
        imagePath = null;
      } else if (form.localImageUri && isLocalUri(form.localImageUri)) {
        // User picked a new image — upload it (uploadImage deletes the old one first)
        imagePath = await uploadImage(householdId, form.localImageUri, existingImagePath ?? null);
      }
      // '' means no change: keep existingImagePath as-is

      const row = {
        household_id: householdId,
        created_by:   user!.id,
        name:         form.name.trim(),
        category:     form.category,
        url:          form.url.trim() || null,
        image_path:   imagePath,
        note:         form.note.trim() || null,
      };

      if (id) {
        const { error } = await supabase.from('recipes').update(row).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recipes').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, imagePath }: { id: string; imagePath: string | null }) => {
      if (imagePath) {
        await supabase.storage.from('recipe-images').remove([imagePath]);
      }
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}
