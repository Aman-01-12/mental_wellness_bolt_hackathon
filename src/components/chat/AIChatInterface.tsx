import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowLeft, Send, RotateCcw, AlertCircle, Heart, Sparkles, Brain, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { aiService, type ChatMessage } from '../../services/aiService';
import { FaceSmileIcon, PaperAirplaneIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  sender_role?: 'user' | 'assistant';
  message_type?: string;
  emotion_analysis?: any;
}

interface BatchAnalysisResult {
  crisis: boolean;
  emotions: string[];
  summary: string;
  raw: string;
}

function AssessmentModal({ open, onClose, onPeerSupport, analysis }: { open: boolean; onClose: () => void; onPeerSupport: () => void; analysis: BatchAnalysisResult | null }) {
  if (!open || !analysis) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold mb-2">Emotional Assessment</h2>
        <p className="mb-4">{analysis.summary}</p>
        {analysis.crisis && (
          <div className="mb-4 text-red-600 font-semibold flex items-center"><AlertCircle className="w-5 h-5 mr-2" />Crisis or urgent risk detected!</div>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600">Continue with AI</button>
          <button onClick={onPeerSupport} className="flex-1 py-2 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600">Get Peer Support</button>
        </div>
      </div>
    </div>
  );
}

export function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messagesEndRef, setMessagesEndRef] = useState<React.RefObject<HTMLDivElement> | null>(null);
  const [inputRef, setInputRef] = useState<React.RefObject<HTMLTextAreaElement> | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showContinuousAnalysis, setShowContinuousAnalysis] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const [typingDelay, setTypingDelay] = useState(0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [lastBatchIndex, setLastBatchIndex] = useState(0);
  const [batchAnalysis, setBatchAnalysis] = useState<BatchAnalysisResult | null>(null);
  const [forceAssessment, setForceAssessment] = useState(false);

  const { user } = useAuthStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesEndRef]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef?.current?.focus();
  }, [inputRef]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! I'm Alex 😊 What's on your mind today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Helper to get or create the AI conversation for the current user
  async function getOrCreateAIConversationId(userId: string): Promise<string> {
    // Always fetch the oldest existing AI conversation for this user
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', [userId])
      .eq('type', 'ai')
      .order('started_at', { ascending: true })
      .limit(1);
    if (fetchError) throw fetchError;
    if (existing && existing.length > 0 && existing[0].id) return existing[0].id;
    // Only create if none exist
    try {
      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert({ participant_ids: [userId], type: 'ai' })
        .select('id')
        .single();
      if (createError || !created?.id) throw createError || new Error('Failed to create conversation');
      return created.id;
    } catch (e: any) {
      // If unique constraint violation, re-query and return the existing conversation
      if (e.code === '23505' || (e.message && e.message.includes('duplicate key value'))) {
        const { data: retry, error: retryError } = await supabase
          .from('conversations')
          .select('id')
          .contains('participant_ids', [userId])
          .eq('type', 'ai')
          .order('started_at', { ascending: true })
          .limit(1);
        if (retryError || !retry || retry.length === 0) throw retryError || new Error('Failed to fetch existing conversation after unique violation');
        return retry[0].id;
      }
      throw e;
    }
  }

  // Fetch chat history on mount
  useEffect(() => {
    async function fetchHistory() {
      if (!user?.id) return;
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        const conversationId = await getOrCreateAIConversationId(user.id);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true });
        if (error) throw error;
        const loadedMessages: Message[] = (data || []).map((msg: any) => ({
          id: msg.id,
          role: (msg.sender_role === 'user' || msg.sender_role === 'assistant')
            ? msg.sender_role
            : (msg.sender_id === user.id ? 'user' : 'assistant'),
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          isTyping: false,
          sender_role: msg.sender_role,
          message_type: msg.message_type,
          emotion_analysis: msg.emotion_analysis,
        }));
        setMessages(loadedMessages.length > 0 ? loadedMessages : [{
          id: 'welcome',
          role: 'assistant',
          content: "Hey there! I'm Alex 😊 What's on your mind today?",
          timestamp: new Date(),
        }]);
      } catch (err: any) {
        setHistoryError(err.message || 'Failed to load chat history');
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Example user baseline context (replace with real user data if available)
  const userBaseline = {
    typicalEmotions: ['neutral'],
    communicationStyle: 'casual',
    averageResponseTime: 1000,
  };

  // Send user message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    setError(null);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);
    // Store user message in Supabase
    if (user?.id) {
      await aiService.sendAIChatMessage({ userId: user.id, content: message, role: 'user' });
    }
    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);
    try {
      // Prepare conversation history for AI
      const conversationHistory = messages
        .filter(msg => !msg.isTyping)
        .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n');
      // Get AI response
      const aiResponse = await aiService.sendMessage(messages
        .filter(msg => !msg.isTyping)
        .map(msg => ({ role: msg.role, content: msg.content })).concat({ role: 'user', content: message }));
      // Simulate typing delay
      const delay = Math.min(Math.max(aiResponse.length * 30, 1000), 4000);
      setTypingDelay(delay);
      await new Promise(resolve => setTimeout(resolve, delay));
      setIsTyping(false);
      setMessages(prev => prev.filter(msg => !msg.isTyping).concat({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      }));
      // Store assistant message in Supabase
      if (user?.id) {
        await aiService.sendAIChatMessage({ userId: user.id, content: aiResponse, role: 'assistant' });
      }
      // --- Per-message emotion analysis ---
      if (user?.id) {
        const analysis = await aiService.analyzeMessage({
          message,
          conversationHistory,
          context: { userBaseline },
        });
        // Store analysis in Supabase as a message
        const aiConversationId = await getOrCreateAIConversationId(user.id);
        await supabase.from('messages').insert({
          conversation_id: aiConversationId,
          sender_id: user.id,
          content: '[Emotion Analysis]',
          message_type: 'analysis',
          sender_role: 'assistant',
          emotion_analysis: analysis,
        });
        // Show modal if risk is high/critical or on first message
        if (
          analysis?.['Risk Assessment']?.['mental health risk level'] === 'high' ||
          analysis?.['Risk Assessment']?.['mental health risk level'] === 'critical' ||
          messages.filter(m => m.role === 'user').length === 0
        ) {
          setBatchAnalysis({
            crisis: analysis?.['Risk Assessment']?.['mental health risk level'] === 'high' || analysis?.['Risk Assessment']?.['mental health risk level'] === 'critical',
            emotions: [analysis?.['Emotional State Analysis']?.['Primary emotion']].filter(Boolean),
            summary: analysis?.['Risk Assessment']?.['mental health risk level'] ? `Risk: ${analysis['Risk Assessment']['mental health risk level']}` : 'See analysis',
            raw: JSON.stringify(analysis, null, 2),
          });
          setShowAssessment(true);
        }
      }
      inputRef?.current?.focus();
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      const errorChatMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I'm having some trouble right now. Can you try again? I'm still here 💙",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    const welcomeMessage: Message = {
      id: 'welcome-new',
      role: 'assistant',
      content: "Hey again! 😊 Fresh start. What's going on?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  // Helper: get only user messages
  const userMessages = messages.filter(m => m.role === 'user');

  // Peer support button handler
  const handleFindPeerSupport = () => {
    setForceAssessment(true);
    setBatchAnalysis({
      crisis: false,
      emotions: [],
      summary: 'Would you like to get matched with a peer for support?',
      raw: '',
    });
    setShowAssessment(true);
  };

  // Modal close handler
  const handleContinueWithAI = () => {
    setShowAssessment(false);
    setForceAssessment(false);
  };

  // Modal peer support handler
  const handlePeerSupport = async () => {
    setShowAssessment(false);
    setForceAssessment(false);
    // Get latest batch analysis if available
    let latestAnalysis: Message | null = null;
    const analysisMessages = messages.filter(m => m.message_type === 'analysis');
    if (analysisMessages.length > 0) {
      latestAnalysis = analysisMessages[analysisMessages.length - 1];
    }
    // Create ticket
    if (user?.id) {
      await supabase.from('tickets').insert({
        user_id: user.id,
        // If you have display_name and age_range in your user object, use them; otherwise, leave blank or fetch from profile
        display_name: (user as any).display_name || '',
        age_range: (user as any).age_range || '',
        emotional_state: latestAnalysis?.emotion_analysis?.summary || 'peer support requested',
        need_tags: ['peer_support'],
        details: latestAnalysis?.emotion_analysis || {},
        status: 'open',
      });
    }
    alert('You will be matched with a peer soon!');
  };

  // Get the latest user message with emotion analysis for insights
  const latestUserMessage = messages
    .filter(msg => msg.role === 'user')
    .slice(-1)[0];

  return (
    <>
      {/* Navigation bar (always at top) */}
      <Navigation />
      {/* Assessment Modal */}
      <AssessmentModal open={showAssessment || forceAssessment} onClose={handleContinueWithAI} onPeerSupport={handlePeerSupport} analysis={batchAnalysis} />
      {/* Chat page frame (below navigation) */}
      <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Chat header (Alex, avatar, back button) */}
        <div className="flex-shrink-0">
          <div className="flex items-center p-3 border-b border-gray-100 bg-white">
            <Link to="/" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ml-2">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <span className="ml-3 font-semibold text-lg text-gray-900">Alex</span>
            <div className="ml-auto flex items-center">
              <InformationCircleIcon className="w-6 h-6 text-gray-400 hover:text-primary-500 cursor-pointer" />
              {/* Peer Support Button */}
              <button onClick={handleFindPeerSupport} className="ml-4 px-3 py-1 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 flex items-center"><Heart className="w-4 h-4 mr-1" />Get Peer Support</button>
            </div>
          </div>
        </div>

        {/* Chat area (scrollable) */}
        <div className="flex-1 overflow-y-auto px-2" style={{ minHeight: 0 }}>
          <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((message, idx) => {
                if (message.message_type === 'analysis') {
                  // Show a special analysis card
                  const analysis = message.emotion_analysis || {};
                  // Log the analysis object for debugging
                  console.log('Emotional Analysis (raw):', analysis);
                  // Use only snake_case keys as per the new prompt
                  const primaryEmotion = analysis.emotional_state_analysis?.primary_emotion || 'Unknown';
                  const riskLevel = analysis.risk_assessment?.mental_health_risk_level || 'Unknown';
                  return (
                    <div key={message.id} className="flex justify-center my-3">
                      <div className="relative flex flex-col items-center bg-white border border-yellow-200 shadow-md rounded-2xl px-5 py-4 max-w-[70%] w-full">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-100 border border-yellow-300 rounded-full p-1 flex items-center shadow-sm">
                          <Sparkles className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-xs font-semibold text-yellow-700">Emotional Analysis</span>
                        </div>
                        <div className="mt-4 w-full">
                          <div className="mb-1 text-sm"><strong>Primary Emotion:</strong> {primaryEmotion}</div>
                          <div className="mb-1 text-sm"><strong>Risk Level:</strong> {riskLevel}</div>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-blue-600 text-xs">Show full analysis</summary>
                            <pre className="whitespace-pre-wrap text-xs mt-1 bg-gray-50 rounded p-2 border border-gray-100 overflow-x-auto">{JSON.stringify(analysis, null, 2)}</pre>
                          </details>
                        </div>
                      </div>
                    </div>
                  );
                }
                // Only render regular chat bubbles for non-analysis messages
                if (message.message_type === 'analysis') return null;
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`relative max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      {/* Only show bubble if there is content, otherwise just show typing animation */}
                      {message.isTyping && message.role === 'assistant' && !message.content ? (
                        <div className="flex items-center space-x-1 mt-1 ml-2">
                          <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                          <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        </div>
                      ) : (
                        <div
                          className={`rounded-3xl px-4 py-2 text-sm break-words ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                          style={{ borderBottomRightRadius: message.role === 'user' ? '0.75rem' : undefined, borderBottomLeftRadius: message.role === 'assistant' ? '0.75rem' : undefined }}
                        >
                          {message.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar (fixed at bottom) */}
        <div className="flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center px-3 py-2 border-t border-gray-100 bg-white">
            <button type="button" className="p-2 text-gray-400 hover:text-primary-500">
              <FaceSmileIcon className="w-6 h-6" />
            </button>
            <textarea
              ref={inputRef}
              className="flex-1 resize-none border-none outline-none bg-transparent px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-0 text-base min-h-[36px] max-h-[120px]"
              rows={1}
              placeholder="Type your message..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!user?.id || isLoading}
            />
            <button
              type="submit"
              className="ml-2 p-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!user?.id || isLoading || !inputValue.trim()}
            >
              <PaperAirplaneIcon className="w-5 h-5 rotate-90" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
} 