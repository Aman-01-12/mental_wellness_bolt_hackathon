import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { Dashboard } from './components/dashboard/Dashboard';
import { ChatInterface } from './components/chat/ChatInterface';
import { PeerMatching } from './components/peer/PeerMatching';
import { ProfilePage } from './components/profile/ProfilePage';
import { ActiveFlags } from './components/flags/ActiveFlags';
import { Inbox } from './components/inbox/Inbox';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function App() {
  const { user, loading, initialized, onboardingCompleted, initializeAuth } = useAuthStore();

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Show loading spinner while initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading MindSpace...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user) {
    return (
      <Router>
        <AuthPage />
      </Router>
    );
  }

  // Show onboarding if not completed
  if (!onboardingCompleted) {
    return (
      <Router>
        <OnboardingFlow />
      </Router>
    );
  }

  // Show main app
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/chat/:conversationId" element={<ChatInterface />} />
          <Route path="/peer-matching" element={<PeerMatching />} />
          <Route path="/active-flags" element={<ActiveFlags />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;