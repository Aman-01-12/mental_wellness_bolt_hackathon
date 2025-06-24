import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Users, Bot, X, Heart, Brain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { emotionService, type EmotionAnalysis } from '../../services/emotionService';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const NEED_TAGS = [
  'Listener', 'Advice', 'Gossip', 'Rant', 'Vent', 'Spill Tea', 'Just Vibe', 'Need Hype',
  'Support', 'Empathy', 'Motivation', 'Fun', 'Chill', 'Problem Solving', 'Encouragement'
];

interface EmotionAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  emotionAnalysis: EmotionAnalysis;
  assessmentType: 'initial' | 'crisis' | 'persistent';
  onContinueWithAI: () => void;
  onFindPeerSupport: () => void;
}

export function EmotionAssessmentModal({ 
  isOpen, 
  onClose, 
  emotionAnalysis, 
  assessmentType,
  onContinueWithAI,
  onFindPeerSupport 
}: EmotionAssessmentModalProps) {
  const [selectedOption, setSelectedOption] = useState<'ai' | 'peer' | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [needTags, setNeedTags] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  if (!isOpen) return null;

  const getAssessmentContent = () => {
    const { mental_health_indicators, primary_emotion } = emotionAnalysis;
    
    switch (assessmentType) {
      case 'crisis':
        return {
          title: 'We\'re Concerned About You',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          bgColor: 'from-red-50 to-orange-50',
          description: 'Our analysis suggests you might be going through a particularly difficult time. You don\'t have to face this alone.',
          urgency: 'high'
        };
      
      case 'persistent':
        return {
          title: 'Ongoing Support Available',
          icon: Heart,
          iconColor: 'text-yellow-600',
          bgColor: 'from-yellow-50 to-orange-50',
          description: 'We\'ve noticed consistent patterns that suggest you might benefit from additional support.',
          urgency: 'medium'
        };
      
      default: // initial
        return {
          title: 'How Would You Like Support?',
          icon: Brain,
          iconColor: 'text-primary-600',
          bgColor: 'from-primary-50 to-secondary-50',
          description: `We've detected that you're feeling ${primary_emotion}. We're here to help in whatever way works best for you.`,
          urgency: 'low'
        };
    }
  };

  const content = getAssessmentContent();
  const Icon = content.icon;

  const handleOptionSelect = (option: 'ai' | 'peer') => {
    setSelectedOption(option);
    if (option === 'ai') {
      onContinueWithAI();
      onClose();
    } else {
      setShowTicketModal(true);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (needTags.includes(tag)) {
      setNeedTags(needTags.filter((t) => t !== tag));
    } else {
      setNeedTags([...needTags, tag]);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎫 Creating ticket from modal with data:', {
        display_name: profile?.display_name || 'Anonymous',
        age_range: profile?.age_range || null,
        emotional_state: emotionAnalysis.primary_emotion,
        need_tags: needTags,
        details: details || null
      });
      
      // Get the auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication session found. Please sign in again.');
      }

      // Call the Edge Function with proper URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          display_name: profile?.display_name || 'Anonymous',
          age_range: profile?.age_range || null,
          emotional_state: emotionAnalysis.primary_emotion,
          need_tags: needTags,
          details: details || null
        })
      });

      console.log('📡 Response status:', response.status);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        
        // Try to parse as JSON, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status} error` };
        }
        
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Parse response
      const responseText = await response.text();
      console.log('📡 Raw response:', responseText);

      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Response text:', responseText);
        throw new Error('Invalid response format from server');
      }

      console.log('✅ Parsed result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create ticket');
      }

      console.log('🎉 Ticket created successfully from modal:', result.ticket);
      setShowTicketModal(false);
      onClose();
      navigate('/active-flags');
      
    } catch (err: any) {
      console.error('❌ Error creating ticket from modal:', err);
      setError(err.message || 'Something went wrong while creating your ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showTicketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className={`bg-gradient-to-r ${content.bgColor} rounded-2xl p-6 mb-6`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${content.iconColor}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
                    <p className="text-sm text-gray-600">{content.description}</p>
                  </div>
                </div>

                {/* Emotion Summary */}
                <div className="bg-white/70 rounded-xl p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Primary emotion detected:</span>
                    <div className="flex items-center space-x-2">
                      <span>{emotionService.getEmotionEmoji(emotionAnalysis.primary_emotion)}</span>
                      <span className="font-semibold capitalize">{emotionAnalysis.primary_emotion}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Options */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 text-center">Choose Your Support</h3>
                
                {/* Continue with AI Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionSelect('ai')}
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl p-4 flex items-center space-x-4 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold">Continue with AI Companion</h4>
                    <p className="text-sm text-white/80">Get immediate, personalized support</p>
                  </div>
                </motion.button>

                {/* Peer Support Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionSelect('peer')}
                  className="w-full bg-white border-2 border-gray-200 text-gray-900 rounded-2xl p-4 flex items-center space-x-4 hover:border-primary-300 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-primary-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold">Connect with Peer Support</h4>
                    <p className="text-sm text-gray-600">Talk to someone who understands</p>
                  </div>
                </motion.button>
              </div>

              {/* Crisis Resources (for high urgency) */}
              {content.urgency === 'high' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Immediate Help Available</h4>
                      <p className="text-sm text-red-700 mb-2">
                        If you're having thoughts of self-harm or suicide, please reach out immediately:
                      </p>
                      <div className="space-y-1 text-sm text-red-700">
                        <div>• Emergency: 911</div>
                        <div>• Crisis Text Line: Text HOME to 741741</div>
                        <div>• National Suicide Prevention Lifeline: 988</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mental Health Indicators */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Current Wellbeing Snapshot</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-gray-600">Anxiety</div>
                    <div className="font-semibold text-gray-900">
                      {emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.anxiety_level)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Mood</div>
                    <div className="font-semibold text-gray-900">
                      {emotionService.getMentalHealthLevelDescription(1 - emotionAnalysis.mental_health_indicators.depression_level)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Stress</div>
                    <div className="font-semibold text-gray-900">
                      {emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.stress_level)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Positivity</div>
                    <div className="font-semibold text-gray-900">
                      {emotionService.getMentalHealthLevelDescription(emotionAnalysis.mental_health_indicators.positive_sentiment)}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                This assessment is AI-generated and not a substitute for professional mental health care.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Creation Modal */}
      <AnimatePresence>
        {showTicketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTicketModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative"
            >
              <button
                onClick={() => setShowTicketModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Review & Submit Help Ticket</h2>
              <p className="text-sm text-gray-600 mb-4">You can edit or add details before submitting. Only the info you consent to share will be visible to potential supporters.</p>
              <form onSubmit={handleTicketSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={profile?.display_name || 'Anonymous'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                  <input
                    type="text"
                    value={profile?.age_range || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emotional State</label>
                  <input
                    type="text"
                    value={emotionAnalysis.primary_emotion}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What do you need right now? <span className="text-error-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {NEED_TAGS.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          needTags.includes(tag)
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-primary-50'
                        }`}
                        aria-pressed={needTags.includes(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {needTags.length === 0 && (
                    <p className="mt-1 text-sm text-error-500">Please select at least one need</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anything else you'd like to share? (Optional)</label>
                  <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    rows={2}
                    placeholder="Share any context, preferences, or boundaries (optional)"
                  />
                </div>
                <div className="bg-primary-50 rounded-xl p-3 text-xs text-gray-600 mb-2">
                  By submitting, you agree to share the above information with potential peer supporters. You can withdraw your ticket at any time. Your privacy and consent are always respected.
                </div>
                {error && (
                  <div className="bg-red-100 text-red-700 rounded-xl p-3 text-sm mb-2">{error}</div>
                )}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-6 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                  disabled={loading || needTags.length === 0}
                >
                  {loading ? 'Creating Ticket...' : 'Submit Help Ticket'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}