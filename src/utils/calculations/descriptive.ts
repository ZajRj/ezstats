import { jStat } from 'jstat';

export interface DescriptiveStats {
  n: number;
  mean: number;
  median: number;
  mode: string;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  variance: number;
  stdev: number;
  rawData: number[];
}

export function calculateDescriptiveStats(dataStr: string): DescriptiveStats | null {
  if (!dataStr.trim()) return null;

  const arr = dataStr.replace(/[^0-9.\-,\s]/g, '')
                     .split(/[\s,]+/)
                     .filter(s => s.trim() !== '')
                     .map(Number)
                     .filter(n => !isNaN(n));

  if (arr.length === 0) return null;

  const n = arr.length;
  
  const mean = jStat.mean(arr);
  const median = jStat.median(arr);
  
  let modeRaw = jStat.mode(arr);
  let mode = Array.isArray(modeRaw) ? modeRaw.join(', ') : String(modeRaw);
  
  const min = jStat.min(arr);
  const max = jStat.max(arr);
  const range = max - min;
  
  const quartiles = jStat.quartiles(arr);
  const q1 = quartiles[0] !== undefined ? quartiles[0] : median;
  const q3 = quartiles[2] !== undefined ? quartiles[2] : median;
  const iqr = q3 - q1;
  
  const variance = n > 1 ? jStat.variance(arr, true) : 0;
  const stdev = n > 1 ? jStat.stdev(arr, true) : 0;
  
  return {
    n, mean, median, mode, min, max, range, q1, q3, iqr, variance, stdev, rawData: arr
  };
}
