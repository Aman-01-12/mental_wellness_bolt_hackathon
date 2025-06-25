import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AuthPage } from './components/auth/AuthPage'
import { Dashboard } from './components/dashboard/Dashboard'
import { ChatInterface } from './components/chat/ChatInterface'
import { ActiveFlags } from './components/flags/ActiveFlags'
import { PeerMatching } from './components/peer/PeerMatching'
import { Inbox } from './components/inbox/Inbox'
import { ProfilePage } from './components/profile/ProfilePage'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

function App() {
  const { user, loading, initializeAuth, error, clearError, onboardingCompleted } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    // Clear any auth errors after a short delay
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth page if user is not logged in
  if (!user) {
    return <AuthPage />
  }

  // Show onboarding if user hasn't completed it
  if (!onboardingCompleted) {
    return <OnboardingFlow />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mx-4 mt-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<ChatInterface />} />
        <Route path="/chat/:conversationId" element={<ChatInterface />} />
        <Route path="/active-flags" element={<ActiveFlags />} />
        <Route path="/peer-matching" element={<PeerMatching />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </div>
  )
}

export default App