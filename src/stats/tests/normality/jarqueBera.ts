import type { Step, TestOptions, TestResult } from '../../types';
import { chiSquare } from '../../core/distributions';
import { centralMoment, mean } from '../../core/descriptive';
import { fmt, fmtP, round } from '../../core/rounding';
import { compareP, compareUpper, normalityConclusion, normalityHypotheses } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireN } from '../common';

export function jarqueBera(values: number[], opts: TestOptions): TestResult {
  requireN(values, 3, 'Jarque-Bera');
  requireAlpha(opts.alpha);
  const n = values.length;
  const m2 = centralMoment(values, 2);
  const m3 = centralMoment(values, 3);
  const m4 = centralMoment(values, 4);
  const S = m3 / Math.pow(m2, 1.5);
  const K = m4 / (m2 * m2);
  const JB = (n / 6) * (S * S + ((K - 3) * (K - 3)) / 4);
  const pValue = chiSquare.sf(JB, 2);
  const hypotheses = normalityHypotheses(opts);
  const warnings = n < 30 ? ['n < 30: el valor p asintótico de Jarque-Bera no es confiable con muestras pequeñas.'] : [];

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'formula',
      title: 'Momentos centrales (con n en el denominador)',
      expression: 'mₖ = Σ(xᵢ − x̄)ᵏ / n',
      substituted: `x̄ = ${fmt(mean(values))}`,
      result: `m₂ = ${fmt(m2)},  m₃ = ${fmt(m3)},  m₄ = ${fmt(m4)}`,
    },
    {
      kind: 'formula',
      title: 'Asimetría y curtosis',
      expression: 'S = m₃ / m₂^{3/2},  K = m₄ / m₂²',
      result: `S = ${fmt(S)},  K = ${fmt(K)}`,
    },
    {
      kind: 'formula',
      title: 'Estadístico de prueba',
      expression: 'JB = (n/6) [S² + (K − 3)²/4]',
      substituted: `JB = (${n}/6) [${fmt(S)}² + (${fmt(K)} − 3)²/4]`,
      result: `JB = ${fmt(JB)}`,
    },
  ];

  let comparison;
  let criticalValue: TestResult['criticalValue'];
  if (opts.mode === 'tabla') {
    const crit = round(chiSquare.quantile(1 - opts.alpha, 2), 3);
    criticalValue = { value: crit, source: `Tabla χ² con 2 gl, α = ${fmt(opts.alpha)}` };
    steps.push({ kind: 'text', title: 'Valor crítico', body: `χ²(${fmt(1 - opts.alpha)}; 2) = ${fmt(crit, 3)}.` });
    comparison = compareUpper('JB', JB, crit, 3);
  } else {
    steps.push({ kind: 'text', title: 'Valor p', body: `p = P(χ²₂ ≥ ${fmt(JB)}) = ${fmtP(pValue)}.` });
    comparison = compareP(pValue, opts.alpha);
  }
  const conclusion = normalityConclusion(comparison, opts.alpha, opts);
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'jarqueBera',
    testName: 'Jarque-Bera',
    family: 'normalidad',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'JB', value: JB },
    df: 2,
    criticalValue,
    pValue: opts.mode === 'exacto' ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
  };
}
