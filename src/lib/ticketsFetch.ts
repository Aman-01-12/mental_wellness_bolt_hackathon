import { supabase } from './supabase';
import { useTicketsStore } from '../store/ticketsStore';

export async function refetchTickets(userId: string) {
  const { data: ticketsData, error: ticketsError } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (ticketsError) throw ticketsError;
  useTicketsStore.getState().setTickets(ticketsData || []);
} 