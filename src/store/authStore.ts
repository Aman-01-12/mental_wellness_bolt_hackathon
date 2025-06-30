import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  display_name: string | null
  age_range: string | null
  gender: string | null
  personality_traits: string[] | null
  work_status: string | null
  work_style: string | null
  food_habits: string | null
  sleep_duration: number | null
  relationship_status: string | null
  communication_style: string | null
  support_type: string | null
  availability: string | null
  mental_health_background: any | null
  privacy_settings: any | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
  ai_companion_name?: string | null
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  error: string | null
  onboardingCompleted: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  clearError: () => void
  initializeAuth: () => Promise<void>
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,
  error: null,
  onboardingCompleted: false,

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      set({ 
        user: data.user, 
        session: data.session,
        loading: false,
        error: null 
      })

      // Fetch profile after successful sign in
      await get().fetchProfile()
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to sign in',
        loading: false 
      })
      throw error
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      set({ 
        user: data.user, 
        session: data.session,
        loading: false,
        error: null 
      })

      // Fetch profile after successful sign up
      if (data.user) {
        await get().fetchProfile()
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to sign up',
        loading: false 
      })
      throw error
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error

      set({ 
        user: null, 
        profile: null,
        session: null, 
        loading: false,
        error: null,
        onboardingCompleted: false,
        initialized: true
      })
    } catch (error: any) {
      // Even if signOut fails, clear local state
      set({ 
        user: null, 
        profile: null,
        session: null, 
        loading: false,
        error: null,
        onboardingCompleted: false,
        initialized: true
      })
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const { user } = get()
    if (!user) throw new Error('No user found')

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      
      await get().fetchProfile()
    } catch (error: any) {
      set({ error: error.message || 'Failed to update profile' })
      throw error
    }
  },

  fetchProfile: async () => {
    const { user, signOut } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (!data) {
        // User not found in users table (deleted from DB)
        alert('Your account no longer exists. Please sign up again.');
        await signOut();
        window.location.href = '/auth';
        return;
      }

      set({ 
        profile: data,
        onboardingCompleted: data?.onboarding_completed || false 
      })
    } catch (error: any) {
      console.error('Error fetching profile:', error)
    }
  },

  clearError: () => set({ error: null }),

  initializeAuth: async () => {
    try {
      console.log('🔐 Initializing auth...')
      set({ loading: true, error: null })

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        set({ 
          user: null, 
          profile: null, 
          session: null, 
          loading: false, 
          initialized: true,
          error: null, 
          onboardingCompleted: false 
        })
        return
      }

      console.log('📋 Initial session:', session ? 'Found' : 'None')

      set({ 
        user: session?.user ?? null, 
        session,
        loading: false,
        initialized: true,
        error: null 
      })

      // Fetch profile if user exists
      if (session?.user) {
        console.log('👤 Fetching user profile...')
        await get().fetchProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          console.log('🔄 Auth state changed:', event)
          
          if (event === 'SIGNED_OUT') {
            set({ 
              user: null,
              profile: null, 
              session: null,
              loading: false,
              initialized: true,
              error: null,
              onboardingCompleted: false
            })
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            set({ 
              user: session?.user ?? null, 
              session,
              loading: false,
              initialized: true,
              error: null 
            })
            
            // Fetch profile on sign in
            if (session?.user) {
              await get().fetchProfile()
            }
          }
        } catch (error: any) {
          console.error('Auth state change error:', error)
          set({ error: error.message, loading: false, initialized: true })
        }
      })

    } catch (error: any) {
      console.error('Auth initialization failed:', error)
      set({ 
        user: null, 
        profile: null,
        session: null, 
        loading: false,
        initialized: true,
        error: null, // Don't show initialization errors to user
        onboardingCompleted: false
      })
    }
  },
}))