import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Users, Bot, X, Heart, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { emotionService, type EmotionAnalysis } from '../../services/emotionService';

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
    } else {
      onFindPeerSupport();
    }
    onClose();
  };

  return (
    <AnimatePresence>
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
    </AnimatePresence>
  );
}