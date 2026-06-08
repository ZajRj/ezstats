import { FreqDataRow } from '../../components/ui/FrequencyTable';

export function generateContinuousFrequencyTable(samples: number[]): FreqDataRow[] {
  const N = samples.length;
  if (N === 0) return [];

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  
  const k = Math.ceil(1 + 3.322 * Math.log10(N));
  const width = (max - min) / k;

  const bins = new Array(k).fill(0);
  for (const val of samples) {
    let binIdx = Math.floor((val - min) / width);
    if (binIdx < 0) binIdx = 0;
    if (binIdx >= k) binIdx = k - 1;
    bins[binIdx]++;
  }

  let currentCumAbs = 0;
  return bins.map((count, idx) => {
    const lower = min + idx * width;
    const upper = min + (idx + 1) * width;
    const midpoint = (lower + upper) / 2;
    currentCumAbs += count;
    
    const isLast = idx === k - 1;
    return {
      interval: `[${lower.toFixed(2)}, ${upper.toFixed(2)}${isLast ? ']' : ')'}`,
      midpoint: midpoint.toFixed(2),
      absFreq: count,
      cumAbsFreq: currentCumAbs,
      relFreq: count / N,
      cumRelFreq: currentCumAbs / N,
      f_x: count * midpoint,
    };
  });
}

export function generateDiscreteFrequencyTable(samples: number[]): FreqDataRow[] {
  const N = samples.length;
  if (N === 0) return [];

  const counts: Record<number, number> = {};
  for (const val of samples) {
    counts[val] = (counts[val] || 0) + 1;
  }
  
  const sortedKeys = Object.keys(counts).map(Number).sort((a, b) => a - b);
  
  let currentCumAbs = 0;
  return sortedKeys.map(val => {
    const absFreq = counts[val];
    currentCumAbs += absFreq;
    
    return {
      interval: val.toString(),
      midpoint: val.toString(),
      absFreq: absFreq,
      cumAbsFreq: currentCumAbs,
      relFreq: absFreq / N,
      cumRelFreq: currentCumAbs / N,
      f_x: absFreq * val,
    };
  });
}
