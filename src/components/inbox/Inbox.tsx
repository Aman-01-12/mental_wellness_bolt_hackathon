import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft, Users, Clock, Send, MoreVertical, Smile, Paperclip, Phone, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

interface Conversation {
  id: string;
  participant_ids: string[];
  type: string;
  started_at: string;
  status: string;
  last_message?: {
    content: string;
    timestamp: string;
    sender_id: string;
  };
  other_participant?: {
    display_name: string;
    id: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  message_type: string;
}

export function Inbox() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Update conversation's last message
          setConversations(prev => prev.map(conv => 
            conv.id === selectedConversation.id 
              ? {
                  ...conv,
                  last_message: {
                    content: newMessage.content,
                    timestamp: newMessage.timestamp,
                    sender_id: newMessage.sender_id
                  }
                }
              : conv
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch conversations where user is a participant
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_ids,
          type,
          started_at,
          status
        `)
        .contains('participant_ids', [user!.id])
        .eq('type', 'peer')
        .order('started_at', { ascending: false });

      if (convError) throw convError;

      // For each conversation, get the other participant's info and last message
      const enrichedConversations = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherParticipantId = conv.participant_ids.find(id => id !== user!.id);
          
          // Get other participant's display name
          let otherParticipant = { display_name: 'Anonymous', id: otherParticipantId };
          if (otherParticipantId) {
            const { data: userData } = await supabase
              .from('users')
              .select('display_name')
              .eq('id', otherParticipantId)
              .maybeSingle();
            
            if (userData) {
              otherParticipant = {
                display_name: userData.display_name || 'Anonymous',
                id: otherParticipantId
              };
            }
          }

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('content, timestamp, sender_id')
            .eq('conversation_id', conv.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            other_participant: otherParticipant,
            last_message: lastMessageData || undefined
          };
        })
      );

      setConversations(enrichedConversations);
      
      // Auto-select the first conversation if none is selected
      if (enrichedConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(enrichedConversations[0]);
      }
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    
    try {
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (msgError) throw msgError;

      setMessages(messagesData || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: messageContent,
          message_type: 'text'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Message will be added via real-time subscription
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      setNewMessage(messageContent); // Restore message on error
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden"
          style={{ height: 'calc(100vh - 8rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
                  <p className="text-sm text-gray-500">Your peer support conversations</p>
                </div>
              </div>
            </div>
            <Link
              to="/peer-matching"
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-sm"
            >
              New Request
            </Link>
          </div>

          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="font-semibold text-gray-900">Messages</h2>
                <p className="text-xs text-gray-500 mt-1">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="medium" />
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-red-600 text-sm">{error}</div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium mb-2">No conversations yet</p>
                    <p className="text-xs text-gray-400 mb-4">
                      Accept connection requests to start chatting
                    </p>
                    <Link
                      to="/peer-matching"
                      className="inline-block text-xs text-primary-600 hover:text-primary-700 font-medium bg-primary-50 px-3 py-2 rounded-lg"
                    >
                      Create Support Request →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full text-left p-4 rounded-xl transition-all hover:bg-white ${
                          selectedConversation?.id === conversation.id 
                            ? 'bg-white shadow-sm border border-primary-200' 
                            : 'hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 truncate">
                                {conversation.other_participant?.display_name || 'Anonymous'}
                              </span>
                              {conversation.last_message && (
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {getTimeAgo(conversation.last_message.timestamp)}
                                </span>
                              )}
                            </div>
                            {conversation.last_message ? (
                              <p className="text-sm text-gray-600 truncate">
                                {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                                {conversation.last_message.content}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No messages yet</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.other_participant?.display_name || 'Anonymous'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Peer Support • Active now
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <Video className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner size="medium" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-semibold mb-2">Start the conversation!</p>
                        <p className="text-sm text-gray-400 mb-6">
                          Send a message to begin your peer support chat
                        </p>
                        <div className="max-w-md mx-auto p-4 bg-primary-50 rounded-xl border border-primary-200">
                          <p className="text-xs text-primary-700">
                            💡 <strong>Tip:</strong> Be kind, respectful, and supportive. Remember that both of you are here to help each other.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => {
                          const isOwn = message.sender_id === user?.id;
                          const showTimestamp = index === 0 || 
                            new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000; // 5 minutes
                          
                          return (
                            <div key={message.id}>
                              {showTimestamp && (
                                <div className="text-center my-6">
                                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                                    {formatMessageTime(message.timestamp)}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                                  isOwn
                                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                                    : 'bg-white text-gray-900 border border-gray-100'
                                }`}>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                  <p className={`text-xs mt-2 ${
                                    isOwn ? 'text-white/70' : 'text-gray-500'
                                  }`}>
                                    {new Date(message.timestamp).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input - Instagram Style */}
                  <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-end space-x-3">
                      {/* Attachment Button */}
                      <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                        <Paperclip className="w-5 h-5" />
                      </button>

                      {/* Message Input Container */}
                      <div className="flex-1 relative">
                        <div className="flex items-end bg-gray-100 rounded-3xl px-4 py-2">
                          <textarea
                            ref={messageInputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Message..."
                            className="flex-1 bg-transparent border-none outline-none resize-none text-sm placeholder-gray-500 py-2"
                            rows={1}
                            style={{
                              minHeight: '20px',
                              maxHeight: '100px',
                              height: 'auto'
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
                            }}
                            disabled={sendingMessage}
                          />
                          
                          {/* Emoji Button */}
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-2">
                            <Smile className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Send Button */}
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className={`p-3 rounded-full transition-all ${
                          newMessage.trim() && !sendingMessage
                            ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {sendingMessage ? (
                          <LoadingSpinner size="small" color={newMessage.trim() ? "white" : "gray"} />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    {/* Character Count and Tips */}
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Press Enter to send, Shift+Enter for new line</span>
                      <span className={newMessage.length > 900 ? 'text-orange-500' : ''}>
                        {newMessage.length}/1000
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                    <p className="text-xl font-semibold mb-2">Your Messages</p>
                    <p className="text-sm text-gray-400 mb-8 max-w-sm">
                      Select a conversation from the sidebar to start chatting with your peer support connections
                    </p>
                    {conversations.length === 0 && (
                      <Link
                        to="/peer-matching"
                        className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                      >
                        Create Support Request
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}