// Reference values computed with SciPy 1.15.3 (scipy.special / scipy.stats).
import { describe, test, expect } from '@jest/globals';
import { lnGamma, gammaP, gammaQ, erfc, erf, betaInc } from '../core/special';
import { normal, chiSquare, studentT, fDist, studentizedRange, kolmogorov } from '../core/distributions';
import {
  mean, variance, sd, median, skewness, kurtosis, rank, frequencies, summary,
} from '../core/descriptive';
import { round, fmt, fix, fmtP } from '../core/rounding';
import { parseData } from '../core/parse';
import { StatsNumericError } from '../types';
import { DATASET_A, DATASET_C } from '../fixtures';

const close = (actual: number, expected: number, tol = 1e-6) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
const relClose = (actual: number, expected: number, rel = 1e-6) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThanOrEqual(rel);

describe('special functions', () => {
  test('lnGamma', () => {
    close(lnGamma(0.5), 0.5723649429247004, 1e-12);
    close(lnGamma(10.3), 13.48203678613836, 1e-11);
    close(lnGamma(0.1), 2.2527126517342055, 1e-12);
    close(lnGamma(1), 0, 1e-13);
  });
  test('incomplete gamma', () => {
    close(gammaP(2.5, 1.3), 0.23863473215498604, 1e-13);
    relClose(gammaQ(2.5, 30), 1.2154569777183009e-11, 1e-10);
    close(gammaP(10, 12), 0.7576078383294875, 1e-13);
    expect(gammaP(3, 0)).toBe(0);
  });
  test('erf / erfc', () => {
    close(erfc(0.3), 0.6713732405408726, 1e-14);
    relClose(erfc(3.5), 7.43098372341413e-7, 1e-12);
    close(erf(0.2), 0.22270258921047845, 1e-14);
    close(erf(-0.2), -0.22270258921047845, 1e-14);
  });
  test('erf / erfc across all Cody branches (relative error < 1e-14)', () => {
    const ref: [number, number, number][] = [
      [-5, 1.9999999999984626, -0.9999999999984626], [-3.3, 1.9999969422902035, -0.9999969422902035],
      [-1.2, 1.9103139782296354, -0.9103139782296353], [-0.47, 1.4937450508860821, -0.49374505088608206],
      [-0.2, 1.2227025892104784, -0.22270258921047845], [1e-9, 0.9999999988716208, 1.1283791670955127e-9],
      [0.1, 0.8875370839817152, 0.1124629160182849], [0.46875, 0.507386526782062, 0.492613473217938],
      [0.4688, 0.5073412381867207, 0.4926587618132793], [0.9, 0.20309178757716784, 0.7969082124228322],
      [1.5, 0.03389485352468927, 0.9661051464753108], [2.7, 0.0001343327399405242, 0.9998656672600594],
      [3.99, 1.6739211364520824e-8, 0.9999999832607886], [4.01, 1.4196939421371057e-8, 0.9999999858030606],
      [6.5, 3.842148327120647e-20, 1.0], [10, 2.0884875837625446e-45, 1.0], [20, 5.395865611607901e-176, 1.0],
    ];
    for (const [x, c, e] of ref) {
      relClose(erfc(x), c, 1e-14);
      if (e !== 0) relClose(erf(x), e, 1e-14);
    }
    expect(erf(0)).toBe(0);
  });
  test('regularized incomplete beta', () => {
    close(betaInc(0.4, 2, 3), 0.5248, 1e-13);
    close(betaInc(0.9, 0.5, 7.5), 0.9999999932897103, 1e-13);
  });
});

describe('distributions — reference quantiles from the spec', () => {
  test('normal.quantile(0.975)', () => close(normal.quantile(0.975), 1.959964, 1e-6));
  test('chi2.quantile(0.95, 19)', () => close(chiSquare.quantile(0.95, 19), 30.143527, 1e-6));
  test('F.quantile(0.95, 2, 15)', () => close(fDist.quantile(0.95, 2, 15), 3.68232, 1e-6));
  test('t.quantile(0.975, 10)', () => close(studentT.quantile(0.975, 10), 2.228139, 1e-6));
  test('studentizedRange.quantile(0.95, 3, 15)', () =>
    close(studentizedRange.quantile(0.95, 3, 15), 3.673378, 1e-4));
});

