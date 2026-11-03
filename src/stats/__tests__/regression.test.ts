// References: NumPy 2.2 lstsq + SciPy 1.15.3 t/F distributions (independent of the
// Gauss-Jordan route used here); VIF from regressing X₁ on X₂.
import { describe, test, expect } from '@jest/globals';
import { invert, multiply, transpose, trace } from '../core/matrix';
import { ols, vifs, linearRegression } from '../regression/linear';
import { REG_MULTIPLE, REG_SIMPLE } from '../fixtures';
import { StatsInputError, type TestOptions } from '../types';

const close = (a: number, b: number, tol = 1e-6) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
const relClose = (a: number, b: number, rel = 1e-6) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThanOrEqual(rel);
const exacto05: TestOptions = { alpha: 0.05, mode: 'exacto' };
const tabla05: TestOptions = { alpha: 0.05, mode: 'tabla' };

describe('matrix core', () => {
  test('inverse times matrix is the identity; determinant', () => {
    const A = [[4, 7, 2], [3, 6, 1], [2, 5, 3]];
    const { inverse, determinant } = invert(A);
    close(determinant, 9, 1e-12);
    const I = multiply(A, inverse);
    I.forEach((row, i) => row.forEach((v, j) => close(v, i === j ? 1 : 0, 1e-12)));
    expect(transpose([[1, 2, 3]])).toEqual([[1], [2], [3]]);
    expect(trace(A)).toBe(13);
  });
  test('singular matrix is a friendly input error', () => {
    expect(() => invert([[1, 2], [2, 4]])).toThrow(StatsInputError);
  });
});

describe('simple linear regression', () => {
  test('coefficients, standard errors, fit', () => {
    const f = ols(REG_SIMPLE.y, [REG_SIMPLE.x]);
    close(f.beta[0], 42.74324324324325, 1e-9);
    close(f.beta[1], 5.581081081081087, 1e-9);
    close(Math.sqrt(f.mse * f.C[0][0]), 0.6901269895810733, 1e-9);
    close(Math.sqrt(f.mse * f.C[1][1]), 0.14146224096794782, 1e-9);
    close(f.sse, 7.108108108108113, 1e-9);
    close(f.ssr, 1382.9918918918918, 1e-8);
    close(f.r2, 0.9948866210286252, 1e-12);
    close(f.leverage.reduce((a, b) => a + b, 0), 2, 1e-12);
  });
  test('global F test and algebraic cross-check', () => {
    const r = linearRegression([{ label: 'Nota', values: REG_SIMPLE.y }, { label: 'Horas', values: REG_SIMPLE.x }], exacto05);
    relClose(r.statistic.value, 1556.5231939163486);
    relClose(r.pValue!, 1.8731830538104802e-10, 1e-5);
    expect(r.decision).toBe('reject');
    expect(r.conclusion).toContain('relación lineal significativa entre Horas y Nota');
    expect(r.steps.some((s) => s.title === 'Estimadores MCO (algebraico)')).toBe(true);
    expect(r.chart?.kind).toBe('scatterFit');
  });
});

describe('multiple linear regression', () => {
  const groups = [
    { label: 'Tiempo', values: REG_MULTIPLE.tiempo },
    { label: 'Cajas', values: REG_MULTIPLE.cajas },
    { label: 'Distancia', values: REG_MULTIPLE.distancia },
  ];
  test('coefficients and standard errors', () => {
    const f = ols(REG_MULTIPLE.tiempo, [REG_MULTIPLE.cajas, REG_MULTIPLE.distancia]);
    [1.84521970236965, 1.8970005926337365, 0.012572500841269818].forEach((b, j) => relClose(f.beta[j], b, 1e-9));
    [1.0028137906227153, 0.1879912519774942, 0.0037074778531087245].forEach((se, j) =>
      relClose(Math.sqrt(f.mse * f.C[j][j]), se, 1e-9));
    close(f.r2adj, 0.9794004924115901, 1e-12);
    close(Math.max(...f.leverage), 0.763234443163698, 1e-12);
  });
  test('F, decision, VIF and leverage warning', () => {
    const r = linearRegression(groups, tabla05);
    relClose(r.statistic.value, 357.58637283251306);
    expect(r.df).toEqual([2, 13]);
    expect(r.criticalValue?.value).toBe(3.81);
    expect(r.decision).toBe('reject');
    expect(r.warnings.some((w) => w.includes('apalancamiento'))).toBe(true);
    vifs([REG_MULTIPLE.cajas, REG_MULTIPLE.distancia]).forEach((v) => close(v.vif, 4.1358739516554825, 1e-9));
  });
  test('table-mode t test flags β₀ as not significant', () => {
    const r = linearRegression(groups, tabla05);
    const t = r.steps.find((s) => s.kind === 'table' && s.title?.startsWith('Pruebas t parciales'));
    expect(t && t.kind === 'table' && t.rows.map((row) => row[6])).toEqual(['No', 'Sí', 'Sí']);
  });
  test('input validation', () => {
    expect(() => linearRegression([groups[0], { label: 'X', values: [1, 2] }], tabla05)).toThrow(/mismo n/);
    expect(() => linearRegression([{ label: 'Y', values: [1, 2] }, { label: 'X', values: [1, 2] }], tabla05)).toThrow(StatsInputError);
    const dup = [groups[0], groups[1], { label: 'Cajas×2', values: REG_MULTIPLE.cajas.map((c) => 2 * c) }];
    expect(() => linearRegression(dup, tabla05)).toThrow(/multicolinealidad exacta/);
  });
});
