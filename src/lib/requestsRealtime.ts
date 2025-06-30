import { supabase } from './supabase';

let channel: any = null;

export function startMatchRequestsRealtime(userTicketIds: string[], onNewMatchRequest: (req: any) => void) {
  if (channel) stopMatchRequestsRealtime();
  channel = supabase
    .channel('match-requests-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'match_requests',
      },
      (payload) => {
        if (payload.new && userTicketIds.includes(payload.new.ticket_id)) {
          onNewMatchRequest(payload.new);
        }
      }
    )
    .subscribe();
}

export function stopMatchRequestsRealtime() {
  if (channel) {
    channel.unsubscribe();
    channel = null;
  }
} 