// Embedded tables vs the runtime distributions they were generated from.
import { describe, test, expect } from '@jest/globals';
import { KS_ALPHAS, KS_TABLE } from '../tables/ks';
import { TUKEY_TABLE } from '../tables/tukey';
import { kolmogorov, studentizedRange } from '../core/distributions';
import { round } from '../core/rounding';
import { ksCritical } from '../tests/normality/ks';

describe('Kolmogorov-Smirnov table', () => {
  test('matches the exact distribution (Marsaglia-Tsang-Wang)', () => {
    for (const n of [1, 5, 10, 20, 35]) {
      KS_ALPHAS.forEach((a, j) => expect(KS_TABLE[n][j]).toBe(round(kolmogorov.critical(a, n), 3)));
    }
  });
  test('published Massey values', () => {
    expect(KS_TABLE[10][3]).toBe(0.409);
    expect(KS_TABLE[20][3]).toBe(0.294);
    expect(ksCritical(40, 0.05).value).toBe(round(1.36 / Math.sqrt(40), 4));
  });
});

describe('Tukey q table', () => {
  test('matches the studentized range quantile', () => {
    expect(TUKEY_TABLE['0.05'][15][1]).toBe(round(studentizedRange.quantile(0.95, 3, 15), 2));
    expect(TUKEY_TABLE['0.01'][10][3]).toBe(round(studentizedRange.quantile(0.99, 5, 10), 2));
  });
  test('published values', () => {
    expect(TUKEY_TABLE['0.05'][10][1]).toBe(3.88);
    expect(TUKEY_TABLE['0.05'][120][0]).toBe(2.8);
  });
});
