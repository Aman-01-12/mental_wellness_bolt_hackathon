import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, ArrowLeft, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

interface Ticket {
  id: string;
  display_name: string;
  age_range: string | null;
  emotional_state: string;
  need_tags: string[];
  details: any;
  user_id: string;
}

export function ActiveFlags() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🎫 Fetching tickets...');
        
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

        const response = await fetch(`${supabaseUrl}/functions/v1/list-tickets`, {
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
          throw new Error(result.error || 'Failed to fetch tickets');
        }

        setTickets(result.tickets || []);
        console.log('🎉 Tickets loaded:', result.tickets?.length || 0);
        
      } catch (err: any) {
        console.error('❌ Error fetching tickets:', err);
        setError(err.message || 'Something went wrong while fetching tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

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
              <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Active Flags</h1>
                <p className="text-sm text-gray-500">Find people who need support right now</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 rounded-xl p-3 text-sm mb-2 text-center">{error}</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2 text-primary-300" />
              <p className="text-lg font-semibold">No active help tickets right now.</p>
              <p className="text-sm">Check back soon or create a new ticket to get support.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {tickets.map(ticket => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-primary-50 to-secondary-50 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-primary-700 text-lg">{ticket.display_name || 'Anonymous'}</span>
                    {ticket.age_range && <span className="text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 ml-2">{ticket.age_range}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs bg-secondary-100 text-secondary-700 rounded-full px-2 py-0.5">{ticket.emotional_state}</span>
                    {ticket.need_tags.map(tag => (
                      <span key={tag} className="text-xs bg-accent-100 text-accent-700 rounded-full px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                  {ticket.details && ticket.details.extra && (
                    <div className="text-sm text-gray-700 mb-2">{ticket.details.extra}</div>
                  )}
                  {/* (Optional) Add request to connect button here, except for user's own tickets */}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}