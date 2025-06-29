import { create } from 'zustand';

interface Ticket {
  id: string;
  user_id: string;
  // Add other fields as needed
}

interface TicketsState {
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  clear: () => void;
}

export const useTicketsStore = create<TicketsState>((set) => ({
  tickets: [],
  setTickets: (tickets) => set({ tickets }),
  clear: () => set({ tickets: [] }),
})); 