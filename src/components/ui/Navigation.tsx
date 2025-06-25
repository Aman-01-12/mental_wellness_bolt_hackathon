import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Home, Bot, Flag, Users, User, LogOut, Menu, X, MessageCircle, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { profile, signOut, user } = useAuthStore();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/chat', label: 'AI Chat', icon: Bot },
    { path: '/active-flags', label: 'Active Flags', icon: Flag },
    { path: '/peer-matching', label: 'Get Support', icon: Users },
    { path: '/inbox', label: 'Inbox', icon: MessageCircle },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  // Check for new accepted match requests (notifications)
  useEffect(() => {
    if (!user?.id) return;

    const checkNotifications = async () => {
      try {
        // Check for recently accepted match requests where user was the requester
        const { data: acceptedRequests } = await supabase
          .from('match_requests')
          .select(`
            id,
            status,
            created_at,
            tickets!inner(display_name, emotional_state)
          `)
          .eq('requester_id', user.id)
          .eq('status', 'accepted')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

        if (acceptedRequests && acceptedRequests.length > 0) {
          setNotifications(acceptedRequests.map(req => ({
            id: req.id,
            type: 'match_accepted',
            message: `Your connection request was accepted by ${req.tickets.display_name || 'Anonymous'}`,
            timestamp: req.created_at
          })));
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    checkNotifications();
    
    // Check every 30 seconds for new notifications
    const interval = setInterval(checkNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MindSpace</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all relative ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                    {item.path === '/inbox' && notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50"
                    >
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          {notifications.length > 0 && (
                            <button
                              onClick={clearNotifications}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No new notifications</p>
                          </div>
                        ) : (
                          <div className="space-y-1 p-2">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className="p-3 hover:bg-gray-50 rounded-xl transition-all"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <MessageCircle className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">{notification.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(notification.timestamp).toLocaleString()}
                                    </p>
                                    <Link
                                      to="/inbox"
                                      onClick={() => setShowNotifications(false)}
                                      className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1 inline-block"
                                    >
                                      View in Inbox →
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-sm text-gray-600">
                {profile?.display_name || 'Anonymous'}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 bg-white"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative ${
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.path === '/inbox' && notifications.length > 0 && (
                        <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {notifications.length}
                        </span>
                      )}
                    </Link>
                  );
                })}
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="px-4 py-2 text-sm text-gray-600">
                    {profile?.display_name || 'Anonymous'}
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  );
}