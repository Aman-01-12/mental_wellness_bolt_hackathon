import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useInboxStore } from '../../store/inboxStore';

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
  const conversations = useInboxStore((s) => s.conversations);
  const setConversations = useInboxStore((s) => s.setConversations);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [peerNames, setPeerNames] = useState<{ [conversationId: string]: string }>({});
  const isMounted = useRef(false);

  // Fetch initial conversations on mount
  useEffect(() => {
    isMounted.current = true;
    if (!initialized) return;
    if (!user) {
      setLoading(false);
      setError('Please sign in to view your inbox');
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
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
        if (conversationsError) throw conversationsError;
        // For each conversation, get the latest message
        const conversationsWithMessages = await Promise.all(
          (conversationsData || []).map(async (conversation) => {
            const { data: latestMessages } = await supabase
              .from('messages')
              .select('id, content, timestamp, sender_id, conversation_id')
              .eq('conversation_id', conversation.id)
              .order('timestamp', { ascending: false })
              .limit(1);
            return {
              ...conversation,
              latest_message: latestMessages && latestMessages.length > 0 ? latestMessages[0] : undefined
            };
          })
        );
        if (isMounted.current) {
          setConversations(conversationsWithMessages);
        }
      } catch (err: any) {
        if (isMounted.current) {
          setError(err.message || 'Failed to load conversations');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted.current = false;
    };
  }, [user, initialized, setConversations]);

  // Fetch peer names for all conversations
  useEffect(() => {
    if (!user || !conversations.length) return;
    let cancelled = false;
    const fetchPeerNames = async () => {
      const newPeerNames: { [conversationId: string]: string } = {};
      await Promise.all(
        conversations.map(async (conversation) => {
          if (conversation.type === 'ai') return;
          const peerId = conversation.participant_ids.find((id) => id !== user.id);
          if (!peerId) return;
          const { data, error } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', peerId)
            .single();
          if (!cancelled) {
            newPeerNames[conversation.id] = data?.display_name || 'Peer';
          }
        })
      );
      if (!cancelled) setPeerNames(newPeerNames);
    };
    fetchPeerNames();
    return () => {
      cancelled = true;
    };
  }, [user, conversations]);

  // Show loading if auth is not initialized yet
  if (!initialized) {
    return (
      <div className="min-h-screen bg-primary-50 dark:bg-gray-900">
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
      <div className="min-h-screen bg-primary-50 dark:bg-gray-900">
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

  // Show error if realtime subscription fails
  if (error?.toLowerCase().includes('real-time') || error?.toLowerCase().includes('timed out') || error?.toLowerCase().includes('closed')) {
    return (
      <div className="min-h-screen bg-primary-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error-400" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Realtime Connection Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8"
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
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Inbox</h1>
                <p className="text-sm text-gray-500 dark:text-gray-300">Your conversations and messages</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-error-50 border border-error-200 dark:bg-error-900 dark:border-error-800 rounded-xl p-4 mb-6">
              <p className="text-error-700 dark:text-error-200 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
              <p className="text-gray-500 dark:text-gray-400 ml-4">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No conversations yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
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
                  to="/peer-matching?tab=my-tickets"
                  className="px-6 py-3 bg-white text-primary-600 rounded-xl font-medium border border-primary-200 hover:border-primary-300 hover:shadow-lg transition-all"
                >
                  My Requests
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.filter(c => c.type !== 'ai').map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer dark:bg-gray-900"
                >
                  <Link to={`/chat/${conversation.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-primary-100 dark:from-secondary-900 dark:to-primary-900 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-secondary-600 dark:text-secondary-300" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {conversation.type === 'ai' ? 'AI Companion' : (peerNames[conversation.id] || 'Peer')}
                          </h3>
                          {conversation.latest_message ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
                              {conversation.latest_message.content}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {conversation.latest_message && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
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