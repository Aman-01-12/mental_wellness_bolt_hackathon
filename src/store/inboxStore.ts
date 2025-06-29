import { create } from 'zustand';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  participant_ids: string[];
  type: string;
  started_at: string;
  status: string;
  latest_message?: Message;
}

interface InboxState {
  conversations: Conversation[];
  setConversations: (convs: Conversation[]) => void;
  addOrUpdateMessage: (msg: Message) => void;
  clear: () => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  conversations: [],
  setConversations: (convs) => set({ conversations: convs }),
  addOrUpdateMessage: (msg) =>
    set((state) => {
      const idx = state.conversations.findIndex(
        (c) => c.id === msg.conversation_id
      );
      if (idx === -1) return state; // Not found, ignore
      const updated = [...state.conversations];
      updated[idx] = {
        ...updated[idx],
        latest_message: msg,
      };
      return { conversations: updated };
    }),
  clear: () => set({ conversations: [] }),
})); 