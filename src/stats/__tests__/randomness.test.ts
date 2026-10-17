// Runs above/below the median: fixture from the module spec (checked by hand / NumPy).
// Runs up and down: formulas of Wallis & Moore (1941), reference computed in Python.
// Ljung-Box: statsmodels 0.15.0 acorr_ljungbox.
import { describe, test, expect } from '@jest/globals';
import { runsMedian } from '../tests/randomness/runsMedian';
import { runsUpDown } from '../tests/randomness/runsUpDown';
import { ljungBox, defaultLags } from '../tests/randomness/ljungBox';
import { runsCritical, runsPmf } from '../tables/runs';
import { DATASET_D, RUNS_SEQUENCE } from '../fixtures';
import type { TestOptions } from '../types';

const tabla05: TestOptions = { alpha: 0.05, mode: 'tabla' };
const exacto05: TestOptions = { alpha: 0.05, mode: 'exacto' };
const close = (a: number, b: number, tol = 1e-4) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);

describe('runs above/below the median', () => {
  test('spec sequence (exact mode, normal approximation)', () => {
    const r = runsMedian(RUNS_SEQUENCE, exacto05);
    const body = r.steps.find((s) => s.title === 'Conteo de rachas');
    expect(body && body.kind === 'text' && body.body).toContain('n₁ (+) = 7, n₂ (−) = 7, R = 14');
    expect(body && body.kind === 'text' && body.body).toContain('Se excluyen 2 valor(es)');
    close(r.statistic.value, 3.33809);
    close(r.pValue!, 0.000844, 1e-6);
    expect(r.decision).toBe('reject');
    expect(r.conclusion).toContain('demasiadas rachas');
  });
  test('table mode uses the Swed-Eisenhart values for n₁ = n₂ = 7', () => {
    const r = runsMedian(RUNS_SEQUENCE, tabla05);
    expect(r.statistic).toEqual({ symbol: 'R', value: 14 });
    expect(r.criticalLower?.value).toBe(3);
    expect(r.criticalValue?.value).toBe(13);
    expect(r.decision).toBe('reject');
  });
  test('never sorts the input', () => {
    const r = runsMedian(RUNS_SEQUENCE, tabla05);
    expect(r.chart && r.chart.kind === 'runs' && r.chart.values).toEqual(RUNS_SEQUENCE);
  });
  test('trend gives too few runs', () => {
    const r = runsMedian([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], exacto05);
    expect(r.decision).toBe('reject');
    expect(r.conclusion).toContain('muy pocas rachas');
  });
});

describe('runs exact distribution (Swed & Eisenhart 1943)', () => {
  test('pmf sums to 1', () => {
    let s = 0;
    for (let r = 2; r <= 21; r++) s += runsPmf(r, 10, 12);
    close(s, 1, 1e-12);
  });
  test('published critical values at α = 0.05', () => {
    expect(runsCritical(7, 7, 0.05)).toEqual({ lower: 3, upper: 13 });
    expect(runsCritical(10, 10, 0.05)).toEqual({ lower: 6, upper: 16 });
    expect(runsCritical(20, 20, 0.05)).toEqual({ lower: 14, upper: 28 });
  });
});

describe('runs up and down', () => {
  test('spec sequence', () => {
    const r = runsUpDown(RUNS_SEQUENCE, exacto05);
    close(r.statistic.value, 1.6791019206444535, 1e-9);
    close(r.pValue!, 0.0931321819830355, 1e-9);
    expect(r.decision).toBe('fail_to_reject');
  });
  test('ignores ties between consecutive values', () => {
    const r = runsUpDown([1, 3, 3, 2, 4, 1, 5, 2], tabla05);
    const step = r.steps.find((s) => s.title === 'Conteo de rachas');
    expect(step && step.kind === 'text' && step.body).toContain('Se ignoran 1 empate(s)');
  });
});

describe('Ljung-Box', () => {
  test('Dataset D, h = 10 (statsmodels)', () => {
    expect(defaultLags(50)).toBe(10);
    const r = ljungBox(DATASET_D, {}, exacto05);
    close(r.statistic.value, 10.317026, 1e-5);
    close(r.pValue!, 0.413134, 1e-6);
    expect(r.df).toBe(10);
  });
  test('runs sequence, h = 3 (statsmodels)', () => {
    const r = ljungBox(RUNS_SEQUENCE, { h: 3 }, exacto05);
    close(r.statistic.value, 9.001034, 1e-5);
    close(r.pValue!, 0.029277, 1e-6);
    expect(r.decision).toBe('reject');
  });
});
