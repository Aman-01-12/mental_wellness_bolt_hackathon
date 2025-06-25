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

  // Fetch conversation and messages
  useEffect(() => {
    const fetchConversationAndMessages = async () => {
      if (!conversationId || !user) return;
      setLoading(true);
      setError(null);
      try {
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
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/inbox" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all">Back to Inbox</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      <Navigation />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6"
        >
          <div className="flex items-center space-x-4">
            <Link to="/inbox" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Peer Chat</h1>
                <p className="text-sm text-gray-500">Chat with your matched peer</p>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Messages Container */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${msg.sender_id === user?.id ? 'order-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white' : 'order-1 bg-gray-100 text-gray-900'} rounded-2xl px-4 py-3`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs text-gray-400 block mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input Form */}
          <div className="border-t border-gray-100 p-6">
            <form onSubmit={handleSend} className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px', height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputValue.trim() || sending}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sending ? <LoadingSpinner size="small" color="white" /> : <Send className="w-4 h-4" />}
                <span>Send</span>
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 