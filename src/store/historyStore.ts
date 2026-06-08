import { create } from 'zustand';

export interface HistoryItem {
  id: string;
  type: 'Normal' | 'Binomial' | 'Poisson';
  timestamp: number;
  parameters: Record<string, string | number>;
  result: number;
  mode: string;
}

interface HistoryState {
  items: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],
  addHistoryItem: (item) => set((state) => ({
    items: [
      {
        ...item,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      },
      ...state.items,
    ],
  })),
  clearHistory: () => set({ items: [] }),
}));
