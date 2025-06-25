import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowLeft, Send, RotateCcw, AlertCircle, Heart, Sparkles, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { aiService, type ChatMessage } from '../../services/aiService';
import { emotionService, type EmotionAnalysis } from '../../services/emotionService';
import { useEmotionalAssessment } from '../../hooks/useEmotionalAssessment';
import { EmotionAssessmentModal } from './EmotionAssessmentModal';
import { EmotionInsights } from './EmotionInsights';
import { useContinuousEmotionAnalysis } from '../../hooks/useContinuousEmotionAnalysis';
import { ContinuousEmotionDashboard } from './ContinuousEmotionDashboard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  emotionAnalysis?: EmotionAnalysis;
}

export function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showContinuousAnalysis, setShowContinuousAnalysis] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);

  // Emotional assessment hook
  const { 
    shouldShowAssessment, 
    assessmentType, 
    currentAssessment, 
    triggerAssessment, 
    dismissAssessment,
    resetAssessmentHistory 
  } = useEmotionalAssessment();

  const {
    currentAssessment: continuousAssessment,
    isAnalyzing,
    analyzeMessage,
    getEmotionalHistory,
    resetAnalysis,
    exportData
  } = useContinuousEmotionAnalysis();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    const currentTime = new Date();
    setInputValue('');
    setError(null);
    setLastMessageTime(currentTime);
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: currentTime
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: currentTime,
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      // Analyze emotion first
      setIsAnalyzingEmotion(true);
      let emotionAnalysis: EmotionAnalysis | undefined = undefined;
      try {
        emotionAnalysis = await emotionService.analyzeEmotion(message);
        setMessages(prev => prev.map(msg =>
          msg.id === userMessage.id
            ? { ...msg, emotionAnalysis: emotionAnalysis || undefined }
            : msg
        ));
        if (emotionAnalysis) {
          triggerAssessment(emotionAnalysis);
        }
      } catch (emotionError) {
        // Continue with AI response even if emotion analysis fails
      } finally {
        setIsAnalyzingEmotion(false);
      }
      // Continuous emotion analysis
      if (showContinuousAnalysis) {
        await analyzeMessage(message, lastMessageTime ? currentTime.getTime() - lastMessageTime.getTime() : undefined);
      }

      // Prepare conversation history for AI
      const conversationHistory: ChatMessage[] = messages
        .filter(msg => !msg.isTyping)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      conversationHistory.push({ role: 'user', content: message });

      // Get AI response
      const aiResponse = await aiService.sendMessage(conversationHistory);
      setIsTyping(false);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: currentTime
      };
      setMessages(prev => prev.filter(msg => !msg.isTyping).concat(assistantMessage));
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      const errorChatMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I'm having some trouble right now. Can you try again? I'm still here 💙",
        timestamp: currentTime
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
      setIsAnalyzingEmotion(false);
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
    resetAssessmentHistory();
    const welcomeMessage: Message = {
      id: 'welcome-new',
      role: 'assistant',
      content: "Hey again! 😊 Fresh start. What's going on?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const handleContinueWithAI = () => {
    dismissAssessment();
  };

  const handleFindPeerSupport = () => {
    dismissAssessment();
  };

  // Get the latest user message with emotion analysis for insights
  const latestUserMessage = messages
    .filter(msg => msg.role === 'user' && msg.emotionAnalysis)
    .slice(-1)[0];

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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center relative">
                  <Bot className="w-6 h-6 text-white" />
                  {(isTyping || isAnalyzingEmotion) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <span>Alex</span>
                    <Sparkles className="w-4 h-4 text-primary-500" />
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isAnalyzingEmotion ? 'Understanding your emotions...' :
                     isTyping ? 'Thinking...' : 
                     'Your gentle AI companion • Powered by Gemini'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowContinuousAnalysis(!showContinuousAnalysis)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                  showContinuousAnalysis 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span className="text-sm font-medium">Deep Analysis</span>
              </button>
              <button
                onClick={() => setShowInsights(!showInsights)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                  showInsights 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Insights</span>
              </button>
              <button
                onClick={handleClearChat}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm font-medium">Fresh Start</span>
              </button>
            </div>
          </div>
        </motion.div>
        <div className="flex flex-row gap-6">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages Container */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                        {message.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
              {/* Input Form */}
              <div className="border-t border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="flex space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share what's on your mind... Alex will respond with genuine care 💙"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                      rows={1}
                      style={{
                        minHeight: '48px',
                        maxHeight: '120px',
                        height: 'auto'
                      }}
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
                    disabled={!inputValue.trim() || isLoading || isAnalyzingEmotion}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {(isLoading || isAnalyzingEmotion) ? (
                      <LoadingSpinner size="small" color="white" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send</span>
                  </motion.button>
                </form>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Press Enter to send, Shift+Enter for new line. Alex analyzes your emotions to offer better support.
                </p>
              </div>
            </div>
          </div>
          {/* Sidebar for Analysis */}
          <AnimatePresence>
            {(showInsights || showContinuousAnalysis) && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="w-96 flex-shrink-0 space-y-6"
              >
                {/* Continuous Analysis Dashboard */}
                {showContinuousAnalysis && continuousAssessment && (
                  <ContinuousEmotionDashboard
                    assessment={continuousAssessment}
                    onExportData={exportData}
                    onResetAnalysis={resetAnalysis}
                  />
                )}
                {/* Basic Emotion Insights */}
                {showInsights && latestUserMessage?.emotionAnalysis && (
                  <EmotionInsights emotionAnalysis={latestUserMessage.emotionAnalysis} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 