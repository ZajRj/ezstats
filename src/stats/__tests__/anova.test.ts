// Fixtures from the module spec, checked with SciPy 1.15.3 (f_oneway, tukey_hsd, kruskal).
import { describe, test, expect } from '@jest/globals';
import { anovaCore, type Group } from '../tests/anova/anovaCore';
import { oneWayAnova } from '../tests/anova/oneWay';
import { tukeyPairs, tukeyHsd } from '../tests/anova/tukeyHsd';
import { kruskalWallis } from '../tests/anova/kruskalWallis';
import { assumptionsPipeline } from '../tests/anova/assumptionsPipeline';
import { ANOVA_GROUPS, DATASET_A, DATASET_B } from '../fixtures';
import type { TestOptions } from '../types';

const tabla05: TestOptions = { alpha: 0.05, mode: 'tabla' };
const exacto05: TestOptions = { alpha: 0.05, mode: 'exacto' };
const close = (a: number, b: number, tol = 1e-4) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
const relClose = (a: number, b: number, rel: number) => expect(Math.abs(a - b) / b).toBeLessThanOrEqual(rel);
const G: Group[] = [
  { label: 'G1', values: ANOVA_GROUPS.G1 },
  { label: 'G2', values: ANOVA_GROUPS.G2 },
  { label: 'G3', values: ANOVA_GROUPS.G3 },
];

describe('one-way ANOVA', () => {
  test('means, variances and F', () => {
    const c = anovaCore(G);
    [23.5, 28.8333, 23.1667].forEach((m, i) => close(c.means[i], m));
    [3.5, 2.16667, 2.16667].forEach((v, i) => close(c.variances[i], v));
    close(c.ssTotal, c.ssBetween + c.ssWithin, 1e-9);
    const r = oneWayAnova(G, exacto05);
    close(r.statistic.value, 23.23404);
    expect(r.df).toEqual([2, 15]);
    relClose(r.pValue!, 2.5457e-5, 1e-3);
    expect(r.decision).toBe('reject');
  });
  test('table mode prints the classic ANOVA table and runs Tukey', () => {
    const r = oneWayAnova(G, tabla05);
    const t = r.steps.find((s) => s.kind === 'table' && s.title === 'Tabla ANOVA');
    expect(t && t.kind === 'table' && t.columns).toEqual(['Fuente', 'SC', 'gl', 'CM', 'F', 'F crítico']);
    expect(r.criticalValue?.value).toBe(3.68);
    expect(r.followUp?.[0].testId).toBe('tukeyHsd');
  });
  test('no Tukey when H₀ is not rejected', () => {
    const r = oneWayAnova([G[0], G[2]], exacto05);
    expect(r.decision).toBe('fail_to_reject');
    expect(r.followUp).toBeUndefined();
  });
});

describe('Tukey HSD', () => {
  test('pairwise p-values', () => {
    const p = tukeyPairs(G);
    close(p[0].p, 1.1413e-4, 1e-3);
    close(p[1].p, 0.93236, 1e-3);
    close(p[2].p, 5.979e-5, 1e-3);
  });
  test('significant pairs in the conclusion', () => {
    const r = tukeyHsd(G, tabla05);
    expect(r.conclusion).toContain('G1 y G2');
    expect(r.conclusion).toContain('G2 y G3');
    expect(r.conclusion).not.toContain('G1 y G3');
  });
});

describe('Kruskal-Wallis', () => {
  test('tie-corrected H', () => {
    const r = kruskalWallis(G, exacto05);
    close(r.statistic.value, 11.52222);
    close(r.pValue!, 0.0031476, 1e-6);
    expect(r.decision).toBe('reject');
  });
});

describe('assumptions pipeline', () => {
  test('all assumptions hold: ANOVA + Tukey', () => {
    const r = assumptionsPipeline(G, { normality: 'shapiroWilk' }, exacto05);
    expect(r.checks.filter((c) => c.kind === 'normalidad').every((c) => c.passed)).toBe(true);
    expect(r.checks.find((c) => c.kind === 'homocedasticidad')?.label).toContain('Bartlett');
    expect(r.final.testId).toBe('oneWayAnova');
    expect(r.final.followUp?.[0].testId).toBe('tukeyHsd');
  });
  test('non-normal group falls back to Kruskal-Wallis via Levene', () => {
    const r = assumptionsPipeline(
      [{ label: 'A', values: DATASET_A }, { label: 'B', values: DATASET_B }],
      { normality: 'lilliefors' },
      tabla05,
    );
    expect(r.checks.find((c) => c.kind === 'homocedasticidad')?.label).toContain('Levene');
    expect(r.final.testId).toBe('kruskalWallis');
    expect(r.reason).toContain('normalidad');
  });
});
