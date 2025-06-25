import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase, clearAuthData } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

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
        session: null, 
        loading: false,
        error: null 
      })
    } catch (error: any) {
      // Even if signOut fails, clear local state
      clearAuthData()
      set({ 
        user: null, 
        session: null, 
        loading: false,
        error: null 
      })
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
          set({ user: null, session: null, loading: false, error: null })
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

      // Listen for auth changes with error handling
      supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            set({ 
              user: session?.user ?? null, 
              session,
              loading: false,
              error: null 
            })
          } else if (event === 'SIGNED_IN') {
            set({ 
              user: session?.user ?? null, 
              session,
              loading: false,
              error: null 
            })
          }
        } catch (error: any) {
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.warn('Auth state change error, clearing auth data')
            clearAuthData()
            set({ user: null, session: null, loading: false, error: null })
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
        session: null, 
        loading: false,
        error: null // Don't show initialization errors to user
      })
    }
  },
}))