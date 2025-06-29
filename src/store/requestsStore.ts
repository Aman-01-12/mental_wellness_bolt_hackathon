import { create } from 'zustand';

interface Request {
  id: string;
  user_id: string;
  // Add other fields as needed
}

interface RequestsState {
  requests: Request[];
  setRequests: (reqs: Request[]) => void;
  clear: () => void;
}

export const useRequestsStore = create<RequestsState>((set) => ({
  requests: [],
  setRequests: (reqs) => set({ requests: reqs }),
  clear: () => set({ requests: [] }),
})); 