import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

type AuthState = {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  onboardingDone: boolean | null;
  setSession: (session: Session | null) => void;
  setInitialized: () => void;
  setOnboardingDone: (done: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  onboardingDone: null,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setInitialized: () => set({ initialized: true }),
  setOnboardingDone: (done) => set({ onboardingDone: done }),
}));
