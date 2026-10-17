import type { Step, TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import { kolmogorov } from '../../core/distributions';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareP, compareUpper, normalityConclusion, subject, capitalize } from '../../text';
import { conclusionStep, dataStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireN } from '../common';
import { compareEcdf, dStatisticSteps, ecdfChart, ecdfTableStep } from './ecdf';

const LARGE_N_COEF: Record<string, number> = { '0.1': 1.22, '0.05': 1.36, '0.01': 1.63 };

/** Critical value of D for known parameters. */
export function ksCritical(n: number, alpha: number): { value: number; source: string } {
  const coef = LARGE_N_COEF[String(alpha)];
  if (n > 35 && coef) {
    return { value: round(coef / Math.sqrt(n), 4), source: `Fórmula asintótica ${coef}/√n (n > 35)` };
  }
  return {
    value: round(kolmogorov.critical(alpha, n), 3),
    source: 'Distribución exacta de Kolmogorov (Marsaglia, Tsang y Wang 2003), redondeada a 3 decimales como en las tablas impresas',
  };
}

/** One-sample Kolmogorov-Smirnov against N(μ, σ) with μ and σ given by the user. */
export function kolmogorovSmirnov(values: number[], params: { mu: number; sigma: number }, opts: TestOptions): TestResult {
  requireN(values, 2, 'La prueba de Kolmogorov-Smirnov');
  requireAlpha(opts.alpha);
  const { mu, sigma } = params;
  if (!isFinite(mu) || !isFinite(sigma)) {
    throw new StatsInputError('Ingresa μ y σ conocidos. Si quieres estimarlos con los datos, usa la prueba de Lilliefors.');
  }
  if (sigma <= 0) throw new StatsInputError('σ debe ser mayor que 0.');
  const n = values.length;
  const s = subject(opts);
  const verb = s.plural ? 'siguen' : 'sigue';
  const hypotheses = {
    h0: `${capitalize(s.text)} ${verb} una distribución normal N(μ = ${fmt(mu)}, σ = ${fmt(sigma)}).`,
    h1: `${capitalize(s.text)} no ${verb} esa distribución normal.`,
  };

  const cmp = compareEcdf(values, mu, sigma, opts.mode);
  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    dataStep(values),
    {
      kind: 'text',
      title: 'Parámetros conocidos',
      body: `μ = ${fmt(mu)} y σ = ${fmt(sigma)} los da el enunciado; no se estiman con la muestra. zᵢ = (xᵢ − μ)/σ.`,
    },
    ecdfTableStep(cmp, opts.mode),
    ...dStatisticSteps(cmp),
  ];

  const crit = ksCritical(n, opts.alpha);
  steps.push({ kind: 'text', title: 'Valor crítico', body: `${crit.source}: D crítico (n = ${n}, α = ${fmt(opts.alpha)}) = ${fmt(crit.value)}.` });

  let pValue: number | undefined;
  if (opts.mode === 'exacto') {
    pValue = kolmogorov.sf(cmp.D, n);
    steps.push({ kind: 'text', title: 'Valor p', body: `P(Dₙ ≥ ${fix(cmp.D, 4)}) = ${fmtP(pValue)} (distribución exacta de Kolmogorov).` });
  }

  const comparison = opts.mode === 'exacto' ? compareP(pValue!, opts.alpha) : compareUpper('D', cmp.D, crit.value, 3);
  const conclusion = normalityConclusion(comparison, opts.alpha, opts);
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'ks',
    testName: 'Kolmogorov-Smirnov (parámetros conocidos)',
    family: 'normalidad',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'D', value: cmp.D },
    criticalValue: crit,
    pValue,
    decision: comparison.decision,
    conclusion,
    warnings: [],
    steps,
    chart: ecdfChart(cmp, mu, sigma),
  };
}
