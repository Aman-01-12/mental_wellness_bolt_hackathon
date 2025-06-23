import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService, type ChatMessage } from '../services/aiService';
import { emotionService, type EmotionAnalysis } from '../services/emotionService';

interface ChatHookMessage extends ChatMessage {
  id: string;
  timestamp: Date;
  isTyping?: boolean;
  emotionAnalysis?: EmotionAnalysis;
}

interface UseChatReturn {
  messages: ChatHookMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<EmotionAnalysis | null>;
  clearChat: () => void;
  isTyping: boolean;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatHookMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatHookMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm here to listen and support you with advanced AI-powered emotional understanding. How are you feeling today? Feel free to share whatever is on your mind - I use Claude's sophisticated analysis to truly understand your emotions. 💙",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<EmotionAnalysis | null> => {
    if (!content.trim() || isLoading) return null;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage: ChatHookMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Analyze emotion with Claude - NO FALLBACK
      console.log('🧠 Starting Claude emotion analysis...');
      const emotionAnalysis = await emotionService.analyzeEmotion(content);
      console.log('✅ Claude emotion analysis complete:', emotionAnalysis);
      
      // Update user message with emotion analysis
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, emotionAnalysis }
          : msg
      ));

      // Show typing indicator
      setIsTyping(true);
      const typingMessage: ChatHookMessage = {
        id: 'typing',
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true
      };
      setMessages(prev => [...prev, typingMessage]);

      // Prepare conversation history for AI with emotion context
      const conversationHistory: ChatMessage[] = messages
        .filter(msg => !msg.isTyping)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add the new user message with detailed emotion context for AI
      const emotionContext = `
[ADVANCED EMOTION ANALYSIS by Claude AI:
- Primary Emotion: ${emotionAnalysis.primary_emotion} (${Math.round(emotionAnalysis.confidence * 100)}% confidence)
- Emotional Intensity: ${emotionAnalysis.context_analysis?.intensity ? Math.round(emotionAnalysis.context_analysis.intensity * 100) + '%' : 'Unknown'}
- Emotional Tone: ${emotionAnalysis.context_analysis?.tone || 'Unknown'}
- Mental Health Indicators:
  * Anxiety Level: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.anxiety_level)} (${Math.round(emotionAnalysis.mental_health_indicators.anxiety_level * 100)}%)
  * Depression Level: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.depression_level)} (${Math.round(emotionAnalysis.mental_health_indicators.depression_level * 100)}%)
  * Stress Level: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.stress_level)} (${Math.round(emotionAnalysis.mental_health_indicators.stress_level * 100)}%)
  * Positive Sentiment: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.positive_sentiment)} (${Math.round(emotionAnalysis.mental_health_indicators.positive_sentiment * 100)}%)
- Underlying Themes: ${emotionAnalysis.context_analysis?.underlying_themes?.join(', ') || 'None detected'}
- Emotional Complexity: ${emotionAnalysis.context_analysis?.emotional_complexity || 'Unknown'}]`;

      const userMessageWithContext = {
        role: 'user' as const,
        content: `${content.trim()}\n\n${emotionContext}`
      };

      conversationHistory.push(userMessageWithContext);

      // Get AI response with comprehensive emotion-aware context
      console.log('🤖 Getting AI response with emotion context...');
      const aiResponse = await aiService.sendMessage(conversationHistory);

      // Remove typing indicator and add AI response
      setIsTyping(false);
      const assistantMessage: ChatHookMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => prev.filter(msg => !msg.isTyping).concat(assistantMessage));

      // Return emotion analysis for assessment triggering
      return emotionAnalysis;

    } catch (err) {
      setIsTyping(false);
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ChatHookMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble with the emotion analysis or response generation right now. This might be due to API connectivity issues. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorChatMessage]);

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setIsTyping(false);
    
    // Add welcome message back
    const welcomeMessage: ChatHookMessage = {
      id: 'welcome-new',
      role: 'assistant',
      content: "Hello! I'm here to listen and support you with advanced AI-powered emotional understanding. How are you feeling today? Feel free to share whatever is on your mind - I use Claude's sophisticated analysis to truly understand your emotions. 💙",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    isTyping
  };
}