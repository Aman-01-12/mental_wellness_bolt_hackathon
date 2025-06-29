import { supabase } from './supabase';
import { useRequestsStore } from '../store/requestsStore';

export async function refetchRequests(userId: string) {
  const { data: requestsData, error: requestsError } = await supabase
    .from('requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (requestsError) throw requestsError;
  useRequestsStore.getState().setRequests(requestsData || []);
} 