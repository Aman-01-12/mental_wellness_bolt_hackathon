import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { Dashboard } from './components/dashboard/Dashboard';
import { ChatInterface } from './components/chat/ChatInterface';
import { PeerMatching } from './components/peer/PeerMatching';
import { ProfilePage } from './components/profile/ProfilePage';
import { ActiveFlags } from './components/flags/ActiveFlags';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function App() {
  const { user, loading, onboardingCompleted } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!onboardingCompleted) {
    return <OnboardingFlow />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/chat/:conversationId" element={<ChatInterface />} />
          <Route path="/peer-matching" element={<PeerMatching />} />
          <Route path="/active-flags" element={<ActiveFlags />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;