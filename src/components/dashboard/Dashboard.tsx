import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Users, Flag, User, MessageCircle, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Navigation } from '../ui/Navigation';

export function Dashboard() {
  const { profile } = useAuthStore();

  const quickActions = [
    {
      title: 'Chat with AI Companion',
      description: 'Get instant empathetic support anytime',
      icon: Bot,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'from-primary-50 to-primary-100',
      link: '/chat'
    },
    {
      title: 'Browse Active Flags',
      description: 'Find people who need support right now',
      icon: Flag,
      color: 'from-secondary-500 to-secondary-600',
      bgColor: 'from-secondary-50 to-secondary-100',
      link: '/active-flags'
    },
    {
      title: 'Create Support Flag',
      description: 'Let others know you need someone to talk to',
      icon: Users,
      color: 'from-accent-500 to-accent-600',
      bgColor: 'from-accent-50 to-accent-100',
      link: '/peer-matching'
    },
    {
      title: 'Inbox',
      description: 'View your peer support conversations',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      link: '/inbox'
    },
    {
      title: 'My Profile',
      description: 'Update your preferences and privacy settings',
      icon: User,
      color: 'from-success-500 to-success-600',
      bgColor: 'from-success-50 to-success-100',
      link: '/profile'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}!
            </h1>
          </div>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your mental wellness journey continues here. Choose how you'd like to connect and support others today.
          </p>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={action.link}
                  className="block bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${action.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                    {action.description}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats/Motivation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-sm"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6 text-accent-500" />
              <h2 className="text-2xl font-bold text-gray-900">Your Impact</h2>
            </div>
            <p className="text-gray-600">Every conversation matters. Here's how you're making a difference.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-success-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-sm text-gray-600">Conversations Started</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-sm text-gray-600">People Supported</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-secondary-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-sm text-gray-600">Badges Earned</div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Ready to Get Started?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Begin your journey by having a conversation with our AI companion or helping someone in need.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/chat"
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Start AI Chat
              </Link>
              <Link
                to="/active-flags"
                className="px-6 py-3 bg-white text-primary-600 rounded-xl font-medium border border-primary-200 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                Browse Flags
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}