import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Heart, Users, Bot } from 'lucide-react';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

interface CompletionStepProps {
  onComplete: () => Promise<void>;
}

export function CompletionStep({ onComplete }: CompletionStepProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error?.message || 'Unknown error');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 bg-gradient-to-br from-success-500 to-primary-500 rounded-3xl flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-gray-900 mb-4"
      >
        You're All Set! 🎉
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-gray-600 mb-8 max-w-md mx-auto"
      >
        Welcome to MindSpace! Your profile is ready and you can now start connecting with our supportive community.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 max-w-2xl mx-auto"
      >
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-2xl">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">AI Companion</h3>
          <p className="text-sm text-gray-600">Start chatting with your empathetic AI companion anytime</p>
        </div>

        <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-6 rounded-2xl">
          <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Peer Support</h3>
          <p className="text-sm text-gray-600">Connect with understanding people in similar situations</p>
        </div>

        <div className="bg-gradient-to-br from-accent-50 to-accent-100 p-6 rounded-2xl">
          <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Safe Space</h3>
          <p className="text-sm text-gray-600">Express yourself freely in a judgment-free environment</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-success-50 to-primary-50 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Sparkles className="w-5 h-5 text-success-500" />
          <h3 className="font-semibold text-gray-900">Getting Started Tips</h3>
        </div>
        <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
          <li className="flex items-start space-x-2">
            <span className="text-success-500 mt-1">•</span>
            <span>Try chatting with the AI companion first to get comfortable</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-success-500 mt-1">•</span>
            <span>Browse active flags to see who might need support</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-success-500 mt-1">•</span>
            <span>Create your own flag when you need someone to talk to</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-success-500 mt-1">•</span>
            <span>Remember: you can adjust your privacy settings anytime</span>
          </li>
        </ul>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={handleComplete}
        disabled={isCompleting}
        className="w-full bg-gradient-to-r from-success-500 to-primary-500 text-white py-4 px-6 rounded-2xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isCompleting ? (
          <LoadingSpinner size="small" color="white" />
        ) : (
          <>
            <span>Enter MindSpace</span>
            <Sparkles className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </div>
  );
}