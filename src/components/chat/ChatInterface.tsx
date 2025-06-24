import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowLeft, Send, RotateCcw, AlertCircle, Heart, Brain, TrendingUp, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { useChat } from '../../hooks/useChat';
import { useEmotionalAssessment } from '../../hooks/useEmotionalAssessment';
import { useContinuousEmotionAnalysis } from '../../hooks/useContinuousEmotionAnalysis';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { emotionService } from '../../services/emotionService';
import { EmotionInsights } from './EmotionInsights';
import { EmotionAssessmentModal } from './EmotionAssessmentModal';
import { ContinuousEmotionDashboard } from './ContinuousEmotionDashboard';

export function ChatInterface() {
  const navigate = useNavigate();
  const { messages, isLoading, error, sendMessage, clearChat, isTyping } = useChat();
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
  
  const [inputValue, setInputValue] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [showContinuousAnalysis, setShowContinuousAnalysis] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    const currentTime = new Date();
    
    // Calculate response delay
    const responseDelay = lastMessageTime ? currentTime.getTime() - lastMessageTime.getTime() : undefined;
    
    setInputValue('');
    setLastMessageTime(currentTime);
    
    try {
      // Send message and get basic emotion analysis
      const emotionAnalysis = await sendMessage(message);
      
      // Perform continuous emotion analysis
      if (showContinuousAnalysis) {
        await analyzeMessage(message, responseDelay);
      }
      
      // Trigger emotional assessment if needed
      if (emotionAnalysis) {
        triggerAssessment(emotionAnalysis);
      }
    } catch (error) {
      console.error('Error in message handling:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearChat = () => {
    clearChat();
    resetAssessmentHistory();
    resetAnalysis();
    setLastMessageTime(null);
  };

  const handleContinueWithAI = () => {
    dismissAssessment();
  };

  const handleFindPeerSupport = () => {
    dismissAssessment();
    navigate('/peer-matching');
  };

  // Get the latest user message with emotion analysis for insights
  const latestUserMessage = messages
    .filter(msg => msg.role === 'user' && msg.emotionAnalysis)
    .slice(-1)[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      <Navigation />
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex gap-6">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
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
                    {isTyping && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                      <span>Alex</span>
                      <Sparkles className="w-4 h-4 text-primary-500" />
                    </h1>
                    <p className="text-sm text-gray-500">
                      {isTyping ? 'Thinking...' : isAnalyzing ? 'Understanding your emotions...' : 'Your gentle AI companion • Adapts to you'}
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
                  <TrendingUp className="w-4 h-4" />
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
                  <Brain className="w-4 h-4" />
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
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Alex</span>
                          {message.isTyping && (
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.isTyping ? (
                          <div className="flex items-center space-x-2">
                            <LoadingSpinner size="small" />
                            <span className="text-sm">Thinking about what you shared...</span>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        
                        {message.emotionAnalysis && (
                          <div className={`flex items-center space-x-1 text-xs ${emotionService.getEmotionColor(message.emotionAnalysis.primary_emotion)}`}>
                            <span>{emotionService.getEmotionEmoji(message.emotionAnalysis.primary_emotion)}</span>
                            <span className="capitalize">{message.emotionAnalysis.primary_emotion}</span>
                            <span className="text-gray-400">
                              ({Math.round(message.emotionAnalysis.confidence * 100)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mb-4 p-3 bg-error-50 border border-error-200 rounded-xl flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0" />
                <p className="text-sm text-error-700">{error}</p>
              </motion.div>
            )}

            {/* Input Form */}
            <div className="border-t border-gray-100 p-6">
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share what's on your mind... Alex keeps responses gentle and easy to read 💙"
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
                  disabled={!inputValue.trim() || isLoading || isAnalyzing}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading || isAnalyzing ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send</span>
                </motion.button>
              </form>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                Press Enter to send, Shift+Enter for new line. Alex adapts to your style and keeps things gentle when you're upset.
              </p>
            </div>
          </div>

          {/* Support Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Need immediate help?</h3>
                <p className="text-xs text-gray-600 mt-1">
                  If you're in crisis, please contact emergency services (911) or a mental health crisis line immediately.
                </p>
              </div>
            </div>
          </motion.div>
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

      {/* Emotion Assessment Modal */}
      {shouldShowAssessment && currentAssessment && assessmentType && (
        <EmotionAssessmentModal
          isOpen={shouldShowAssessment}
          onClose={dismissAssessment}
          emotionAnalysis={currentAssessment}
          assessmentType={assessmentType}
          onContinueWithAI={handleContinueWithAI}
          onFindPeerSupport={handleFindPeerSupport}
        />
      )}
    </div>
  );
}