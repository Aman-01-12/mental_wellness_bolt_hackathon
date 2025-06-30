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
import { useForm } from 'react-hook-form';

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

interface PeerSupportFormData {
  display_name: string;
  age_range: string;
  emotional_state: string;
  need_tags: string[];
  details: string;
}

const AGE_RANGES = [
  '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
];
const NEED_TAGS = [
  'Listener', 'Advice', 'Gossip', 'Rant', 'Vent', 'Spill Tea', 'Just Vibe', 'Need Hype',
  'Support', 'Empathy', 'Motivation', 'Fun', 'Chill', 'Problem Solving', 'Encouragement'
];
const EMOTIONAL_STATES = [
  'Anxious', 'Sad', 'Stressed', 'Angry', 'Lonely', 'Overwhelmed', 'Confused', 'Hopeful', 'Excited', 'Happy', 'Grateful', 'Frustrated', 'Tired', 'Worried', 'Other'
];

function AssessmentModal({ open, onClose, onPeerSupport, analysis }: { open: boolean; onClose: () => void; onPeerSupport: () => void; analysis: BatchAnalysisResult | null }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);
  if (!open || !analysis) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div ref={cardRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full">
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

function PeerSupportFormModal({ open, onClose, onSuccess, userProfile }: { open: boolean; onClose: () => void; onSuccess: () => void; userProfile: any }) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<PeerSupportFormData>({
    defaultValues: {
      display_name: userProfile?.display_name || '',
      age_range: userProfile?.age_range || '',
      emotional_state: '',
      need_tags: [],
      details: '',
    }
  });
  const selectedTags = watch('need_tags') || [];
  const [error, setError] = React.useState<string | null>(null);
  const onSubmit = async (data: any) => {
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated. Please sign in again.');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Supabase URL not configured');
      const response = await fetch(`${supabaseUrl}/functions/v1/create-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          display_name: data.display_name || 'Anonymous',
          age_range: data.age_range || null,
          emotional_state: data.emotional_state,
          need_tags: data.need_tags,
          details: data.details || null
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
        throw new Error(errorData.error || `HTTP ${response.status} error`);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create support request');
    }
  };
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto sm:p-8 p-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Request Peer Support</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Display Name (Optional)</label>
            <input {...register('display_name')} type="text" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="How would you like to be called? (can be anonymous)" autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Age Range <span className="text-error-500">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AGE_RANGES.map((range) => (
                <label key={range} className="cursor-pointer">
                  <input {...register('age_range', { required: 'Please select your age range' })} type="radio" value={range} className="sr-only peer" />
                  <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-center hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-gray-800 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <span className="text-sm font-medium">{range}</span>
                  </div>
                </label>
              ))}
            </div>
            {errors.age_range && <p className="mt-1 text-sm text-error-500">{errors.age_range.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Emotional State <span className="text-error-500">*</span></label>
            <select {...register('emotional_state', { required: 'Please select your current emotional state' })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" defaultValue="">
              <option value="" disabled>Select your current emotional state</option>
              {EMOTIONAL_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.emotional_state && <p className="mt-1 text-sm text-error-500">{errors.emotional_state.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">What do you need right now? <span className="text-error-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {NEED_TAGS.map((tag) => (
                <button type="button" key={tag} onClick={() => {
                  const current: string[] = selectedTags;
                  if (current.includes(tag)) {
                    setValue('need_tags', current.filter((t) => t !== tag));
                  } else {
                    setValue('need_tags', [...current, tag]);
                  }
                }}
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${selectedTags.includes(tag) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700'}`}
                  aria-pressed={selectedTags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length === 0 && <p className="mt-1 text-sm text-error-500">Please select at least one need</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Anything else you'd like to share? (Optional)</label>
            <textarea {...register('details')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" rows={2} placeholder="Share any context, preferences, or boundaries (optional)" />
          </div>
          {error && <div className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-xl p-2 text-sm">{error}</div>}
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 disabled:opacity-60" disabled={isSubmitting || selectedTags.length === 0}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </form>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showContinuousAnalysis, setShowContinuousAnalysis] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const [typingDelay, setTypingDelay] = useState(0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [lastBatchIndex, setLastBatchIndex] = useState(0);
  const [batchAnalysis, setBatchAnalysis] = useState<BatchAnalysisResult | null>(null);
  const [forceAssessment, setForceAssessment] = useState(false);
  const [showPeerSupportForm, setShowPeerSupportForm] = useState(false);
  const [peerSupportSuccess, setPeerSupportSuccess] = useState(false);
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  const [latestAnalysisMessage, setLatestAnalysisMessage] = useState<Message | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const { user, profile } = useAuthStore();
  const aiName = profile?.ai_companion_name?.trim() || 'Alex';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef?.current?.focus();
  }, [inputRef]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Hey there! I'm ${aiName} 😊 What's on your mind today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [aiName]);

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

  // Fetch chat history on mount and subscribe to realtime updates for analysis only
  useEffect(() => {
    let channel: any = null;
    async function fetchHistoryAndSubscribe() {
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
        setMessages(loadedMessages.filter(m => m.message_type !== 'analysis').length > 0
          ? loadedMessages.filter(m => m.message_type !== 'analysis')
          : [{
              id: 'welcome',
              role: 'assistant',
              content: `Hey there! I'm ${aiName} 😊 What's on your mind today?`,
              timestamp: new Date(),
            }]
        );
        // Set the latest analysis message from history
        const lastAnalysis = loadedMessages.filter(m => m.message_type === 'analysis').slice(-1)[0] || null;
        setLatestAnalysisMessage(lastAnalysis);
        // --- Realtime subscription for analysis only ---
        channel = supabase
          .channel(`ai-chat-messages-${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              if (payload.new.message_type === 'analysis') {
                setLatestAnalysisMessage({
                  id: payload.new.id,
                  role: (payload.new.sender_role === 'user' || payload.new.sender_role === 'assistant')
                    ? payload.new.sender_role
                    : (payload.new.sender_id === user.id ? 'user' : 'assistant'),
                  content: payload.new.content,
                  timestamp: new Date(payload.new.timestamp),
                  isTyping: false,
                  sender_role: payload.new.sender_role,
                  message_type: payload.new.message_type,
                  emotion_analysis: payload.new.emotion_analysis,
                });
              }
            }
          )
          .subscribe();
      } catch (err: any) {
        setHistoryError(err.message || 'Failed to load chat history');
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistoryAndSubscribe();
    return () => {
      if (channel) channel.unsubscribe();
    };
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
      const aiResponseRaw = await aiService.sendMessage(messages
        .filter(msg => !msg.isTyping)
        .map(msg => ({ role: msg.role, content: msg.content })).concat({ role: 'user', content: message }));
      // Remove '[Emotion Analysis]' from the AI response if present
      const aiResponse = aiResponseRaw.replace(/\[Emotion Analysis\]/g, '').trim();
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
      setIsLoading(false);
      // --- Per-message emotion analysis ---
      if (user?.id) {
        setAnalysisLoading(true);
        const analysis = await aiService.analyzeMessage({
          message,
          conversationHistory,
          context: { userBaseline },
        });
        // Store analysis in Supabase as a message
        const aiConversationId = await getOrCreateAIConversationId(user.id);
        const { data: inserted, error: insertError } = await supabase.from('messages').insert({
          conversation_id: aiConversationId,
          sender_id: user.id,
          content: '[Emotion Analysis]',
          message_type: 'analysis',
          sender_role: 'assistant',
          emotion_analysis: analysis,
        }).select().single();
        if (inserted) {
          setLatestAnalysisMessage({
            id: inserted.id,
            role: 'assistant',
            content: '[Emotion Analysis]',
            timestamp: new Date(inserted.timestamp),
            isTyping: false,
            sender_role: 'assistant',
            message_type: 'analysis',
            emotion_analysis: analysis,
          });
        }
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
        setAnalysisLoading(false);
      }
      // Focus the textarea after sending
      inputRef.current?.focus();
    } catch (err: any) {
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
      setAnalysisLoading(false);
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
      content: `Hey again! 😊 Fresh start. What's going on?`,
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
    setShowPeerSupportForm(true);
  };

  useEffect(() => {
    if (showEmotionModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showEmotionModal]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  return (
    <>
      {/* Navigation bar (always at top) */}
      <Navigation />
      {/* Assessment Modal */}
      <AssessmentModal open={showAssessment || forceAssessment} onClose={handleContinueWithAI} onPeerSupport={handlePeerSupport} analysis={batchAnalysis} />
      {/* Peer Support Form Modal */}
      <PeerSupportFormModal open={showPeerSupportForm} onClose={() => setShowPeerSupportForm(false)} onSuccess={() => { setShowPeerSupportForm(false); setPeerSupportSuccess(true); }} userProfile={profile} />
      {/* Emotional Analysis Modal */}
      <AnimatePresence>
        {showEmotionModal && latestAnalysisMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full relative max-h-[80vh] overflow-y-auto">
              <button onClick={() => setShowEmotionModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex flex-col items-center">
                <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-full p-2 flex items-center shadow-sm mb-4">
                  <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-200">Emotional Analysis</span>
                </div>
                <div className="w-full max-h-[70vh] overflow-y-auto">
                  {(() => {
                    const analysis = latestAnalysisMessage.emotion_analysis || {};
                    const primaryEmotion = analysis.emotional_state_analysis?.primary_emotion || 'Unknown';
                    const riskLevel = analysis.risk_assessment?.mental_health_risk_level || 'Unknown';
                    return (
                      <>
                        <div className="mb-1 text-sm text-gray-900 dark:text-gray-100"><strong>Primary Emotion:</strong> {primaryEmotion}</div>
                        <div className="mb-1 text-sm text-gray-900 dark:text-gray-100"><strong>Risk Level:</strong> {riskLevel}</div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600 dark:text-blue-300 text-xs">Show full analysis</summary>
                          <pre className="whitespace-pre-wrap text-xs mt-1 bg-gray-50 dark:bg-gray-900 rounded p-2 border border-gray-100 dark:border-gray-800 overflow-x-auto text-gray-800 dark:text-gray-200 max-h-[40vh] overflow-y-auto">{JSON.stringify(analysis, null, 2)}</pre>
                        </details>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Success message */}
      {peerSupportSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Request Submitted!</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">You will be matched with a peer soon.</p>
            <button onClick={() => setPeerSupportSuccess(false)} className="mt-4 px-4 py-2 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600">Close</button>
          </div>
        </div>
      )}
      {/* Chat page frame (below navigation) */}
      <div className="flex flex-col bg-white dark:bg-gray-900" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Chat header (Alex, avatar, back button) */}
        <div className="flex-shrink-0">
          <div className="flex items-center p-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <Link to="/" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-2">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <span className="ml-3 font-semibold text-lg text-gray-900 dark:text-gray-100">{aiName}</span>
            <div className="ml-auto flex items-center">
              <button onClick={() => setShowEmotionModal(true)}>
                <InformationCircleIcon className="w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200" />
              </button>
              {/* Peer Support Button */}
              <button onClick={handleFindPeerSupport} className="ml-4 px-3 py-1 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 flex items-center"><Heart className="w-4 h-4 mr-1" />Get Peer Support</button>
            </div>
          </div>
        </div>

        {/* Chat area (scrollable) */}
        <div className="flex-1 overflow-y-auto px-2 bg-white dark:bg-gray-900" style={{ minHeight: 0 }}>
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((message, idx) => {
                // Filter out analysis messages and '[Emotion Analysis]' placeholders
                if (message.message_type === 'analysis' || message.content === '[Emotion Analysis]') return null;
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
                              ? 'bg-pink-500 text-white rounded-br-md dark:bg-gray-800 dark:text-gray-100'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
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
          <form onSubmit={handleSubmit} className="flex items-center px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <textarea
              ref={inputRef}
              className="flex-1 resize-none border-none outline-none bg-transparent px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 text-base min-h-[36px] max-h-[120px]"
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