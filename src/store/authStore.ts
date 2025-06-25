import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase, clearAuthData } from '../lib/supabase'

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
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
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
  error: null,
  onboardingCompleted: false,

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token')) {
          clearAuthData()
          throw new Error('Session expired. Please try signing in again.')
        }
        throw error
      }

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

      if (error) {
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token')) {
          clearAuthData()
          throw new Error('Session expired. Please try signing up again.')
        }
        throw error
      }

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
      
      if (error && !error.message.includes('refresh_token_not_found')) {
        throw error
      }

      // Always clear local state and auth data on sign out
      clearAuthData()
      set({ 
        user: null, 
        profile: null,
        session: null, 
        loading: false,
        error: null,
        onboardingCompleted: false
      })
    } catch (error: any) {
      // Even if signOut fails, clear local state
      clearAuthData()
      set({ 
        user: null, 
        profile: null,
        session: null, 
        loading: false,
        error: null,
        onboardingCompleted: false
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
    const { user } = get()
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
      set({ loading: true, error: null })

      // Get initial session with error handling
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token')) {
          console.warn('Invalid session on initialization, clearing auth data')
          clearAuthData()
          set({ user: null, profile: null, session: null, loading: false, error: null, onboardingCompleted: false })
          return
        }
        throw error
      }

      set({ 
        user: session?.user ?? null, 
        session,
        loading: false,
        error: null 
      })

      // Fetch profile if user exists
      if (session?.user) {
        await get().fetchProfile()
      }

      // Listen for auth changes with error handling
      supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === 'SIGNED_OUT') {
            set({ 
              user: null,
              profile: null, 
              session: null,
              loading: false,
              error: null,
              onboardingCompleted: false
            })
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            set({ 
              user: session?.user ?? null, 
              session,
              loading: false,
              error: null 
            })
            
            // Fetch profile on sign in
            if (session?.user) {
              await get().fetchProfile()
            }
          }
        } catch (error: any) {
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.warn('Auth state change error, clearing auth data')
            clearAuthData()
            set({ user: null, profile: null, session: null, loading: false, error: null, onboardingCompleted: false })
          } else {
            console.error('Auth state change error:', error)
            set({ error: error.message, loading: false })
          }
        }
      })

    } catch (error: any) {
      console.error('Auth initialization failed:', error)
      clearAuthData()
      set({ 
        user: null, 
        profile: null,
        session: null, 
        loading: false,
        error: null, // Don't show initialization errors to user
        onboardingCompleted: false
      })
    }
  },
}))