// Fixtures from the module spec, checked with SciPy 1.15.3 (shapiro, jarque_bera,
// anderson, kstest) and by hand (Lilliefors in table mode).
import { describe, test, expect } from '@jest/globals';
import { lilliefors } from '../tests/normality/lilliefors';
import { kolmogorovSmirnov } from '../tests/normality/ks';
import { shapiroWilk } from '../tests/normality/shapiroWilk';
import { jarqueBera } from '../tests/normality/jarqueBera';
import { andersonDarling, andersonDarlingA2 } from '../tests/normality/andersonDarling';
import { chiSquareGof } from '../tests/normality/chiSquareGof';
import { lillieforsCritical, lillieforsPValue } from '../tables/lilliefors';
import { mean, sd } from '../core/descriptive';
import { DATASET_A, DATASET_B, DATASET_C, DATASET_D } from '../fixtures';
import { StatsInputError } from '../types';
import type { TestOptions } from '../types';

const tabla05: TestOptions = { alpha: 0.05, mode: 'tabla' };
const exacto05: TestOptions = { alpha: 0.05, mode: 'exacto' };
const close = (a: number, b: number, tol = 1e-4) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
const relClose = (a: number, b: number, rel: number) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThanOrEqual(rel);

function tableOf(result: ReturnType<typeof lilliefors>) {
  const step = result.steps.find((s) => s.kind === 'table');
  if (!step || step.kind !== 'table') throw new Error('no table');
  return step;
}

describe('Lilliefors — table mode', () => {
  test('Dataset A: fail to reject', () => {
    close(mean(DATASET_A), 75.07);
    close(sd(DATASET_A), 1.8496);
    const r = lilliefors(DATASET_A, tabla05);
    close(r.statistic.value, 0.1022);
    const t = tableOf(r);
    const dPlus = t.rows.map((row) => Number(row[7]));
    const dMinus = t.rows.map((row) => Number(row[8]));
    close(Math.max(...dPlus), 0.1022);
    close(Math.max(...dMinus), 0.0513);
    expect(t.rows[dPlus.indexOf(Math.max(...dPlus))][0]).toBe('75.3');
    expect(r.criticalValue?.value).toBe(0.19);
    expect(r.decision).toBe('fail_to_reject');
    expect(r.conclusion).toBe(
      'Como D = 0.1022 < 0.190, no se rechaza H₀. Con un nivel de significancia del 5 %, no hay evidencia para afirmar que los datos no siguen una distribución normal.',
    );
  });

  test('Dataset B: reject at 0.05 and 0.01', () => {
    close(mean(DATASET_B), 3.575);
    close(sd(DATASET_B), 4.2336);
    const r = lilliefors(DATASET_B, tabla05);
    close(r.statistic.value, 0.2603);
    const t = tableOf(r);
    const dPlus = t.rows.map((row) => Number(row[7]));
    expect(t.rows[dPlus.indexOf(Math.max(...dPlus))][0]).toBe('2.4');
    close(Math.max(...t.rows.map((row) => Number(row[8]))), 0.2327);
    expect(r.decision).toBe('reject');
    expect(lilliefors(DATASET_B, { alpha: 0.01, mode: 'tabla' }).decision).toBe('reject');
    expect(r.conclusion).toBe(
      'Como D = 0.2603 ≥ 0.190, se rechaza H₀. Con un nivel de significancia del 5 %, los datos no siguen una distribución normal.',
    );
  });

  test('Dataset C reproduces the hand-solved table: 7 rows, D = 0.1443', () => {
    close(mean(DATASET_C), 16);
    close(sd(DATASET_C), 2.7255);
    const r = lilliefors(DATASET_C, tabla05);
    const t = tableOf(r);
    expect(t.columns).toEqual(['xᵢ', 'fᵢ', 'Fᵢ', 'Fᵢ/n', 'Fᵢ₋₁/n', 'zᵢ', 'Φ(zᵢ)', 'D⁺', 'D⁻']);
    expect(t.rows).toEqual([
      ['12', 1, 1, '0.1250', '0.0000', '-1.47', '0.0708', '0.0542', '0.0708'],
      ['14', 1, 2, '0.2500', '0.1250', '-0.73', '0.2327', '0.0173', '0.1077'],
      ['15', 2, 4, '0.5000', '0.2500', '-0.37', '0.3557', '0.1443', '0.1057'],
      ['16', 1, 5, '0.6250', '0.5000', '0.00', '0.5000', '0.1250', '0.0000'],
      ['17', 1, 6, '0.7500', '0.6250', '0.37', '0.6443', '0.1057', '0.0193'],
      ['18', 1, 7, '0.8750', '0.7500', '0.73', '0.7673', '0.1077', '0.0173'],
      ['21', 1, 8, '1.0000', '0.8750', '1.83', '0.9664', '0.0336', '0.0914'],
    ]);
    close(r.statistic.value, 0.1443);
    expect(r.criticalValue?.value).toBe(0.285);
    expect(r.decision).toBe('fail_to_reject');
    // repeated value 15 and both maxima are highlighted
    expect(t.highlight).toEqual(expect.arrayContaining([{ row: 2, col: 1 }, { row: 2, col: 7 }, { row: 1, col: 8 }]));
  });

  test('uses the variable name in the conclusion', () => {
    const r = lilliefors(DATASET_B, { ...tabla05, variableName: 'el tiempo de resolución' });
    expect(r.conclusion.endsWith('el tiempo de resolución no sigue una distribución normal.')).toBe(true);
    expect(r.hypotheses.h0).toBe('El tiempo de resolución sigue una distribución normal.');
  });

  test('n < 4 cannot be run', () => {
    expect(() => lilliefors([1, 2, 3], tabla05)).toThrow(StatsInputError);
  });

  test('warns on many ties', () => {
    const r = lilliefors([1, 1, 1, 2, 2, 2, 3, 3, 3, 4], tabla05);
    expect(r.warnings.some((w) => w.startsWith('Muchos empates'))).toBe(true);
  });

  test('exact mode adds an approximate p-value', () => {
    const r = lilliefors(DATASET_B, exacto05);
    expect(r.pValueApprox).toBe(true);
    expect(r.pValue!).toBeLessThan(0.01);
    expect(lillieforsPValue(0.1022, 20)).toBeGreaterThan(0.2);
  });
});

