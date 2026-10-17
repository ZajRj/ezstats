// Fixtures from the module spec, checked with SciPy 1.15.3 (levene, bartlett with
// float arrays, f.sf/f.cdf, chi2). Note: scipy.stats.bartlett returns a wrong value
// (1.5604) when given integer arrays; with float input it gives 0.36820.
import { describe, test, expect } from '@jest/globals';
import { chiSquareVariance } from '../tests/variance/chiSquareVariance';
import { fTwoVariances } from '../tests/variance/fTwoVariances';
import { bartlett } from '../tests/variance/bartlett';
import { levene } from '../tests/variance/levene';
import { hartley } from '../tests/variance/hartley';
import { hartleyCritical } from '../tables/hartley';
import { ANOVA_GROUPS, DATASET_A } from '../fixtures';
import { StatsInputError, type TestOptions } from '../types';
import type { Group } from '../tests/anova/anovaCore';

const tabla05: TestOptions = { alpha: 0.05, mode: 'tabla' };
const exacto05: TestOptions = { alpha: 0.05, mode: 'exacto' };
const close = (a: number, b: number, tol = 1e-4) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
const G: Group[] = [
  { label: 'G1', values: ANOVA_GROUPS.G1 },
  { label: 'G2', values: ANOVA_GROUPS.G2 },
  { label: 'G3', values: ANOVA_GROUPS.G3 },
];

describe('χ² for one variance', () => {
  test('Dataset A, σ₀² = 4, two-sided', () => {
    const r = chiSquareVariance(DATASET_A, { sigma0sq: 4, tail: 'two' }, exacto05);
    close(r.statistic.value, 16.2505);
    expect(r.df).toBe(19);
    close(r.pValue!, 0.71899);
    expect(r.decision).toBe('fail_to_reject');
    expect(r.steps.some((s) => s.kind === 'formula' && s.title?.startsWith('Intervalo de confianza'))).toBe(true);
  });
  test('table mode gives both critical bounds', () => {
    const r = chiSquareVariance(DATASET_A, { sigma0sq: 4, tail: 'two' }, tabla05);
    expect(r.criticalLower?.value).toBe(8.907);
    expect(r.criticalValue?.value).toBe(32.852);
    expect(r.decision).toBe('fail_to_reject');
  });
  test('one-sided tails', () => {
    expect(chiSquareVariance(DATASET_A, { sigma0sq: 10, tail: 'left' }, tabla05).decision).toBe('reject');
    expect(chiSquareVariance(DATASET_A, { sigma0sq: 1, tail: 'right' }, exacto05).decision).toBe('reject');
  });
});

describe('F for two variances', () => {
  test('G1 vs G2, two-sided', () => {
    const r = fTwoVariances([G[0], G[1]], { tail: 'two' }, exacto05);
    close(r.statistic.value, 1.61538);
    expect(r.df).toEqual([5, 5]);
    close(r.pValue!, 0.61152);
  });
  test('table mode puts the larger variance on top and uses F(1 − α/2)', () => {
    const r = fTwoVariances([G[1], G[0]], { tail: 'two' }, tabla05);
    close(r.statistic.value, 1.61538);
    expect(r.criticalValue?.value).toBe(7.15);
    expect(r.steps.some((s) => s.title === 'Convención para la prueba bilateral')).toBe(true);
  });
});

describe('Bartlett', () => {
  test('ANOVA groups', () => {
    const r = bartlett(G, exacto05);
    close(r.statistic.value, 0.3682);
    close(r.pValue!, 0.83185);
    expect(r.decision).toBe('fail_to_reject');
  });
});

describe('Levene and Brown-Forsythe', () => {
  test('Levene (mean)', () => {
    const r = levene(G, { center: 'mean' }, exacto05);
    close(r.statistic.value, 0.35714);
    close(r.pValue!, 0.70546);
  });
  test('Brown-Forsythe (median)', () => {
    const r = levene(G, { center: 'median' }, exacto05);
    close(r.statistic.value, 0.3125);
    close(r.pValue!, 0.73627);
  });
  test('table mode shows the ANOVA table on the deviations', () => {
    const r = levene(G, { center: 'mean' }, tabla05);
    expect(r.steps.some((s) => s.kind === 'table' && s.title === 'Tabla ANOVA')).toBe(true);
    expect(r.steps.some((s) => s.kind === 'table' && s.title === 'Datos transformados zᵢⱼ')).toBe(true);
    expect(r.criticalValue?.value).toBe(3.68);
  });
});

describe('Hartley Fmax', () => {
  test('ANOVA groups', () => {
    const r = hartley(G, tabla05);
    close(r.statistic.value, 1.61538);
    expect(r.criticalValue?.value).toBe(10.8); // k = 3, ν = 5
    expect(r.decision).toBe('fail_to_reject');
  });
  test('unequal sizes suggest Levene', () => {
    expect(() => hartley([G[0], { label: 'x', values: [1, 2, 3] }], tabla05)).toThrow(/Levene/);
  });
  test('table matches Pearson & Hartley printed entries', () => {
    expect(hartleyCritical(2, 2, 0.05)!.value).toBe(39.0);
    expect(hartleyCritical(12, 2, 0.05)!.value).toBe(704);
    // exact 447.498; Pearson & Hartley print 448
    expect(hartleyCritical(3, 2, 0.01)!.value).toBe(447);
    expect(hartleyCritical(2, 10, 0.05)!.value).toBe(3.72);
    const fallback = hartleyCritical(4, 11, 0.05)!;
    expect(fallback.dfUsed).toBe(10);
    expect(fallback.exactDf).toBe(false);
    expect(hartleyCritical(3, 5, 0.1)).toBeNull();
  });
  test('α without table is an input error', () => {
    expect(() => hartley(G, { alpha: 0.1, mode: 'tabla' })).toThrow(StatsInputError);
  });
});
