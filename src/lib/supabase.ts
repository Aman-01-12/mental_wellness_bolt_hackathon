import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Function to clear corrupted auth data
const clearAuthData = () => {
  try {
    // Clear all Supabase-related items from localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Also clear sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('sb-')) {
        sessionStorage.removeItem(key)
      }
    }
  } catch (error) {
    console.warn('Failed to clear auth data:', error)
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'mindspace-app'
    }
  }
})

// Handle auth errors globally
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
    // Disconnect realtime when user signs out
    supabase.removeAllChannels()
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in')
  }
})

// Add error handling for refresh token issues
const originalRefreshSession = supabase.auth.refreshSession.bind(supabase.auth)
supabase.auth.refreshSession = async () => {
  try {
    return await originalRefreshSession()
  } catch (error: any) {
    if (error?.message?.includes('refresh_token_not_found') || 
        error?.message?.includes('Invalid Refresh Token')) {
      console.warn('Invalid refresh token detected, clearing auth data')
      clearAuthData()
      // Force a fresh session
      await supabase.auth.signOut()
    }
    throw error
  }
}

// Initialize auth with error handling
const initializeAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      if (error.message.includes('refresh_token_not_found') || 
          error.message.includes('Invalid Refresh Token')) {
        console.warn('Invalid session detected during initialization, clearing auth data')
        clearAuthData()
        await supabase.auth.signOut()
      } else {
        console.error('Auth initialization error:', error)
      }
    }
    return session
  } catch (error) {
    console.error('Failed to initialize auth:', error)
    clearAuthData()
    return null
  }
}

// Call initialization
initializeAuth()

export { clearAuthData }