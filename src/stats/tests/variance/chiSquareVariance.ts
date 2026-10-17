import type { Step, Tail, TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import { chiSquare } from '../../core/distributions';
import { variance } from '../../core/descriptive';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareLower, compareP, compareTwoSided, compareUpper, significance } from '../../text';
import { conclusionStep, dataStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireN } from '../common';

const H1: Record<Tail, string> = { two: '≠', left: '<', right: '>' };
const H1_TEXT: Record<Tail, string> = { two: 'es diferente de', left: 'es menor que', right: 'es mayor que' };

export function chiSquareVariance(
  values: number[],
  params: { sigma0sq: number; tail: Tail },
  opts: TestOptions,
): TestResult {
  requireN(values, 2, 'La prueba χ² para una varianza');
  requireAlpha(opts.alpha);
  const { sigma0sq, tail } = params;
  if (!(sigma0sq > 0)) throw new StatsInputError('Ingresa σ₀² mayor que 0.');
  const n = values.length;
  const df = n - 1;
  const s2 = variance(values);
  const chi2 = (df * s2) / sigma0sq;
  const a = opts.alpha;
  const q = (p: number) => (opts.mode === 'tabla' ? round(chiSquare.quantile(p, df), 3) : chiSquare.quantile(p, df));
  const hypotheses = { h0: `σ² = ${fmt(sigma0sq)}`, h1: `σ² ${H1[tail]} ${fmt(sigma0sq)}` };

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    dataStep(values),
    { kind: 'formula', title: 'Varianza muestral', expression: 's² = Σ(xᵢ − x̄)² / (n − 1)', result: `s² = ${fmt(s2)}` },
    {
      kind: 'formula',
      title: 'Estadístico de prueba',
      expression: 'χ² = (n − 1) s² / σ₀²,   gl = n − 1',
      substituted: `χ² = ${df} · ${fmt(s2)} / ${fmt(sigma0sq)}`,
      result: `χ² = ${fmt(chi2)}  (gl = ${df})`,
    },
  ];

  const cdf = chiSquare.cdf(chi2, df);
  const sf = chiSquare.sf(chi2, df);
  const pValue = tail === 'two' ? Math.min(1, 2 * Math.min(cdf, sf)) : tail === 'left' ? cdf : sf;
  const d = opts.mode === 'tabla' ? 3 : 4;

  let comparison;
  let criticalValue: TestResult['criticalValue'];
  let criticalLower: TestResult['criticalLower'];
  const src = `Tabla χ² con ${df} gl`;
  if (tail === 'two') {
    const lo = q(a / 2);
    const hi = q(1 - a / 2);
    criticalLower = { value: lo, source: src };
    criticalValue = { value: hi, source: src };
    steps.push({
      kind: 'text',
      title: 'Valores críticos (bilateral)',
      body: `χ²(${fmt(a / 2)}; ${df}) = ${fix(lo, d)}  y  χ²(${fmt(1 - a / 2)}; ${df}) = ${fix(hi, d)}. Se rechaza H₀ si χ² cae fuera de ese intervalo.`,
    });
    comparison = opts.mode === 'exacto' ? compareP(pValue, a) : compareTwoSided('χ²', chi2, lo, hi, d);
  } else if (tail === 'left') {
    const lo = q(a);
    criticalValue = { value: lo, source: src };
    steps.push({ kind: 'text', title: 'Valor crítico (cola izquierda)', body: `χ²(${fmt(a)}; ${df}) = ${fix(lo, d)}.` });
    comparison = opts.mode === 'exacto' ? compareP(pValue, a) : compareLower('χ²', chi2, lo, d);
  } else {
    const hi = q(1 - a);
    criticalValue = { value: hi, source: src };
    steps.push({ kind: 'text', title: 'Valor crítico (cola derecha)', body: `χ²(${fmt(1 - a)}; ${df}) = ${fix(hi, d)}.` });
    comparison = opts.mode === 'exacto' ? compareP(pValue, a) : compareUpper('χ²', chi2, hi, d);
  }
  if (opts.mode === 'exacto') steps.push({ kind: 'text', title: 'Valor p', body: `p = ${fmtP(pValue)}.` });

  const lowCI = (df * s2) / chiSquare.quantile(1 - a / 2, df);
  const highCI = (df * s2) / chiSquare.quantile(a / 2, df);
  steps.push({
    kind: 'formula',
    title: `Intervalo de confianza del ${fmt((1 - a) * 100, 2)} % para σ²`,
    expression: '[(n − 1)s² / χ²(1 − α/2), (n − 1)s² / χ²(α/2)]',
    result: `[${fmt(lowCI)}, ${fmt(highCI)}]`,
  });

  const tailText =
    comparison.decision === 'reject'
      ? `la varianza poblacional ${H1_TEXT[tail]} ${fmt(sigma0sq)}.`
      : `no hay evidencia para afirmar que la varianza poblacional ${H1_TEXT[tail]} ${fmt(sigma0sq)}.`;
  const conclusion = `${comparison.phrase}. ${significance(a)}, ${tailText}`;
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'chiSquareVariance',
    testName: 'χ² para una varianza',
    family: 'varianza',
    alpha: a,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'χ²', value: chi2 },
    df,
    criticalValue,
    criticalLower,
    pValue: opts.mode === 'exacto' ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings: ['La prueba χ² para la varianza es muy sensible a la falta de normalidad; verifica la normalidad antes.'],
    steps,
  };
}
