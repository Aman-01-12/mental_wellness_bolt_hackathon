import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface Conversation {
  id: string;
  participant_ids: string[];
  type: string;
  started_at: string;
  status: string;
  latest_message?: {
    content: string;
    timestamp: string;
    sender_id: string;
  };
}

export function Inbox() {
  const { user, initialized } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Fetch conversations where user is a participant
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_ids,
          type,
          started_at,
          status
        `)
        .contains('participant_ids', [user.id])
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (conversationsError) {
        throw conversationsError;
      }

      // For each conversation, get the latest message
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          const { data: latestMessages } = await supabase
            .from('messages')
            .select('content, timestamp, sender_id')
            .eq('conversation_id', conversation.id)
            .order('timestamp', { ascending: false })
            .limit(1);

          return {
            ...conversation,
            latest_message: latestMessages && latestMessages.length > 0 ? latestMessages[0] : undefined
          };
        })
      );

      setConversations(conversationsWithMessages);

    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (!initialized) return;
    
    if (!user) {
      setLoading(false);
      setError('Please sign in to view your inbox');
      return;
    }
    
    setLoading(true);
    fetchConversations();
  }, [user, initialized, fetchConversations]);

  // Realtime subscription management
  useEffect(() => {
    if (!user || !initialized) return;

    // Set up realtime subscription for new messages
    const subscription = supabase
      .channel(`inbox-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          // Refresh conversations when new message arrives
          fetchConversations();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to inbox messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error');
          setError('Failed to connect to real-time updates');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Realtime subscription timed out');
          setError('Real-time connection timed out');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, initialized, fetchConversations]);

  // Show loading if auth is not initialized yet
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">You need to be signed in to view your inbox.</p>
            <Link
              to="/auth"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
                <p className="text-sm text-gray-500">Your conversations and messages</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-error-50 border border-error-200 rounded-xl p-4 mb-6">
              <p className="text-error-700 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
              <p className="text-gray-500 ml-4">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600 mb-6">
                Start a conversation by connecting with peers or chatting with the AI companion.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/chat"
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Chat with AI
                </Link>
                <Link
                  to="/active-flags"
                  className="px-6 py-3 bg-white text-primary-600 rounded-xl font-medium border border-primary-200 hover:border-primary-300 hover:shadow-lg transition-all"
                >
                  Find Peer Support
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-2xl p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <Link to={`/chat/${conversation.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-primary-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-secondary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {conversation.type === 'ai' ? 'AI Companion' : 'Peer Support'}
                          </h3>
                          {conversation.latest_message ? (
                            <p className="text-sm text-gray-600 truncate max-w-xs">
                              {conversation.latest_message.content}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">No messages yet</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {conversation.latest_message && (
                          <p className="text-xs text-gray-500">
                            {new Date(conversation.latest_message.timestamp).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}