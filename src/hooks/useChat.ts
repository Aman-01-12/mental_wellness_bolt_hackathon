import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService, type ChatMessage } from '../services/aiService';
import { useAuthStore } from '../store/authStore';

interface ChatHookMessage extends ChatMessage {
  id: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface UseChatReturn {
  messages: ChatHookMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  isTyping: boolean;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatHookMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user, profile } = useAuthStore();

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    console.log('[sendMessage] called. user:', user, 'content:', content);
    if (!content.trim() || isLoading) return;
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
      setIsTyping(true);
      const typingMessage: ChatHookMessage = {
        id: 'typing',
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true
      };
      setMessages(prev => [...prev, typingMessage]);
      const typingDelay = 800 + Math.random() * 1200;
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      const conversationHistory: ChatMessage[] = messages
        .filter(msg => !msg.isTyping)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      const userMessageForAI = {
        role: 'user' as const,
        content: content.trim()
      };
      conversationHistory.push(userMessageForAI);
      console.log('🤖 Getting personalized, gentle AI response...');
      const aiResponse = await aiService.sendMessage(conversationHistory, profile);
      setIsTyping(false);
      const assistantMessage: ChatHookMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => prev.filter(msg => !msg.isTyping).concat(assistantMessage));
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      const errorChatMessage: ChatHookMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I'm having some trouble right now. Can you try again? I'm still here 💙",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, user?.id, profile]);

  const clearChat = useCallback(async () => {
    console.log('[Chat] clearChat called');
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setIsTyping(false);
    if (profile) {
      aiService.updateUserProfile(profile);
    }
    // Add welcome message back (local only)
    const welcomeMessage: ChatHookMessage = {
      id: 'welcome-new',
      role: 'assistant',
      content: "Hey again! 😊 Fresh start. What's going on?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user?.id, profile]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    isTyping
  };
}