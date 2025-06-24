import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService, type ChatMessage } from '../services/aiService';
import { emotionService, type EmotionAnalysis } from '../services/emotionService';
import { useAuthStore } from '../store/authStore';

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
  const { user } = useAuthStore();

  // Initialize with a gentle, natural welcome message
  useEffect(() => {
    const welcomeMessage: ChatHookMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! I'm Alex 😊 What's on your mind today?",
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
      // Analyze emotion with Qwen
      console.log('🧠 Starting Qwen emotion analysis...');
      const emotionAnalysis = await emotionService.analyzeEmotion(content);
      console.log('✅ Qwen emotion analysis complete:', emotionAnalysis);
      
      // Update user message with emotion analysis
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, emotionAnalysis }
          : msg
      ));

      // Show typing indicator with natural timing (shorter for distressed users)
      const isDistressed = emotionAnalysis.mental_health_indicators.anxiety_level > 0.6 ||
                          emotionAnalysis.mental_health_indicators.depression_level > 0.6 ||
                          emotionAnalysis.mental_health_indicators.stress_level > 0.7;
      
      setIsTyping(true);
      const typingMessage: ChatHookMessage = {
        id: 'typing',
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true
      };
      setMessages(prev => [...prev, typingMessage]);

      // Shorter delay for distressed users, longer for casual chat
      const typingDelay = isDistressed ? 600 + Math.random() * 800 : 800 + Math.random() * 1200;
      await new Promise(resolve => setTimeout(resolve, typingDelay));

      // Prepare conversation history for AI
      const conversationHistory: ChatMessage[] = messages
        .filter(msg => !msg.isTyping)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add the new user message with emotion context for AI
      const emotionContext = `
[ADVANCED EMOTION ANALYSIS by Qwen AI:
- Primary Emotion: ${emotionAnalysis.primary_emotion} (${Math.round(emotionAnalysis.confidence * 100)}% confidence)
- Emotional Intensity: ${emotionAnalysis.context_analysis?.intensity ? Math.round(emotionAnalysis.context_analysis.intensity * 100) + '%' : 'Unknown'}
- Emotional Tone: ${emotionAnalysis.context_analysis?.tone || 'Unknown'}
- Mental Health Indicators:
  * Anxiety Level: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.anxiety_level)} (${Math.round(emotionAnalysis.mental_health_indicators.anxiety_level * 100)}%)
  * Depression Level: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.depression_level)} (${Math.round(emotionAnalysis.mental_health_indicators.depression_level * 100)}%)
  * Stress Level: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.stress_level)} (${Math.round(emotionAnalysis.mental_health_indicators.stress_level * 100)}%)
  * Positive Sentiment: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.positive_sentiment)} (${Math.round(emotionAnalysis.mental_health_indicators.positive_sentiment * 100)}%)
- Underlying Themes: ${emotionAnalysis.context_analysis?.underlying_themes?.join(', ') || 'None detected'}]`;

      const userMessageWithContext = {
        role: 'user' as const,
        content: `${content.trim()}\n\n${emotionContext}`
      };

      conversationHistory.push(userMessageWithContext);

      // Get AI response with user ID for style adaptation
      console.log('🤖 Getting gentle, adaptive Gemini AI response...');
      const aiResponse = await aiService.sendMessage(conversationHistory, user?.id);

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
      
      // Add a gentle, natural error message
      const errorChatMessage: ChatHookMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I'm having some trouble right now. Can you try again? I'm still here 💙",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorChatMessage]);

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, user?.id]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setIsTyping(false);
    
    // Reset AI's understanding of user style for fresh start
    if (user?.id) {
      aiService.resetUserStyle(user.id);
    }
    
    // Add welcome message back with a fresh greeting
    const welcomeMessage: ChatHookMessage = {
      id: 'welcome-new',
      role: 'assistant',
      content: "Hey again! 😊 Fresh start. What's going on?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user?.id]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    isTyping
  };
}