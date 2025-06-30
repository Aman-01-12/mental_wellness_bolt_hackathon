import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, ArrowLeft, Users, Filter, Search, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

const EMOTIONAL_STATES = [
  'Anxious', 'Sad', 'Stressed', 'Angry', 'Lonely', 'Overwhelmed', 'Confused', 'Hopeful', 'Excited', 'Happy', 'Grateful', 'Frustrated', 'Tired', 'Worried', 'Other'
];

const NEED_TAGS = [
  'Listener', 'Advice', 'Gossip', 'Rant', 'Vent', 'Spill Tea', 'Just Vibe', 'Need Hype',
  'Support', 'Empathy', 'Motivation', 'Fun', 'Chill', 'Problem Solving', 'Encouragement'
];

const AGE_RANGES = [
  '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
];

interface Ticket {
  id: string;
  display_name: string;
  age_range: string | null;
  emotional_state: string;
  need_tags: string[];
  details: any;
  user_id: string;
  created_at: string;
  status: string;
}

export function ActiveFlags() {
  const { user, profile, initialized } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]); // Raw tickets from fetch
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]); // Tickets after filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    emotional_state: '',
    need_tag: '',
    age_range: '',
    search: ''
  });

  useEffect(() => {
    // Only fetch tickets if auth is initialized and user is authenticated
    if (!initialized || !user?.id) return;
    const timeout = setTimeout(() => {
      fetchTickets();
    }, 200); // debounce for stability
    return () => clearTimeout(timeout);
  }, [user?.id, initialized]);

  const fetchTickets = async () => {
    if (!initialized || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      console.log('🎫 Starting ticket fetch process...');
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication session found. Please sign in again.');
      }

      console.log('🔐 Auth token exists');

      // Call the Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const url = `${supabaseUrl}/functions/v1/list-tickets`;
      console.log('📡 Calling Edge Function:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status} error` };
        }
        
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📡 Raw response length:', responseText.length);

      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error('Invalid response format from server');
      }

      console.log('✅ Parsed result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tickets');
      }

      // Store all tickets for filtering
      const rawTickets = result.tickets || [];
      setTickets(rawTickets);
      
      console.log('🎉 All tickets stored:', rawTickets.length);
      
    } catch (err: any) {
      console.error('❌ Error fetching tickets:', err);
      setError(err.message || 'Something went wrong while fetching tickets');
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets after fetch and when filters/user.id change
  useEffect(() => {
    if (!tickets.length || !user?.id) {
      setFilteredTickets([]);
      return;
    }
    let filtered = [...tickets];
    // Filter out user's own tickets
    filtered = filtered.filter((ticket: Ticket) => ticket.user_id !== user.id);
    if (filters.emotional_state) {
      filtered = filtered.filter((ticket: Ticket) => ticket.emotional_state === filters.emotional_state);
    }
    if (filters.need_tag) {
      filtered = filtered.filter((ticket: Ticket) => ticket.need_tags?.includes(filters.need_tag));
    }
    if (filters.age_range) {
      filtered = filtered.filter((ticket: Ticket) => ticket.age_range === filters.age_range);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((ticket: Ticket) =>
        ticket.display_name?.toLowerCase().includes(searchLower) ||
        ticket.emotional_state?.toLowerCase().includes(searchLower) ||
        ticket.need_tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (typeof ticket.details === 'string' && ticket.details.toLowerCase().includes(searchLower))
      );
    }
    setFilteredTickets(filtered);
  }, [tickets, filters, user?.id]);

  // Restore filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('filters-active-flags');
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save filters to localStorage on change
  useEffect(() => {
    localStorage.setItem('filters-active-flags', JSON.stringify(filters));
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      emotional_state: '',
      need_tag: '',
      age_range: '',
      search: ''
    });
    localStorage.removeItem('filters-active-flags');
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const hasActiveFilters = filters.emotional_state || filters.need_tag || filters.age_range || filters.search;

  // Show loading if auth is not initialized yet
  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#112218] dark:bg-[#18125c]">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="rounded-3xl shadow-sm p-12 text-center bg-white dark:bg-gray-900">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600 dark:text-gray-100">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated or session is missing
  if (!user || error?.includes('sign in')) {
    return (
      <div className="min-h-screen bg-[#112218] dark:bg-[#18125c]">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="rounded-3xl shadow-sm p-12 text-center bg-white dark:bg-gray-900">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-200" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Sign In Required</h2>
            <p className="text-gray-600 dark:text-gray-100 mb-6">You need to be signed in to view support requests.</p>
            <Link
              to="/auth"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl shadow-sm overflow-hidden bg-white dark:bg-gray-900"
        >
          {/* Header */}
          <div className="flex items-center space-x-4 p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Active Support Requests</h1>
                <p className="text-sm text-gray-500 dark:text-gray-100">Find people who need support right now</p>
              </div>
            </div>
            <div className="flex-1 flex justify-end space-x-3">
              <button
                onClick={fetchTickets}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                disabled={loading}
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              <Link
                to="/peer-matching"
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-sm"
              >
                Create Request
              </Link>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-100" />
              <h3 className="font-medium text-gray-900 dark:text-white">Filter Support Requests</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-100" />
                <input
                  type="text"
                  placeholder="Search by keywords..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors dark:text-white dark:bg-transparent"
                />
              </div>

              {/* Emotional State Filter */}
              <select
                value={filters.emotional_state}
                onChange={(e) => setFilters(prev => ({ ...prev, emotional_state: e.target.value }))}
                className="px-3 py-2 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors dark:text-white dark:bg-transparent"
              >
                <option value="">All Emotional States</option>
                {EMOTIONAL_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              {/* Support Type Filter */}
              <select
                value={filters.need_tag}
                onChange={(e) => setFilters(prev => ({ ...prev, need_tag: e.target.value }))}
                className="px-3 py-2 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors dark:text-white dark:bg-transparent"
              >
                <option value="">All Support Types</option>
                {NEED_TAGS.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              {/* Age Range Filter */}
              <select
                value={filters.age_range}
                onChange={(e) => setFilters(prev => ({ ...prev, age_range: e.target.value }))}
                className="px-3 py-2 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors dark:text-white dark:bg-transparent"
              >
                <option value="">All Age Ranges</option>
                {AGE_RANGES.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-100">
                    Search: "{filters.search}"
                  </span>
                )}
                {filters.emotional_state && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-500">
                    Emotion: {filters.emotional_state}
                  </span>
                )}
                {filters.need_tag && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-100">
                    Need: {filters.need_tag}
                  </span>
                )}
                {filters.age_range && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-100">
                    Age: {filters.age_range}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="large" />
                <p className="text-gray-600 dark:text-gray-100 mt-4">Loading support requests...</p>
              </div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 rounded-xl p-4 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium mb-2">Error loading requests</p>
                <p className="text-sm mb-4">{error}</p>
                <button
                  onClick={fetchTickets}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Try Again
                </button>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-100">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-500 dark:text-gray-100" />
                <p className="text-lg font-semibold">No support requests found</p>
                <p className="text-sm mb-4">Try adjusting your filters or check back later.</p>
                <Link
                  to="/peer-matching"
                  className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  Create Support Request
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-100">
                    {filteredTickets.length} support request{filteredTickets.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                <div className="grid gap-4">
                  {filteredTickets.map(ticket => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-100 dark:border-gray-700 rounded-2xl p-6 hover:shadow-md transition-all bg-white dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-semibold text-gray-900 dark:text-white text-lg">
                              {ticket.display_name || 'Anonymous'}
                            </span>
                            {ticket.age_range && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-100 rounded-full px-3 py-1">
                                {ticket.age_range}
                              </span>
                            )}
                            <span className="text-xs bg-primary-100 text-primary-500 rounded-full px-3 py-1">
                              {ticket.emotional_state}
                            </span>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-100">
                              <Clock className="w-3 h-3 mr-1" />
                              {getTimeAgo(ticket.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {ticket.need_tags && ticket.need_tags.map(tag => (
                              <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-100 rounded-full px-3 py-1">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          {ticket.details && (
                            <p className="text-sm text-gray-600 dark:text-gray-100 mb-4">
                              {typeof ticket.details === 'string' ? ticket.details : JSON.stringify(ticket.details)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <RequestToConnectButton ticketId={ticket.id} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function RequestToConnectButton({ ticketId }: { ticketId: string }) {
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [requested, setRequested] = React.useState(false);

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated. Please sign in again.');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Supabase URL not configured');
      
      // Call Edge Function to create match request
      const response = await fetch(`${supabaseUrl}/functions/v1/create-match-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          ticket_id: ticketId,
          requester_display_name: profile?.display_name || 'Anonymous',
          requester_need_tags: [] // Could be enhanced to include user's needs
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { 
          errorData = JSON.parse(errorText); 
        } catch { 
          errorData = { error: errorText }; 
        }
        throw new Error(errorData.error || `HTTP ${response.status} error`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create match request');
      }
      
      setSuccess(true);
      setRequested(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  if (requested) {
    return <div className="text-green-600 text-sm font-medium">Request sent successfully!</div>;
  }

  return (
    <div className="mt-3">
      <button
        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm disabled:opacity-60"
        onClick={handleRequest}
        disabled={loading}
      >
        {loading ? 'Sending Request...' : 'Request to Connect'}
      </button>
      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}
      {success && (
        <div className="mt-2 text-green-600 text-sm">Request sent successfully!</div>
      )}
    </div>
  );
}