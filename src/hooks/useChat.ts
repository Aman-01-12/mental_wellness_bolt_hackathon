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
      content: "Hello! I'm here to listen and support you. How are you feeling today? Feel free to share whatever is on your mind - I'm here to help. 💙",
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
      // Analyze emotion of user message
      const emotionAnalysis = await emotionService.analyzeEmotion(content);
      
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

      // Add the new user message with emotion context for AI
      const userMessageWithContext = {
        role: 'user' as const,
        content: `${content.trim()}\n\n[Emotion Analysis: Primary emotion detected as "${emotionAnalysis.primary_emotion}" with ${Math.round(emotionAnalysis.confidence * 100)}% confidence. Mental health indicators - Anxiety: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.anxiety_level)}, Depression: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.depression_level)}, Stress: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.stress_level)}, Positive sentiment: ${emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.positive_sentiment)}]`
      };

      conversationHistory.push(userMessageWithContext);

      // Get AI response with emotion-aware context
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
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment. If the problem persists, you might want to check your internet connection.",
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
      content: "Hello! I'm here to listen and support you. How are you feeling today? Feel free to share whatever is on your mind - I'm here to help. 💙",
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