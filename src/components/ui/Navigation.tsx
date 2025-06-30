import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Bot, Flag, Users, User, LogOut, MessageCircle, ClipboardList, Menu, X, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { profile, signOut } = useAuthStore();
  // Sync darkMode state with document class
  const getIsDark = () => typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const [darkMode, setDarkMode] = useState(getIsDark());

  useEffect(() => {
    setDarkMode(getIsDark());
  }, [location.pathname]);

  const handleToggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(getIsDark());
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/chat', label: 'AI Chat', icon: Bot },
    { path: '/active-flags', label: 'Active Flags', icon: Flag },
    { path: '/peer-matching', label: 'Get Support', icon: Users },
    { path: '/inbox', label: 'Inbox', icon: MessageCircle },
    { path: '/peer-matching?tab=my-tickets', label: 'My Requests', icon: ClipboardList },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile sidebar toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white border border-gray-200 rounded-xl p-2 shadow-md"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label="Open sidebar"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo and app name */}
        <div className="flex flex-col items-start gap-1 px-6 py-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary-700 tracking-tight">MindSpace</span>
          </div>
          <span className="text-xs font-semibold text-accent-500 flex items-center ml-10 mt-1">
            <svg className="w-3 h-3 mr-1 text-accent-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046a1 1 0 0 1 .7 1.254l-1.1 4.4h3.6a1 1 0 0 1 .8 1.6l-7 10a1 1 0 0 1-1.8-.8l1.1-4.4h-3.6a1 1 0 0 1-.8-1.6l7-10a1 1 0 0 1 .9-.354z"/></svg>
            built with bolt.new
          </span>
        </div>

        {/* Scrollable nav and actions */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          {/* Navigation links */}
          <nav className="flex flex-col gap-1 px-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-base ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-primary-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-gray-100 my-2 mx-4" />

          {/* Profile and Sign Out at the bottom */}
          <div className="flex flex-col gap-1 px-2 pb-6 mt-auto">
            <Link
              to="/profile"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-base ${
                location.pathname === '/profile'
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-primary-700'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <User className="w-5 h-5" />
              Profile
            </Link>
            {/* Appearance toggle button */}
            <button
              onClick={handleToggleDarkMode}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-base text-gray-700 hover:bg-gray-100 hover:text-primary-700"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              Appearance
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-base text-gray-700 hover:bg-gray-100 hover:text-primary-700"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
      {/* Add left margin to main content on desktop */}
      <div className="md:ml-64" />
    </>
  );
}