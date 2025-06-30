import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import CustomHomePage from './components/dashboard/CustomHomePage';
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
import { Navigation } from './components/ui/Navigation';
import { ToastProvider, useToast } from './components/ui/Toast';
import { startMatchRequestsRealtime, stopMatchRequestsRealtime } from './lib/requestsRealtime';
import { useTicketsStore } from './store/ticketsStore';

function AppContent() {
  const { user, loading, initialized, onboardingCompleted, initializeAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useToast();
  const tickets = useTicketsStore((s) => s.tickets);

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

  // Inbox realtime logic (unchanged)
  useEffect(() => {
    if (user) {
      startInboxRealtime(user.id, (msg) => {
        const inInbox = location.pathname.startsWith('/inbox');
        const inCurrentConversation = location.pathname.startsWith('/chat/') && location.pathname.endsWith(msg.conversation_id);
        if (!inInbox && !inCurrentConversation && msg.sender_role == null) {
          showToast('New message received');
        }
      });
    } else {
      stopInboxRealtime();
      useInboxStore.getState().clear();
    }
    return () => {
      stopInboxRealtime();
    };
  }, [user, location, showToast]);

  // Match requests realtime logic (fixed)
  useEffect(() => {
    if (!user) {
      stopMatchRequestsRealtime();
      return;
    }
    const userTicketIds = tickets.filter(t => t.user_id === user.id).map(t => t.id);
    if (userTicketIds.length === 0) {
      stopMatchRequestsRealtime();
      return;
    }
    console.log('Subscribing to match requests for ticket IDs:', userTicketIds);
    startMatchRequestsRealtime(userTicketIds, (req) => {
      console.log('Realtime match request event:', req, userTicketIds);
      showToast('New request on your ticket!');
    });
    return () => {
      stopMatchRequestsRealtime();
    };
  }, [user, showToast, tickets]);

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
    <MainLayout>
      <Routes>
        <Route path="/" element={<CustomHomePage />} />
        <Route path="/chat" element={<AIChatInterface />} />
        <Route path="/chat/:conversationId" element={<PeerChatInterface />} />
        <Route path="/peer-matching" element={<PeerMatching />} />
        <Route path="/active-flags" element={<ActiveFlags />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </MainLayout>
  );
}

// MainLayout wraps the sidebar and main content
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <main className="flex-1 min-h-screen p-4 md:p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}