describe('distributions — CDFs and tails', () => {
  test('normal', () => {
    close(normal.cdf(1.96), 0.9750021048517795, 1e-14);
    relClose(normal.sf(6), 9.865876450376948e-10, 1e-10);
    close(normal.quantile(1e-10), -6.361340902404056, 1e-9);
    close(normal.quantile(0.5), 0, 1e-15);
  });
  test('chi-square', () => {
    close(chiSquare.cdf(30.143527, 19), 0.9499999974631869, 1e-10);
    relClose(chiSquare.sf(40, 10), 1.694474393006737e-5, 1e-9);
    close(chiSquare.quantile(0.01, 3), 0.11483180189911707, 1e-9);
  });
  test('t', () => {
    close(studentT.cdf(-2.5, 7), 0.020496109292876433, 1e-12);
    close(studentT.quantile(0.995, 3), 5.840909309733352, 1e-8);
  });
  test('F', () => {
    close(fDist.sf(4.5, 3, 12), 0.024573478840953695, 1e-12);
    close(fDist.quantile(0.99, 5, 10), 5.636326187669078, 1e-8);
  });
  test('studentized range', () => {
    close(studentizedRange.cdf(3.5, 4, 20), 0.9050415494536981, 1e-6);
    close(studentizedRange.quantile(0.99, 5, 30), 5.047605131905055, 1e-4);
  });
  test('Kolmogorov exact (Marsaglia-Tsang-Wang)', () => {
    close(kolmogorov.sf(0.3, 10), 0.27053557479999946, 1e-8);
    close(kolmogorov.sf(0.15, 50), 0.19026366518248072, 1e-8);
    close(kolmogorov.critical(0.05, 20), 0.2940753144343289, 1e-8);
  });
  test('quantiles reject p outside (0, 1) with a typed error', () => {
    expect(() => normal.quantile(0)).toThrow(StatsNumericError);
    expect(() => chiSquare.quantile(1, 4)).toThrow(StatsNumericError);
    expect(() => fDist.quantile(Number.NaN, 2, 3)).toThrow(StatsNumericError);
  });
  test('extreme quantiles terminate', () => {
    expect(isFinite(chiSquare.quantile(1e-12, 2))).toBe(true);
    expect(isFinite(chiSquare.quantile(1 - 1e-12, 2))).toBe(true);
    expect(isFinite(studentT.quantile(1 - 1e-12, 1))).toBe(true);
    expect(isFinite(fDist.quantile(1e-12, 3, 4))).toBe(true);
  });
});

describe('descriptive statistics', () => {
  test('mean, variance (n − 1), sd, median on Dataset A', () => {
    close(mean(DATASET_A), 75.07, 1e-10);
    close(sd(DATASET_A), 1.8496372332803102, 1e-10);
    close(variance(DATASET_A), 3.42115789473684, 1e-10);
    close(median(DATASET_A), 74.85, 1e-10);
    close(median([3, 1, 2]), 2, 0);
  });
  test('skewness and kurtosis use population moments', () => {
    close(skewness([1, 2, 3, 10]), 1.0182337649086284, 1e-10);
    close(kurtosis([1, 2, 3, 10]), 2.2304, 1e-10);
  });
  test('ranks average ties and report tie groups', () => {
    const r = rank([10, 20, 20, 5, 20]);
    expect(r.ranks).toEqual([2, 4, 4, 1, 4]);
    expect(r.ties).toEqual([3]);
  });
  test('frequencies group repeated values', () => {
    const f = frequencies(DATASET_C);
    expect(f).toHaveLength(7);
    expect(f[2]).toEqual({ x: 15, f: 2, F: 4 });
  });
  test('summary', () => {
    const s = summary(DATASET_C)!;
    expect(s.n).toBe(8);
    expect(s.min).toBe(12);
    expect(s.max).toBe(21);
    expect(summary([])).toBeNull();
  });
});

describe('rounding and formatting', () => {
  test('round half away from zero, free of binary noise', () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(-1.005, 2)).toBe(-1.01);
    expect(round(0.12345, 4)).toBe(0.1235);
    expect(round(2.5, 0)).toBe(3);
  });
  test('fmt trims, fix pads', () => {
    expect(fmt(75.07)).toBe('75.07');
    expect(fmt(0.10220000001)).toBe('0.1022');
    expect(fmt(-0.00001)).toBe('0');
    expect(fix(0.19, 3)).toBe('0.190');
  });
  test('fmtP uses scientific notation for tiny values', () => {
    expect(fmtP(0.71899)).toBe('0.7190');
    expect(fmtP(2.5457e-5)).toBe('2.5457 × 10⁻⁵');
  });
});

describe('parser', () => {
  test('dot decimal accepts commas, semicolons, tabs and newlines as separators', () => {
    const r = parseData('71.8, 72.4;73.1\t73.5\n73.5  74', '.');
    expect(r.values).toEqual([71.8, 72.4, 73.1, 73.5, 73.5, 74]);
    expect(r.invalid).toHaveLength(0);
  });
  test('comma decimal stops treating comma as a separator', () => {
    const r = parseData('71,8 72,4; 73,1\n-0,5', ',');
    expect(r.values).toEqual([71.8, 72.4, 73.1, -0.5]);
  });
  test('reports invalid tokens with position and offset', () => {
    const r = parseData('1.5 abc 2.0 3,4', '.');
    // with "." as decimal, "3,4" splits into 3 and 4
    expect(r.values).toEqual([1.5, 2, 3, 4]);
    expect(r.invalid).toEqual([{ text: 'abc', start: 4, position: 2, value: null }]);
  });
  test('dot is invalid when comma is the decimal separator', () => {
    const r = parseData('1,5 2.5', ',');
    expect(r.values).toEqual([1.5]);
    expect(r.invalid[0].text).toBe('2.5');
    expect(r.invalid[0].position).toBe(2);
  });
  test('accepts Unicode minus and scientific notation', () => {
    expect(parseData('−2 1e-3', '.').values).toEqual([-2, 0.001]);
  });
  test('empty input', () => {
    const r = parseData('   \n ', '.');
    expect(r.values).toEqual([]);
    expect(r.tokens).toEqual([]);
  });
});
