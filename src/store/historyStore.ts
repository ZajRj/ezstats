import { create } from 'zustand';

export type DistributionType =
  | 'Normal'
  | 'Binomial'
  | 'Poisson'
  | 'Chi-Square'
  | 'Exponential'
  | 'F-Distribution'
  | 'Geometric'
  | "Student's t"
  | 'Uniform'
  | 'Weibull'
  | string;

export interface HistoryItem {
  id: string;
  type: DistributionType;
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
