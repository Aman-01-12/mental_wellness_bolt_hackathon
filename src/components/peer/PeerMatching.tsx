import React from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';

export function PeerMatching() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Get Support</h1>
                <p className="text-sm text-gray-500">Create a flag to connect with peers</p>
              </div>
            </div>
          </div>

          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-100 to-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-accent-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Peer Matching</h2>
            <p className="text-gray-600">This component will be implemented with peer matching functionality</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}