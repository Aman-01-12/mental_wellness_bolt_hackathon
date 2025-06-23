import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowRight, Shield, Users, Bot } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-6"
      >
        <Heart className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-gray-900 mb-4"
      >
        Welcome to MindSpace
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-gray-600 mb-8 max-w-md mx-auto"
      >
        We're here to support your mental wellbeing journey. Let's personalize your experience with a few quick questions.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-primary-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Privacy First</h3>
          <p className="text-sm text-gray-600">Your data is secure and anonymous</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-secondary-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Peer Support</h3>
          <p className="text-sm text-gray-600">Connect with understanding people</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bot className="w-6 h-6 text-accent-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">AI Companion</h3>
          <p className="text-sm text-gray-600">24/7 empathetic conversation</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-primary-50 rounded-2xl p-6 mb-8"
      >
        <h3 className="font-semibold text-gray-900 mb-2">What to Expect</h3>
        <ul className="text-sm text-gray-600 space-y-1 text-left max-w-sm mx-auto">
          <li>• 5-7 minutes to complete setup</li>
          <li>• All questions are optional</li>
          <li>• You can change settings anytime</li>
          <li>• Your privacy is always protected</li>
        </ul>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 px-6 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
      >
        <span>Let's Get Started</span>
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}