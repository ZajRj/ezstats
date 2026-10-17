import { StatsInputError } from '../types';

export function sum(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

export function mean(xs: number[]): number {
  if (xs.length === 0) throw new StatsInputError('No hay datos.');
  return sum(xs) / xs.length;
}

/** Sample variance with n − 1 in the denominator. */
export function variance(xs: number[]): number {
  if (xs.length < 2) throw new StatsInputError('Se necesitan al menos 2 datos para calcular la varianza.');
  const m = mean(xs);
  let ss = 0;
  for (const x of xs) ss += (x - m) * (x - m);
  return ss / (xs.length - 1);
}

export function sd(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

export function sorted(xs: number[]): number[] {
  return [...xs].sort((a, b) => a - b);
}

export function median(xs: number[]): number {
  if (xs.length === 0) throw new StatsInputError('No hay datos.');
  const s = sorted(xs);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Sum of squared deviations from the mean. */
export function sumSquares(xs: number[]): number {
  const m = mean(xs);
  let ss = 0;
  for (const x of xs) ss += (x - m) * (x - m);
  return ss;
}

/** Central moment of order k with n in the denominator. */
export function centralMoment(xs: number[], k: number): number {
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += Math.pow(x - m, k);
  return s / xs.length;
}

/** Population-moment skewness g₁ = m₃ / m₂^{3/2}. */
export function skewness(xs: number[]): number {
  return centralMoment(xs, 3) / Math.pow(centralMoment(xs, 2), 1.5);
}

/** Population-moment kurtosis b₂ = m₄ / m₂² (normal = 3). */
export function kurtosis(xs: number[]): number {
  const m2 = centralMoment(xs, 2);
  return centralMoment(xs, 4) / (m2 * m2);
}

export interface RankResult {
  ranks: number[];
  /** Sizes of each group of tied values (only groups with t > 1). */
  ties: number[];
}

/** Average ranks (1-based), keeping the input order. */
export function rank(xs: number[]): RankResult {
  const idx = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
  const ranks = new Array(xs.length);
  const ties: number[] = [];
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].x === idx[i].x) j++;
    const avg = (i + j + 2) / 2;
    for (let k = i; k <= j; k++) ranks[idx[k].i] = avg;
    if (j > i) ties.push(j - i + 1);
    i = j + 1;
  }
  return { ranks, ties };
}

export interface FrequencyRow {
  x: number;
  f: number;
  F: number;
}

/** Distinct sorted values with absolute and cumulative frequency. */
export function frequencies(xs: number[]): FrequencyRow[] {
  const s = sorted(xs);
  const rows: FrequencyRow[] = [];
  for (const x of s) {
    const last = rows[rows.length - 1];
    if (last && last.x === x) {
      last.f += 1;
      last.F += 1;
    } else {
      rows.push({ x, f: 1, F: (last?.F ?? 0) + 1 });
    }
  }
  return rows;
}

export interface Summary {
  n: number;
  mean: number;
  sd: number;
  min: number;
  max: number;
}

export function summary(xs: number[]): Summary | null {
  if (xs.length === 0) return null;
  return {
    n: xs.length,
    mean: mean(xs),
    sd: xs.length > 1 ? sd(xs) : NaN,
    min: Math.min(...xs),
    max: Math.max(...xs),
  };
}
