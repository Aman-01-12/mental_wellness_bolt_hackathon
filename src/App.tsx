import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { Dashboard } from './components/dashboard/Dashboard';
import { AIChatInterface } from './components/chat/AIChatInterface';
import { PeerChatInterface } from './components/chat/PeerChatInterface';
import { PeerMatching } from './components/peer/PeerMatching';
import { ProfilePage } from './components/profile/ProfilePage';
import { ActiveFlags } from './components/flags/ActiveFlags';
import { Inbox } from './components/inbox/Inbox';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { supabase } from './lib/supabase';
import { startInboxRealtime, stopInboxRealtime } from './lib/inboxRealtime';
import { useInboxStore } from './store/inboxStore';
import { refetchInboxConversations } from './lib/inboxFetch';
import { refetchRequests } from './lib/requestsFetch';
import { refetchTickets } from './lib/ticketsFetch';

function AppContent() {
  const { user, loading, initialized, onboardingCompleted, initializeAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_OUT' || session === null) && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Redirect authenticated users away from /auth
  useEffect(() => {
    if (user && location.pathname === '/auth') {
      navigate('/', { replace: true });
    }
  }, [user, location, navigate]);

  useEffect(() => {
    if (user) {
      startInboxRealtime(user.id);
    } else {
      stopInboxRealtime();
      useInboxStore.getState().clear();
    }
    // Cleanup on unmount
    return () => {
      stopInboxRealtime();
    };
  }, [user]);

  // Restore last route after reload
  useEffect(() => {
    const lastRoute = localStorage.getItem('lastRoute');
    if (lastRoute && window.location.pathname !== lastRoute) {
      localStorage.removeItem('lastRoute');
      window.location.replace(lastRoute);
    }
  }, []);

  // Hard refresh on tab switch (visibilitychange)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        localStorage.setItem('lastRoute', window.location.pathname + window.location.search);
        window.location.reload();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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
    return <AuthPage />;
  }

  // Show onboarding if not completed
  if (!onboardingCompleted) {
    return <OnboardingFlow />;
  }

  // Show main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<AIChatInterface />} />
        <Route path="/chat/:conversationId" element={<PeerChatInterface />} />
        <Route path="/peer-matching" element={<PeerMatching />} />
        <Route path="/active-flags" element={<ActiveFlags />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}