import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Heart, Clock, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

const AGE_RANGES = [
  '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
];

const NEED_TAGS = [
  'Listener', 'Advice', 'Gossip', 'Rant', 'Vent', 'Spill Tea', 'Just Vibe', 'Need Hype',
  'Support', 'Empathy', 'Motivation', 'Fun', 'Chill', 'Problem Solving', 'Encouragement'
];

const EMOTIONAL_STATES = [
  'Anxious', 'Sad', 'Stressed', 'Angry', 'Lonely', 'Overwhelmed', 'Confused', 'Hopeful', 'Excited', 'Happy', 'Grateful', 'Frustrated', 'Tired', 'Worried', 'Other'
];

interface FormData {
  display_name: string;
  age_range: string;
  emotional_state: string;
  need_tags: string[];
  details: string;
}

export function PeerMatching() {
  const navigate = useNavigate();
  const { profile, initialized } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'create' | 'my-tickets'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // My tickets state
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [myTicketsLoading, setMyTicketsLoading] = useState(false);
  const [myTicketsError, setMyTicketsError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      display_name: profile?.display_name || '',
      age_range: profile?.age_range || '',
      emotional_state: '',
      need_tags: [],
      details: '',
    }
  });

  const selectedTags = watch('need_tags') || [];

  // Fetch my tickets when tab changes
  useEffect(() => {
    if (activeTab === 'my-tickets' && profile?.id && initialized) {
      fetchMyTickets();
    }
  }, [activeTab, profile?.id, initialized]);

  // Restore active tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem('peer-matching-tab');
    if (savedTab === 'create' || savedTab === 'my-tickets') {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to localStorage on change
  useEffect(() => {
    localStorage.setItem('peer-matching-tab', activeTab);
  }, [activeTab]);

  // Restore form state from localStorage on mount
  useEffect(() => {
    const savedForm = localStorage.getItem('peer-matching-form');
    if (savedForm) {
      try {
        const values = JSON.parse(savedForm);
        Object.entries(values).forEach(([key, value]) => {
          setValue(key as any, value);
        });
      } catch {}
    }
  }, [setValue]);

  // Save form state to localStorage on change
  useEffect(() => {
    const subscription = watch((values) => {
      localStorage.setItem('peer-matching-form', JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const fetchMyTickets = async () => {
    if (!profile?.id || !initialized) return;
    setMyTicketsLoading(true);
    setMyTicketsError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated. Please sign in again.');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Supabase URL not configured');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/list-tickets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
        throw new Error(errorData.error || `HTTP ${response.status} error`);
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch tickets');

      // Filter to only user's own tickets
      setMyTickets((result.tickets || []).filter((t: any) => t.user_id === profile?.id));
    } catch (err: any) {
      setMyTicketsError(err.message || 'Failed to load your tickets');
    } finally {
      setMyTicketsLoading(false);
    }
  };

  const handleWithdraw = async (ticketId: string) => {
    setWithdrawingId(ticketId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated. Please sign in again.');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Supabase URL not configured');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/withdraw-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ ticket_id: ticketId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
        throw new Error(errorData.error || `HTTP ${response.status} error`);
      }

      // Remove withdrawn ticket from state
      setMyTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw ticket');
    } finally {
      setWithdrawingId(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎫 Creating ticket with data:', data);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication session found. Please sign in again.');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          display_name: data.display_name || 'Anonymous',
          age_range: data.age_range || null,
          emotional_state: data.emotional_state,
          need_tags: data.need_tags,
          details: data.details || null
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status} error` };
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create ticket');
      }

      console.log('🎉 Ticket created successfully:', result.ticket);
      
      // Switch to my-tickets tab to show the created ticket
      setActiveTab('my-tickets');
      
      localStorage.removeItem('peer-matching-form');
    } catch (err: any) {
      console.error('❌ Error creating ticket:', err);
      setError(err.message || 'Something went wrong while creating your ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    const current = selectedTags;
    if (current.includes(tag)) {
      setValue('need_tags', current.filter((t) => t !== tag));
    } else {
      setValue('need_tags', [...current, tag]);
    }
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

  // Show loading if auth is not initialized yet
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
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
              <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Support Requests</h1>
                <p className="text-sm text-gray-500">Create and manage your support requests</p>
              </div>
            </div>
            <div className="flex-1 flex justify-end">
              <Link
                to="/active-flags"
                className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-sm"
              >
                Browse All Requests
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'create'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Request Support</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'my-tickets'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <User className="w-4 h-4" />
                <span>My Requests</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Create Tab */}
            {activeTab === 'create' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Support</h2>
                  <p className="text-gray-600">Let others know how they can help you today</p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Name (Optional)</label>
                  <input
                    {...register('display_name')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="How would you like to be called? (can be anonymous)"
                    autoComplete="off"
                  />
                </div>

                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age Range <span className="text-error-500">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {AGE_RANGES.map((range) => (
                      <label key={range} className="cursor-pointer">
                        <input
                          {...register('age_range', { required: 'Please select your age range' })}
                          type="radio"
                          value={range}
                          className="sr-only peer"
                        />
                        <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                          <span className="text-sm font-medium">{range}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.age_range && (
                    <p className="mt-1 text-sm text-error-500">{errors.age_range.message as string}</p>
                  )}
                </div>

                {/* Emotional State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emotional State <span className="text-error-500">*</span></label>
                  <select
                    {...register('emotional_state', { required: 'Please select your current emotional state' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    defaultValue=""
                  >
                    <option value="" disabled>Select your current emotional state</option>
                    {EMOTIONAL_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.emotional_state && (
                    <p className="mt-1 text-sm text-error-500">{errors.emotional_state.message as string}</p>
                  )}
                </div>

                {/* Need Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What do you need right now? <span className="text-error-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {NEED_TAGS.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          selectedTags.includes(tag)
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-primary-50'
                        }`}
                        aria-pressed={selectedTags.includes(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {selectedTags.length === 0 && (
                    <p className="mt-1 text-sm text-error-500">Please select at least one need</p>
                  )}
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Anything else you'd like to share? (Optional)</label>
                  <textarea
                    {...register('details')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    rows={3}
                    placeholder="Share any context, preferences, or boundaries (optional)"
                  />
                </div>

                {/* Privacy/Consent Notice */}
                <div className="bg-primary-50 rounded-xl p-4 text-xs text-gray-600 mb-2">
                  By creating a support request, you agree to share the above information with potential peer supporters. You can withdraw your request at any time. Your privacy and consent are always respected.
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-100 text-red-700 rounded-xl p-3 text-sm mb-2">{error}</div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 px-6 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                  disabled={loading || selectedTags.length === 0}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="small" color="white" />
                      <span>Creating Request...</span>
                    </>
                  ) : (
                    'Create Support Request'
                  )}
                </button>
              </form>
            )}

            {/* My Tickets Tab */}
            {activeTab === 'my-tickets' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">My Support Requests</h2>
                  <p className="text-gray-600">Manage your active requests and incoming connections</p>
                </div>

                {myTicketsLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="large" />
                    <p className="text-gray-500 ml-4">Loading your requests...</p>
                  </div>
                ) : myTicketsError ? (
                  <div className="bg-red-100 text-red-700 rounded-xl p-4 text-center">{myTicketsError}</div>
                ) : myTickets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-semibold">No active support requests</p>
                    <p className="text-sm mb-4">Create a request to connect with supportive peers</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
                    >
                      Create Support Request
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {myTickets.map(ticket => (
                      <div key={ticket.id} className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-primary-50 to-secondary-50">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-semibold text-primary-700 text-lg">
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
                              {ticket.need_tags && ticket.need_tags.map((tag: string) => (
                                <span key={tag} className="text-xs bg-accent-100 text-accent-700 rounded-full px-3 py-1">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            
                            {ticket.details && (
                              <p className="text-sm text-gray-700 mb-4">{ticket.details}</p>
                            )}
                          </div>
                          
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 flex items-center space-x-2"
                            onClick={() => handleWithdraw(ticket.id)}
                            disabled={withdrawingId === ticket.id}
                          >
                            {withdrawingId === ticket.id ? (
                              <>
                                <LoadingSpinner size="small" color="white" />
                                <span>Withdrawing...</span>
                              </>
                            ) : (
                              'Withdraw'
                            )}
                          </button>
                        </div>

                        {/* Incoming Match Requests Section */}
                        <IncomingRequests ticketId={ticket.id} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function IncomingRequests({ ticketId }: { ticketId: string }) {
  const navigate = useNavigate();
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ticketId) return;
    // Add global auth state check
    const { user, initialized } = useAuthStore.getState();
    if (!user?.id || !initialized) return;
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Not authenticated. Please sign in again.');
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) throw new Error('Supabase URL not configured');
        
        const response = await fetch(`${supabaseUrl}/functions/v1/list-match-requests?ticket_id=${ticketId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
          throw new Error(errorData.error || `HTTP ${response.status} error`);
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch match requests');
        setRequests(result.requests || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load match requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [ticketId]);

  const handleAction = async (requestId: string, action: 'accept' | 'decline') => {
    setActionLoading(requestId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated. Please sign in again.');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Supabase URL not configured');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/${action}-match-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ request_id: requestId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
        throw new Error(errorData.error || `HTTP ${response.status} error`);
      }

      const result = await response.json();
      setActionSuccess(action === 'accept' ? 'Accepted!' : 'Declined');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      
      // Redirect to inbox (not AI chat) if accepted
      if (action === 'accept') {
        navigate('/inbox');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to process request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-primary-600 mb-3">Incoming Connection Requests</h4>
      {loading ? (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <LoadingSpinner size="small" color="gray" />
          <span>Loading requests...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 rounded-xl p-3 text-xs">{error}</div>
      ) : requests.length === 0 ? (
        <div className="text-xs text-gray-500">No connection requests yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-primary-700">
                    {req.requester_display_name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500">wants to connect</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(req.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-success-500 hover:bg-success-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-60 flex items-center space-x-1"
                  onClick={() => handleAction(req.id, 'accept')}
                  disabled={actionLoading === req.id}
                >
                  {actionLoading === req.id ? (
                    <>
                      <LoadingSpinner size="small" color="white" />
                      <span>Accepting...</span>
                    </>
                  ) : (
                    'Accept'
                  )}
                </button>
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-60 flex items-center space-x-1"
                  onClick={() => handleAction(req.id, 'decline')}
                  disabled={actionLoading === req.id}
                >
                  {actionLoading === req.id ? (
                    <>
                      <LoadingSpinner size="small" color="gray" />
                      <span>Declining...</span>
                    </>
                  ) : (
                    'Decline'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {actionError && <div className="bg-red-100 text-red-700 rounded-xl p-2 text-xs mt-2">{actionError}</div>}
      {actionSuccess && <div className="text-green-600 text-xs mt-2">{actionSuccess}</div>}
    </div>
  );
}