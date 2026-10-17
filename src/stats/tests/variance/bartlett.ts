import type { Step, TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import { chiSquare } from '../../core/distributions';
import { variance } from '../../core/descriptive';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareP, compareUpper, equalVarianceConclusion } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireGroups } from '../common';
import type { Group } from '../anova/anovaCore';

export function equalVarianceHypotheses(k: number) {
  const list = Array.from({ length: k }, (_, i) => `σ${subscript(i + 1)}²`).join(' = ');
  return { h0: list, h1: 'Al menos una varianza es diferente.' };
}

export function subscript(n: number): string {
  return String(n).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
}

export function bartlett(groups: Group[], opts: TestOptions): TestResult {
  requireGroups(groups.map((g) => g.values), 2, 2, 'Bartlett');
  requireAlpha(opts.alpha);
  const k = groups.length;
  const ns = groups.map((g) => g.values.length);
  const N = ns.reduce((a, b) => a + b, 0);
  const vars = groups.map((g) => variance(g.values));
  if (vars.some((v) => v === 0)) throw new StatsInputError('Un grupo tiene varianza 0; Bartlett usa ln(s²) y no está definido.');
  const sp2 = vars.reduce((acc, v, i) => acc + (ns[i] - 1) * v, 0) / (N - k);
  const sumLn = vars.reduce((acc, v, i) => acc + (ns[i] - 1) * Math.log(v), 0);
  const M = (N - k) * Math.log(sp2) - sumLn;
  const sumInv = ns.reduce((acc, n) => acc + 1 / (n - 1), 0);
  const C = 1 + (1 / (3 * (k - 1))) * (sumInv - 1 / (N - k));
  const T = M / C;
  const df = k - 1;
  const pValue = chiSquare.sf(T, df);
  const hypotheses = equalVarianceHypotheses(k);

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'table',
      title: 'Varianzas por grupo',
      columns: ['Grupo', 'nⱼ', 'sⱼ²', '(nⱼ − 1) sⱼ²', '(nⱼ − 1) ln sⱼ²', '1/(nⱼ − 1)'],
      rows: groups.map((g, i) => [
        g.label, ns[i], fix(vars[i], 4), fix((ns[i] - 1) * vars[i], 4), fix((ns[i] - 1) * Math.log(vars[i]), 4), fix(1 / (ns[i] - 1), 4),
      ]),
    },
    {
      kind: 'formula',
      title: 'Varianza combinada',
      expression: 'sₚ² = Σ (nⱼ − 1) sⱼ² / (N − k)',
      result: `sₚ² = ${fmt(sp2)}  (N = ${N}, k = ${k})`,
    },
    {
      kind: 'formula',
      title: 'Numerador',
      expression: 'M = (N − k) ln sₚ² − Σ (nⱼ − 1) ln sⱼ²',
      substituted: `M = ${N - k} · ${fmt(Math.log(sp2))} − ${fmt(sumLn)}`,
      result: `M = ${fmt(M)}`,
    },
    {
      kind: 'formula',
      title: 'Factor de corrección',
      expression: 'C = 1 + [Σ 1/(nⱼ − 1) − 1/(N − k)] / [3(k − 1)]',
      substituted: `C = 1 + (${fmt(sumInv)} − 1/${N - k}) / ${3 * (k - 1)}`,
      result: `C = ${fmt(C)}`,
    },
    {
      kind: 'formula',
      title: 'Estadístico de prueba',
      expression: 'B = M / C,   gl = k − 1',
      substituted: `B = ${fmt(M)} / ${fmt(C)}`,
      result: `B = ${fmt(T)}  (gl = ${df})`,
    },
  ];

  let comparison;
  let criticalValue: TestResult['criticalValue'];
  if (opts.mode === 'tabla') {
    const crit = round(chiSquare.quantile(1 - opts.alpha, df), 3);
    criticalValue = { value: crit, source: `Tabla χ² con ${df} gl` };
    steps.push({ kind: 'text', title: 'Valor crítico', body: `χ²(${fmt(1 - opts.alpha)}; ${df}) = ${fix(crit, 3)}.` });
    comparison = compareUpper('B', T, crit, 3);
  } else {
    steps.push({ kind: 'text', title: 'Valor p', body: `p = P(χ²_${df} ≥ ${fmt(T)}) = ${fmtP(pValue)}.` });
    comparison = compareP(pValue, opts.alpha);
  }
  const conclusion = equalVarianceConclusion(comparison, opts.alpha, k);
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'bartlett',
    testName: 'Bartlett',
    family: 'varianza',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'B', value: T },
    df,
    criticalValue,
    pValue: opts.mode === 'exacto' ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings: ['Bartlett es sensible a la falta de normalidad; si los datos no son normales usa Levene.'],
    steps,
  };
}
