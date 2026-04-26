import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from './store';

export function useAuth() {
  const { session, user, initialized } = useAuthStore();

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return { session, user, initialized, signIn, signUp, signOut };
}
