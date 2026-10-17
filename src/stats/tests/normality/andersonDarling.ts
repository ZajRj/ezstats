import type { Step, TestOptions, TestResult } from '../../types';
import { normal } from '../../core/distributions';
import { mean, sd, sorted } from '../../core/descriptive';
import { fix, fmt, fmtP } from '../../core/rounding';
import { compareP, compareUpper, normalityConclusion, normalityHypotheses } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireN } from '../common';

/** Critical values of A*² with estimated parameters (D'Agostino & Stephens 1986, Table 4.7). */
const AD_CRITICAL: Record<string, number> = { '0.1': 0.631, '0.05': 0.752, '0.01': 1.035 };

/** p-value for the adjusted statistic A*² (D'Agostino & Stephens 1986, case 3). */
export function andersonDarlingPValue(A: number): number {
  let p: number;
  if (A < 0.2) p = 1 - Math.exp(-13.436 + 101.14 * A - 223.73 * A * A);
  else if (A < 0.34) p = 1 - Math.exp(-8.318 + 42.796 * A - 59.938 * A * A);
  else if (A < 0.6) p = Math.exp(0.9177 - 4.279 * A - 1.38 * A * A);
  else p = Math.exp(1.2937 - 5.709 * A + 0.0186 * A * A);
  return Math.min(1, Math.max(0, p));
}

export function andersonDarling(values: number[], opts: TestOptions): TestResult {
  requireN(values, 8, 'Anderson-Darling');
  requireAlpha(opts.alpha);
  const n = values.length;
  const x = sorted(values);
  const xbar = mean(x);
  const s = sd(x);
  const z = x.map((v) => (v - xbar) / s);
  const Phi = z.map((v) => normal.cdf(v));
  // ln(1 − Φ(z)) via the survival function keeps precision in the upper tail.
  const lnSf = z.map((v) => Math.log(normal.sf(v)));

  let S = 0;
  const rows: (string | number)[][] = [];
  for (let i = 0; i < n; i++) {
    const term = (2 * (i + 1) - 1) * (Math.log(Phi[i]) + lnSf[n - 1 - i]);
    S += term;
    rows.push([i + 1, fmt(x[i]), fix(z[i], 4), fix(Phi[i], 4), fix(1 - Phi[n - 1 - i], 4), fix(term, 4)]);
  }
  const A2 = -n - S / n;
  const Astar = A2 * (1 + 0.75 / n + 2.25 / (n * n));
  const pValue = andersonDarlingPValue(Astar);
  const hypotheses = normalityHypotheses(opts);

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    { kind: 'text', title: 'Parámetros estimados', body: `x̄ = ${fmt(xbar)}, s = ${fmt(s)}, n = ${n}. zᵢ = (x₍ᵢ₎ − x̄)/s con los datos ordenados.` },
    {
      kind: 'table',
      title: 'Términos de la suma',
      columns: ['i', 'x₍ᵢ₎', 'zᵢ', 'Φ(zᵢ)', '1 − Φ(zₙ₊₁₋ᵢ)', '(2i − 1)[ln Φ(zᵢ) + ln(1 − Φ(zₙ₊₁₋ᵢ))]'],
      rows,
    },
    {
      kind: 'formula',
      title: 'Estadístico A²',
      expression: 'A² = −n − (1/n) Σ (2i − 1)[ln Φ(zᵢ) + ln(1 − Φ(zₙ₊₁₋ᵢ))]',
      substituted: `A² = −${n} − (${fmt(S)}) / ${n}`,
      result: `A² = ${fmt(A2)}`,
    },
    {
      kind: 'formula',
      title: 'Ajuste de Stephens',
      expression: 'A*² = A² (1 + 0.75/n + 2.25/n²)',
      substituted: `A*² = ${fmt(A2)} · (1 + 0.75/${n} + 2.25/${n}²)`,
      result: `A*² = ${fmt(Astar)}`,
    },
  ];

  const crit = AD_CRITICAL[String(opts.alpha)];
  let comparison;
  let criticalValue: TestResult['criticalValue'];
  const warnings: string[] = [];
  if (crit !== undefined) {
    criticalValue = { value: crit, source: "D'Agostino y Stephens (1986), A*² con parámetros estimados" };
    steps.push({ kind: 'text', title: 'Valor crítico', body: `Para α = ${fmt(opts.alpha)}: A*² crítico = ${fix(crit, 3)}.` });
  }
  if (opts.mode === 'exacto' || crit === undefined) {
    steps.push({ kind: 'text', title: 'Valor p', body: `Fórmulas por tramos de D'Agostino y Stephens (1986): p = ${fmtP(pValue)}.` });
    comparison = compareP(pValue, opts.alpha);
    if (opts.mode === 'tabla') warnings.push('El α elegido no tiene valor crítico tabulado; se decidió con el valor p.');
  } else {
    comparison = compareUpper('A*²', Astar, crit, 3);
  }
  const conclusion = normalityConclusion(comparison, opts.alpha, opts);
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'andersonDarling',
    testName: 'Anderson-Darling',
    family: 'normalidad',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'A*²', value: Astar },
    criticalValue,
    pValue: opts.mode === 'exacto' || crit === undefined ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
  };
}

/** Unadjusted A², exposed for testing against reference software. */
export function andersonDarlingA2(values: number[]): number {
  const x = sorted(values);
  const n = x.length;
  const xbar = mean(x);
  const s = sd(x);
  let S = 0;
  for (let i = 0; i < n; i++) {
    const zi = (x[i] - xbar) / s;
    const zr = (x[n - 1 - i] - xbar) / s;
    S += (2 * (i + 1) - 1) * (Math.log(normal.cdf(zi)) + Math.log(normal.sf(zr)));
  }
  return -n - S / n;
}
