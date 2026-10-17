import { create } from 'zustand';
import { defaultDecimalSeparator, type DecimalSeparator } from '../stats/core/parse';
import type { Mode } from '../stats/types';

interface StatsPrefs {
  decimal: DecimalSeparator;
  mode: Mode;
  setDecimal: (d: DecimalSeparator) => void;
  setMode: (m: Mode) => void;
}

export const useStatsPrefs = create<StatsPrefs>((set) => ({
  decimal: defaultDecimalSeparator(),
  mode: 'tabla',
  setDecimal: (decimal) => set({ decimal }),
  setMode: (mode) => set({ mode }),
}));
