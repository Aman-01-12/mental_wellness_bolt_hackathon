import { supabase } from './supabase';
import { useInboxStore } from '../store/inboxStore';
import { refetchInboxConversations } from './inboxFetch';

let channel: any = null;
let userIdForRefetch: string | null = null;

export function startInboxRealtime(userId: string) {
  if (channel) stopInboxRealtime();
  userIdForRefetch = userId;
  channel = supabase
    .channel(`inbox-messages-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        useInboxStore.getState().addOrUpdateMessage(payload.new);
      }
    )
    .subscribe(async (status) => {
      if (status === 'TIMED_OUT' || status === 'CLOSED') {
        if (userIdForRefetch) {
          await refetchInboxConversations(userIdForRefetch);
        }
      }
    });
}

export function stopInboxRealtime() {
  if (channel) {
    channel.unsubscribe();
    channel = null;
  }
  userIdForRefetch = null;
} 