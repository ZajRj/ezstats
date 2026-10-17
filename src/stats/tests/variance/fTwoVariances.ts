import type { Step, Tail, TestOptions, TestResult } from '../../types';
import { fDist } from '../../core/distributions';
import { variance } from '../../core/descriptive';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareLower, compareP, compareUpper, significance } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha } from '../common';
import type { Group } from '../anova/anovaCore';
import { StatsInputError } from '../../types';

const H1: Record<Tail, string> = { two: '≠', left: '<', right: '>' };

export function fTwoVariances(groups: [Group, Group], params: { tail: Tail }, opts: TestOptions): TestResult {
  requireAlpha(opts.alpha);
  const [g1, g2] = groups;
  if (g1.values.length < 2 || g2.values.length < 2) {
    throw new StatsInputError('Cada muestra necesita al menos 2 datos para la prueba F.');
  }
  const { tail } = params;
  const a = opts.alpha;
  const s1 = variance(g1.values);
  const s2 = variance(g2.values);
  const n1 = g1.values.length;
  const n2 = g2.values.length;
  if (s1 === 0 || s2 === 0) throw new StatsInputError('Una de las muestras tiene varianza 0; F no está definida.');
  const hypotheses = { h0: 'σ₁² = σ₂²', h1: `σ₁² ${H1[tail]} σ₂²` };

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'table',
      title: 'Varianzas muestrales',
      columns: ['Muestra', 'n', 's²', 'gl'],
      rows: [
        [`${g1.label} (1)`, n1, fix(s1, 4), n1 - 1],
        [`${g2.label} (2)`, n2, fix(s2, 4), n2 - 1],
      ],
    },
  ];

  // Two-sided, table mode: larger variance on top, compared with F_{α/2}.
  const swap = tail === 'two' && opts.mode === 'tabla' && s2 > s1;
  const num = swap ? s2 : s1;
  const den = swap ? s1 : s2;
  const df1 = (swap ? n2 : n1) - 1;
  const df2 = (swap ? n1 : n2) - 1;
  const F = num / den;
  if (tail === 'two' && opts.mode === 'tabla') {
    steps.push({
      kind: 'text',
      title: 'Convención para la prueba bilateral',
      body:
        'Se coloca la varianza mayor en el numerador, así F ≥ 1 y basta comparar con el valor crítico de la cola derecha F(1 − α/2).' +
        (swap ? ` Aquí s₂² > s₁², por lo que el numerador es la muestra 2 y gl = (${df1}, ${df2}).` : ''),
    });
  }
  steps.push({
    kind: 'formula',
    title: 'Estadístico de prueba',
    expression: swap ? 'F = s₂² / s₁²' : 'F = s₁² / s₂²',
    substituted: `F = ${fmt(num)} / ${fmt(den)}`,
    result: `F = ${fmt(F)}  (gl = ${df1}, ${df2})`,
  });

  const cdf = fDist.cdf(F, df1, df2);
  const sf = fDist.sf(F, df1, df2);
  const pValue = tail === 'two' ? Math.min(1, 2 * Math.min(cdf, sf)) : tail === 'left' ? cdf : sf;
  const q = (p: number) => (opts.mode === 'tabla' ? round(fDist.quantile(p, df1, df2), 2) : fDist.quantile(p, df1, df2));
  const d = opts.mode === 'tabla' ? 2 : 4;
  const src = `Tabla F con (${df1}, ${df2}) gl`;

  let comparison;
  let criticalValue: TestResult['criticalValue'];
  if (opts.mode === 'exacto') {
    steps.push({ kind: 'text', title: 'Valor p', body: `p = ${fmtP(pValue)}${tail === 'two' ? ' (bilateral: 2 · mín(P(F ≤ f), P(F ≥ f)))' : ''}.` });
    comparison = compareP(pValue, a);
  } else if (tail === 'left') {
    const crit = q(a);
    criticalValue = { value: crit, source: src };
    steps.push({ kind: 'text', title: 'Valor crítico', body: `F(${fmt(a)}; ${df1}, ${df2}) = ${fix(crit, d)}.` });
    comparison = compareLower('F', F, crit, d);
  } else {
    const p = tail === 'two' ? 1 - a / 2 : 1 - a;
    const crit = q(p);
    criticalValue = { value: crit, source: src };
    steps.push({ kind: 'text', title: 'Valor crítico', body: `F(${fmt(p)}; ${df1}, ${df2}) = ${fix(crit, d)}.` });
    comparison = compareUpper('F', F, crit, d);
  }

  const relation = tail === 'two' ? 'son diferentes' : tail === 'left' ? 'σ₁² es menor que σ₂²' : 'σ₁² es mayor que σ₂²';
  const tailText =
    comparison.decision === 'reject'
      ? tail === 'two' ? 'las varianzas de las dos poblaciones son diferentes.' : `${relation}.`
      : tail === 'two'
        ? 'no hay evidencia para afirmar que las varianzas de las dos poblaciones sean diferentes.'
        : `no hay evidencia para afirmar que ${relation}.`;
  const conclusion = `${comparison.phrase}. ${significance(a)}, ${tailText}`;
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'fTwoVariances',
    testName: 'F para dos varianzas',
    family: 'varianza',
    alpha: a,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'F', value: F },
    df: [df1, df2],
    criticalValue,
    pValue: opts.mode === 'exacto' ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings: ['La prueba F es muy sensible a la falta de normalidad; con datos no normales usa Levene.'],
    steps,
  };
}
