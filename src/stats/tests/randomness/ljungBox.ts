import type { Step, TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import { chiSquare } from '../../core/distributions';
import { mean } from '../../core/descriptive';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareP, compareUpper, randomnessConclusion } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireN } from '../common';

export function defaultLags(n: number): number {
  return Math.max(1, Math.min(10, Math.floor(n / 5)));
}

/** Sample autocorrelations ρ̂ₖ for k = 1..h. */
export function autocorrelations(values: number[], h: number): number[] {
  const n = values.length;
  const m = mean(values);
  let den = 0;
  for (const x of values) den += (x - m) ** 2;
  const rho: number[] = [];
  for (let k = 1; k <= h; k++) {
    let num = 0;
    for (let t = 0; t < n - k; t++) num += (values[t] - m) * (values[t + k] - m);
    rho.push(num / den);
  }
  return rho;
}

export function ljungBox(values: number[], params: { h?: number }, opts: TestOptions): TestResult {
  requireN(values, 6, 'Ljung-Box');
  requireAlpha(opts.alpha);
  const n = values.length;
  const h = params.h && params.h >= 1 ? Math.round(params.h) : defaultLags(n);
  if (h >= n) throw new StatsInputError(`El número de rezagos h (${h}) debe ser menor que n (${n}).`);
  if (values.every((v) => v === values[0])) throw new StatsInputError('La serie es constante; la autocorrelación no está definida.');
  const rho = autocorrelations(values, h);
  let sum = 0;
  const rows = rho.map((r, i) => {
    const k = i + 1;
    const term = (r * r) / (n - k);
    sum += term;
    return [k, fix(r, 4), fix(r * r, 4), n - k, fix(term, 6)];
  });
  const Q = n * (n + 2) * sum;
  const pValue = chiSquare.sf(Q, h);
  const hypotheses = {
    h0: 'Las autocorrelaciones hasta el rezago h son cero (la serie es aleatoria).',
    h1: 'Al menos una autocorrelación es distinta de cero.',
  };

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'text',
      title: 'Serie en el orden ingresado',
      body: `${values.map((v) => fmt(v)).join(', ')}\nn = ${n}, x̄ = ${fmt(mean(values))}, h = ${h}${params.h ? '' : ` (por defecto mín(10, n/5))`}.`,
    },
    {
      kind: 'formula',
      title: 'Autocorrelación muestral',
      expression: 'ρ̂ₖ = Σₜ₌₁ⁿ⁻ᵏ (xₜ − x̄)(xₜ₊ₖ − x̄) / Σₜ (xₜ − x̄)²',
    },
    { kind: 'table', title: 'Autocorrelaciones', columns: ['k', 'ρ̂ₖ', 'ρ̂ₖ²', 'n − k', 'ρ̂ₖ²/(n − k)'], rows },
    {
      kind: 'formula',
      title: 'Estadístico de Ljung-Box',
      expression: 'Q = n(n + 2) Σₖ₌₁ʰ ρ̂ₖ² / (n − k)',
      substituted: `Q = ${n}·${n + 2}·${fmt(sum, 6)}`,
      result: `Q = ${fmt(Q)}  (gl = ${h})`,
    },
  ];

  let comparison;
  let criticalValue: TestResult['criticalValue'];
  if (opts.mode === 'tabla') {
    const crit = round(chiSquare.quantile(1 - opts.alpha, h), 3);
    criticalValue = { value: crit, source: `Tabla χ² con ${h} gl` };
    steps.push({ kind: 'text', title: 'Valor crítico', body: `χ²(${fmt(1 - opts.alpha)}; ${h}) = ${fix(crit, 3)}.` });
    comparison = compareUpper('Q', Q, crit, 3);
  } else {
    steps.push({ kind: 'text', title: 'Valor p', body: `p = P(χ²_${h} ≥ ${fmt(Q)}) = ${fmtP(pValue)}.` });
    comparison = compareP(pValue, opts.alpha);
  }
  const conclusion = randomnessConclusion(comparison, opts.alpha, 'hay autocorrelación entre observaciones');
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));
  const warnings = n < 30 ? ['Serie corta: la aproximación χ² de Ljung-Box es menos precisa con n < 30.'] : [];

  return {
    testId: 'ljungBox',
    testName: 'Ljung-Box',
    family: 'aleatoriedad',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'Q', value: Q },
    df: h,
    criticalValue,
    pValue: opts.mode === 'exacto' ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
    chart: { kind: 'acf', lags: rho.map((_, i) => i + 1), rho, bound: 1.96 / Math.sqrt(n) },
  };
}
