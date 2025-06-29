import { supabase } from './supabase';
import { useInboxStore } from '../store/inboxStore';

export async function refetchInboxConversations(userId: string) {
  const { data: conversationsData, error: conversationsError } = await supabase
    .from('conversations')
    .select(`
      id,
      participant_ids,
      type,
      started_at,
      status
    `)
    .contains('participant_ids', [userId])
    .eq('status', 'active')
    .order('started_at', { ascending: false });

  if (conversationsError) throw conversationsError;

  const conversationsWithMessages = await Promise.all(
    (conversationsData || []).map(async (conversation) => {
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('id, content, timestamp, sender_id, conversation_id')
        .eq('conversation_id', conversation.id)
        .order('timestamp', { ascending: false })
        .limit(1);
      return {
        ...conversation,
        latest_message: latestMessages && latestMessages.length > 0 ? latestMessages[0] : undefined
      };
    })
  );
  useInboxStore.getState().setConversations(conversationsWithMessages);
} 