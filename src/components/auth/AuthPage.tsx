import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Users, Bot } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          <div className="flex items-center justify-center lg:justify-start mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mr-3">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MindSpace</h1>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Your Safe Haven for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
              {' '}Mental Wellbeing
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            Connect with understanding peers, chat with an empathetic AI companion, 
            and find support in a privacy-first, anonymous environment designed for your emotional wellness.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Privacy First</h3>
                <p className="text-sm text-gray-600">Anonymous & secure</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-secondary-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Peer Support</h3>
                <p className="text-sm text-gray-600">Connect with others</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Bot className="w-5 h-5 text-accent-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">AI Companion</h3>
                <p className="text-sm text-gray-600">24/7 emotional support</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Heart className="w-5 h-5 text-error-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Crisis Support</h3>
                <p className="text-sm text-gray-600">Immediate help available</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            <motion.div
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isLogin ? <LoginForm /> : <SignUpForm />}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}