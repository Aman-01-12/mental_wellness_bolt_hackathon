import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../lib/supabase';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  onboardingCompleted: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  onboardingCompleted: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => 
    set({ 
      profile, 
      onboardingCompleted: profile?.onboarding_completed || false 
    }),
  setLoading: (loading) => set({ loading }),

  signUp: async (email, password) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, profile: null, onboardingCompleted: false });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    const { user } = get();
    if (!user) throw new Error('No user found');

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    
    await get().fetchProfile();
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    set({ 
      profile: data,
      onboardingCompleted: data?.onboarding_completed || false 
    });
  },
}));

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setUser(session?.user ?? null);
  if (session?.user) {
    useAuthStore.getState().fetchProfile();
  }
  useAuthStore.getState().setLoading(false);
});

supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setUser(session?.user ?? null);
  if (session?.user) {
    useAuthStore.getState().fetchProfile();
  }
});