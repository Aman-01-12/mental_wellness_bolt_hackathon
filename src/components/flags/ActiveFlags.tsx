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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
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
    if (initialized && user?.id) {
      fetchTickets();
    } else if (initialized && !user) {
      setLoading(false);
      setError('Please sign in to view support requests');
    }
  }, [user?.id, initialized]);

  useEffect(() => {
    applyFilters();
  }, [filters, allTickets]);

  // Helper: Wait for session to be ready, retry up to 5 times
  const getSessionWithRetry = async (retries = 5, delay = 400): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) return session;
      await new Promise(res => setTimeout(res, delay));
    }
    return null;
  };

  const fetchTickets = async () => {
    if (!user?.id) {
      setError('Please sign in to view support requests');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🎫 Starting ticket fetch process...');
      
      // Wait for session to be ready, retry if needed
      const session = await getSessionWithRetry();
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
      setAllTickets(rawTickets);
      
      console.log('🎉 All tickets stored:', rawTickets.length);
      
    } catch (err: any) {
      console.error('❌ Error fetching tickets:', err);
      setError(err.message || 'Something went wrong while fetching tickets');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    console.log('🔍 Applying filters to', allTickets.length, 'tickets');
    
    let filteredTickets = [...allTickets];

    // Filter out user's own tickets
    const beforeOwnFilter = filteredTickets.length;
    filteredTickets = filteredTickets.filter((ticket: Ticket) => {
      const isOwnTicket = ticket.user_id === user?.id;
      return !isOwnTicket;
    });
    console.log(`🚫 After filtering out own tickets: ${beforeOwnFilter} -> ${filteredTickets.length}`);

    // Apply emotional state filter
    if (filters.emotional_state) {
      const beforeEmotionFilter = filteredTickets.length;
      filteredTickets = filteredTickets.filter((ticket: Ticket) => 
        ticket.emotional_state === filters.emotional_state
      );
      console.log(`😊 After emotion filter: ${beforeEmotionFilter} -> ${filteredTickets.length}`);
    }

    // Apply need tag filter
    if (filters.need_tag) {
      const beforeNeedFilter = filteredTickets.length;
      filteredTickets = filteredTickets.filter((ticket: Ticket) => 
        ticket.need_tags?.includes(filters.need_tag)
      );
      console.log(`🏷️ After need filter: ${beforeNeedFilter} -> ${filteredTickets.length}`);
    }

    // Apply age range filter
    if (filters.age_range) {
      const beforeAgeFilter = filteredTickets.length;
      filteredTickets = filteredTickets.filter((ticket: Ticket) => 
        ticket.age_range === filters.age_range
      );
      console.log(`👥 After age filter: ${beforeAgeFilter} -> ${filteredTickets.length}`);
    }

    // Apply search filter
    if (filters.search) {
      const beforeSearchFilter = filteredTickets.length;
      const searchLower = filters.search.toLowerCase();
      filteredTickets = filteredTickets.filter((ticket: Ticket) => 
        ticket.display_name?.toLowerCase().includes(searchLower) ||
        ticket.emotional_state?.toLowerCase().includes(searchLower) ||
        ticket.need_tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (typeof ticket.details === 'string' && ticket.details.toLowerCase().includes(searchLower))
      );
      console.log(`🔍 After search filter: ${beforeSearchFilter} -> ${filteredTickets.length}`);
    }

    console.log('🎉 Final filtered tickets:', filteredTickets.length);
    setTickets(filteredTickets);
  };

  const clearFilters = () => {
    setFilters({
      emotional_state: '',
      need_tag: '',
      age_range: '',
      search: ''
    });
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated or session is missing
  if (!user || error?.includes('sign in')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">You need to be signed in to view support requests.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center space-x-4 p-6 border-b border-gray-100">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Active Support Requests</h1>
                <p className="text-sm text-gray-500">Find people who need support right now</p>
              </div>
            </div>
            <div className="flex-1 flex justify-end space-x-3">
              <button
                onClick={fetchTickets}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Filter Support Requests</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Emotional State Filter */}
              <select
                value={filters.emotional_state}
                onChange={(e) => setFilters(prev => ({ ...prev, emotional_state: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Search: "{filters.search}"
                  </span>
                )}
                {filters.emotional_state && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                    Emotion: {filters.emotional_state}
                  </span>
                )}
                {filters.need_tag && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-800">
                    Need: {filters.need_tag}
                  </span>
                )}
                {filters.age_range && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
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
                <p className="text-gray-500 mt-4">Loading support requests...</p>
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
            ) : allTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold">No support requests in the database</p>
                <p className="text-sm mb-4">Be the first to create a support request</p>
                <Link
                  to="/peer-matching"
                  className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  Create Support Request
                </Link>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-lg font-semibold">No support requests match your filters</p>
                    <p className="text-sm mb-4">Try adjusting your search criteria</p>
                    <button
                      onClick={clearFilters}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold">No support requests available for you</p>
                    <p className="text-sm mb-4">All current requests are your own or check back soon</p>
                    <Link
                      to="/peer-matching"
                      className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
                    >
                      Create Support Request
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    {tickets.length} support request{tickets.length !== 1 ? 's' : ''} found
                    {allTickets.length > tickets.length && (
                      <span className="text-gray-400"> (filtered from {allTickets.length} total)</span>
                    )}
                  </p>
                </div>

                <div className="grid gap-4">
                  {tickets.map(ticket => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-semibold text-gray-900 text-lg">
                              {ticket.display_name || 'Anonymous'}
                            </span>
                            {ticket.age_range && (
                              <span className="text-xs bg-primary-100 text-primary-700 rounded-full px-3 py-1">
                                {ticket.age_range}
                              </span>
                            )}
                            <span className="text-xs bg-secondary-100 text-secondary-700 rounded-full px-3 py-1">
                              {ticket.emotional_state}
                            </span>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {getTimeAgo(ticket.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {ticket.need_tags && ticket.need_tags.map(tag => (
                              <span key={tag} className="text-xs bg-accent-100 text-accent-700 rounded-full px-3 py-1">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          {ticket.details && (
                            <p className="text-sm text-gray-700 mb-4">
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
        className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm disabled:opacity-60"
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