describe('Lilliefors critical values', () => {
  test('interpolation n = 22 and n = 27 (α = .05)', () => {
    const a = lillieforsCritical(22, 0.05)!;
    expect(a.kind).toBe('interpolated');
    close(a.value, 0.186, 1e-9);
    close(lillieforsCritical(27, 0.05)!.value, 0.1724, 1e-9);
  });
  test('large n formula', () => {
    close(lillieforsCritical(100, 0.05)!.value, 0.0886, 1e-9);
  });
  test('interpolated step is flagged', () => {
    const data = Array.from({ length: 22 }, (_, i) => Math.sin(i + 1) * 10);
    const r = lilliefors(data, tabla05);
    expect(r.criticalValue?.interpolated).toBe(true);
    expect(r.steps.some((s) => s.title === 'Valor crítico (interpolación lineal)')).toBe(true);
  });
});

describe('Shapiro-Wilk (Royston 1995)', () => {
  test('Dataset A', () => {
    const r = shapiroWilk(DATASET_A, exacto05);
    close(r.statistic.value, 0.98575);
    close(r.pValue!, 0.98576);
    expect(r.decision).toBe('fail_to_reject');
  });
  test('Dataset B', () => {
    const r = shapiroWilk(DATASET_B, exacto05);
    close(r.statistic.value, 0.70719);
    relClose(r.pValue!, 4.777e-5, 1e-2);
    expect(r.decision).toBe('reject');
  });
  test('small n branch (n = 8)', () => {
    const r = shapiroWilk(DATASET_C, exacto05);
    close(r.statistic.value, 0.9741976234070846);
    close(r.pValue!, 0.9287571713050876, 1e-3);
  });
  test('n = 3', () => {
    expect(shapiroWilk([1, 2, 4], exacto05).pValue!).toBeGreaterThan(0);
  });
});

describe('Jarque-Bera', () => {
  test('Dataset A', () => {
    const r = jarqueBera(DATASET_A, exacto05);
    close(r.statistic.value, 0.43075);
    close(r.pValue!, 0.80624);
    expect(r.warnings).toHaveLength(1);
  });
  test('Dataset B', () => {
    const r = jarqueBera(DATASET_B, exacto05);
    close(r.statistic.value, 23.67358);
    relClose(r.pValue!, 7.233e-6, 1e-2);
  });
  test('table mode compares with χ²(0.95; 2) = 5.991', () => {
    const r = jarqueBera(DATASET_B, tabla05);
    expect(r.criticalValue?.value).toBe(5.991);
    expect(r.decision).toBe('reject');
  });
});

describe('Anderson-Darling', () => {
  test('unadjusted A²', () => {
    close(andersonDarlingA2(DATASET_A), 0.14434);
    close(andersonDarlingA2(DATASET_B), 2.19037);
  });
  test('decisions', () => {
    expect(andersonDarling(DATASET_A, tabla05).decision).toBe('fail_to_reject');
    const b = andersonDarling(DATASET_B, tabla05);
    expect(b.criticalValue?.value).toBe(0.752);
    expect(b.decision).toBe('reject');
    expect(andersonDarling(DATASET_B, exacto05).pValue!).toBeLessThan(0.001);
  });
});

describe('Kolmogorov-Smirnov with known parameters', () => {
  test('Dataset A, μ = 75, σ = 2 (exact mode)', () => {
    const r = kolmogorovSmirnov(DATASET_A, { mu: 75, sigma: 2 }, exacto05);
    close(r.statistic.value, 0.09038);
    close(r.pValue!, 0.99166);
    expect(r.decision).toBe('fail_to_reject');
  });
  test('table mode uses the exact critical value rounded to 3 decimals', () => {
    const r = kolmogorovSmirnov(DATASET_A, { mu: 75, sigma: 2 }, tabla05);
    expect(r.criticalValue?.value).toBe(0.294);
  });
  test('missing parameters point to Lilliefors', () => {
    expect(() => kolmogorovSmirnov(DATASET_A, { mu: NaN, sigma: NaN }, tabla05)).toThrow(/Lilliefors/);
  });
});

describe('χ² goodness of fit', () => {
  // Reference: same binning in Python + scipy.stats.chisquare(O, E, ddof=2), SciPy 1.15.3.
  test('Dataset D (n = 50, Sturges k = 7, merged to 5 intervals)', () => {
    const r = chiSquareGof(DATASET_D, {}, exacto05);
    expect(r.df).toBe(2);
    close(r.statistic.value, 1.9560876509044633, 1e-9);
    close(r.pValue!, 0.37604599142519557, 1e-9);
    expect(r.steps.some((s) => s.title === 'Unión de intervalos con Eᵢ < 5')).toBe(true);
  });
  test('df < 1 is an error', () => {
    expect(() => chiSquareGof(DATASET_C.concat([13, 19]), {}, tabla05)).toThrow(StatsInputError);
  });
});
