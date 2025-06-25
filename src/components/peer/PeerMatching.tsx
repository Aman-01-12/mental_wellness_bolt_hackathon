import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Users, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { useAuthStore } from '../../store/authStore';
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
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // My tickets state
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [myTicketsLoading, setMyTicketsLoading] = useState(true);
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

  React.useEffect(() => {
    const fetchMyTickets = async () => {
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
        // Filter tickets to only those created by the current user
        setMyTickets((result.tickets || []).filter((t: any) => t.user_id === profile?.id));
      } catch (err: any) {
        setMyTicketsError(err.message || 'Failed to load your tickets');
      } finally {
        setMyTicketsLoading(false);
      }
    };
    if (profile?.id) fetchMyTickets();
  }, [profile?.id]);

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
      
      // Get the auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication session found. Please sign in again.');
      }

      // Call the Edge Function with proper URL
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

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        
        // Try to parse as JSON, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status} error` };
        }
        
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Parse response
      const responseText = await response.text();
      console.log('📡 Raw response:', responseText);

      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Response text:', responseText);
        throw new Error('Invalid response format from server');
      }

      console.log('✅ Parsed result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create ticket');
      }

      console.log('🎉 Ticket created successfully:', result.ticket);
      navigate('/active-flags');
      
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

          {/* My Tickets Section */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-primary-700 mb-2">My Active Flags</h2>
            {myTicketsLoading ? (
              <div className="text-gray-500 py-4">Loading your tickets...</div>
            ) : myTicketsError ? (
              <div className="bg-red-100 text-red-700 rounded-xl p-3 text-sm mb-2">{myTicketsError}</div>
            ) : myTickets.length === 0 ? (
              <div className="text-gray-500 py-4">You have no active help tickets.</div>
            ) : (
              <div className="grid gap-4">
                {myTickets.map(ticket => (
                  <div key={ticket.id} className="border border-gray-100 rounded-xl p-4 bg-gradient-to-br from-primary-50 to-secondary-50">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-primary-700">{ticket.display_name || 'Anonymous'}</span>
                      {ticket.age_range && <span className="text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 ml-2">{ticket.age_range}</span>}
                      <span className="text-xs bg-secondary-100 text-secondary-700 rounded-full px-2 py-0.5 ml-2">{ticket.emotional_state}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {ticket.need_tags && ticket.need_tags.map((tag: string) => (
                        <span key={tag} className="text-xs bg-accent-100 text-accent-700 rounded-full px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                    {ticket.details && ticket.details.extra && (
                      <div className="text-sm text-gray-700 mb-1">{ticket.details.extra}</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-medium transition-all disabled:opacity-60"
                        onClick={() => handleWithdraw(ticket.id)}
                        disabled={withdrawingId === ticket.id}
                      >
                        {withdrawingId === ticket.id ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    </div>

                    {/* Incoming Match Requests Section */}
                    <IncomingRequests ticketId={ticket.id} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-xl mx-auto">
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
              By creating a help ticket, you agree to share the above information with potential peer supporters. You can withdraw your ticket at any time. Your privacy and consent are always respected.
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
              {loading ? 'Creating Ticket...' : 'Create Help Ticket'}
            </button>
          </form>
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
  const [actionLoading, setActionLoading] = React.useState<string | null>(null); // requestId being acted on
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
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
      // Redirect to chat if accepted and conversation_id is present
      if (action === 'accept' && result.conversation_id && navigate) {
        navigate(`/chat/${result.conversation_id}`);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to process request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-primary-600 mb-1">Incoming Match Requests</h4>
      {loading ? (
        <div className="text-xs text-gray-500">Loading requests...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 rounded-xl p-2 text-xs mb-2">{error}</div>
      ) : requests.length === 0 ? (
        <div className="text-xs text-gray-500">No match requests yet.</div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2">
              <div>
                <span className="font-medium text-primary-700">{req.requester_display_name || 'Anonymous'}</span>
                {req.requester_age_range && <span className="text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 ml-2">{req.requester_age_range}</span>}
                {req.requester_emotional_state && <span className="text-xs bg-secondary-100 text-secondary-700 rounded-full px-2 py-0.5 ml-2">{req.requester_emotional_state}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-success-500 hover:bg-success-600 text-white px-3 py-1 rounded-xl text-xs font-medium transition-all disabled:opacity-60"
                  onClick={() => handleAction(req.id, 'accept')}
                  disabled={actionLoading === req.id}
                >
                  {actionLoading === req.id ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-xl text-xs font-medium transition-all disabled:opacity-60"
                  onClick={() => handleAction(req.id, 'decline')}
                  disabled={actionLoading === req.id}
                >
                  {actionLoading === req.id ? 'Declining...' : 'Decline'}
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