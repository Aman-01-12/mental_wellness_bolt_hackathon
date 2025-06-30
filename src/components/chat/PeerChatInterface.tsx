import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Send, RotateCcw, AlertCircle } from 'lucide-react';
import { Navigation } from '../ui/Navigation';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  timestamp: string;
}

export function PeerChatInterface() {
  const { conversationId } = useParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const draftKey = conversationId ? `chatDraft-${conversationId}` : undefined;
  const [peerName, setPeerName] = useState<string>('Peer');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Fetch conversation and messages
  useEffect(() => {
    const fetchConversationAndMessages = async () => {
      if (!conversationId || !user) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch all conversations for the user and log their IDs
        const { data: allConvs, error: allConvsErr } = await supabase
          .from('conversations')
          .select('id, participant_ids')
          .contains('participant_ids', [user.id]);
        if (allConvsErr) {
          console.error('Error fetching all conversations:', allConvsErr);
        } else {
          console.log('All conversation IDs for user', user.id, ':', allConvs?.map((c: any) => c.id));
        }
        // Fetch conversation
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();
        if (convErr || !conv) throw convErr || new Error('Conversation not found');
        setConversation(conv);
        // Fetch messages
        const { data: msgs, error: msgsErr } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true });
        if (msgsErr) throw msgsErr;
        setMessages(msgs || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };
    fetchConversationAndMessages();
  }, [conversationId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to new messages for this conversation
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`peerchat-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const newMsg = payload.new as Message;
            if (prev.some(msg => msg.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, user]);

  // Restore draft on mount or conversationId change
  useEffect(() => {
    if (!draftKey) return;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft !== null) {
      setInputValue(savedDraft);
    }
  }, [draftKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (draftKey) {
      localStorage.setItem(draftKey, e.target.value);
    }
  };

  // Send a new message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending || !user || !conversationId) return;
    setSending(true);
    setError(null);
    try {
      const { data: msg, error: sendErr } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: inputValue.trim(),
            timestamp: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (sendErr) throw sendErr;
      setMessages((prev) => [...prev, msg]);
      setInputValue('');
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }
      // Focus the textarea after sending
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Fetch peer name after conversation is loaded
  useEffect(() => {
    if (!conversation || !user) return;
    let peerId = null;
    if (Array.isArray(conversation.participant_ids)) {
      peerId = conversation.participant_ids.find((id: string) => id !== user.id);
    }
    if (!peerId) return;
    // Fetch peer user record from users table
    supabase
      .from('users')
      .select('display_name')
      .eq('id', peerId)
      .single()
      .then(({ data, error }) => {
        if (data && data.display_name) {
          setPeerName(data.display_name);
        } else {
          setPeerName('Peer');
        }
      });
  }, [conversation, user]);

  useEffect(() => {
    if (!sending) {
      inputRef.current?.focus();
    }
  }, [sending]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Link to="/inbox" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all">Back to Inbox</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-gray-900 flex flex-col">
      <Navigation />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-0px)] px-4 py-6">
          <div className="flex flex-col flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            {/* Header (static, always visible) */}
            <div className="flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-t-2xl p-6"
              >
                <div className="flex items-center space-x-4">
                  <Link to="/inbox" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{peerName}</h1>
                      <p className="text-sm text-gray-500 dark:text-gray-300">Chat with your matched peer</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            {/* Messages area (scrollable, framed by header and input) */}
            <div className="flex-1 overflow-y-auto px-0">
              <div className="flex flex-col min-h-[300px] p-6 space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.sender_id === user?.id
                      ? 'order-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : 'order-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'} rounded-2xl px-4 py-3`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {/* Input bar (static, always visible) */}
            <div className="flex-shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-gray-100 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-900 rounded-b-2xl">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  rows={1}
                  className="flex-1 resize-none border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 text-sm"
                  placeholder="Type your message..."
                  disabled={sending}
                  style={{ minHeight: 40 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
                  disabled={sending || !inputValue.trim()}
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 