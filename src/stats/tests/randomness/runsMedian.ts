import type { Step, TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import { normal } from '../../core/distributions';
import { median } from '../../core/descriptive';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { RUNS_TABLE_MAX, runsCritical } from '../../tables/runs';
import { compareP, compareTwoSided, randomnessConclusion, randomnessHypotheses, type Comparison } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireN } from '../common';

export function countRuns(signs: number[]): number {
  if (signs.length === 0) return 0;
  let R = 1;
  for (let i = 1; i < signs.length; i++) if (signs[i] !== signs[i - 1]) R++;
  return R;
}

export function runsDirection(R: number, mu: number): string {
  return R < mu
    ? 'hay muy pocas rachas, lo que sugiere agrupamiento o una tendencia'
    : 'hay demasiadas rachas, lo que sugiere una alternancia sistemática';
}

/** Wald-Wolfowitz runs test above/below the median. Input order is preserved. */
export function runsMedian(values: number[], opts: TestOptions): TestResult {
  requireN(values, 4, 'La prueba de rachas');
  requireAlpha(opts.alpha);
  const med = median(values);
  const marks = values.map((x) => (x > med ? 1 : x < med ? -1 : 0)) as (1 | -1 | 0)[];
  const signs = marks.filter((s) => s !== 0);
  const excluded = marks.length - signs.length;
  const n1 = signs.filter((s) => s === 1).length;
  const n2 = signs.filter((s) => s === -1).length;
  if (n1 === 0 || n2 === 0) {
    throw new StatsInputError('Todos los datos quedan del mismo lado de la mediana; no se pueden contar rachas.');
  }
  const R = countRuns(signs);
  const N = n1 + n2;
  const mu = (2 * n1 * n2) / N + 1;
  const varR = (2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) / (N * N * (N - 1));
  const sigma = Math.sqrt(varR);
  const Z = (R - mu) / sigma;
  const hypotheses = randomnessHypotheses();

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'text',
      title: 'Secuencia (en el orden ingresado)',
      body: `${values.map((v) => fmt(v)).join(', ')}\nEn esta prueba el orden importa: los datos no se ordenan.`,
    },
    { kind: 'formula', title: 'Mediana', expression: 'Me', result: `Me = ${fmt(med)}` },
    {
      kind: 'table',
      title: 'Signos respecto a la mediana',
      columns: ['i', 'xᵢ', 'signo'],
      rows: values.map((x, i) => [i + 1, fmt(x), marks[i] === 1 ? '+' : marks[i] === -1 ? '−' : 'excluido']),
      highlight: marks.flatMap((m, i) => (m === 0 ? [{ row: i, col: 2 }] : [])),
    },
    {
      kind: 'text',
      title: 'Conteo de rachas',
      body:
        (excluded > 0 ? `Se excluyen ${excluded} valor(es) iguales a la mediana. ` : '') +
        `Secuencia de signos: ${signs.map((s) => (s === 1 ? '+' : '−')).join(' ')}\n` +
        `n₁ (+) = ${n1}, n₂ (−) = ${n2}, R = ${R} rachas.`,
    },
    {
      kind: 'formula',
      title: 'Media de R',
      expression: 'μ_R = 2n₁n₂/(n₁ + n₂) + 1',
      substituted: `μ_R = 2·${n1}·${n2}/${N} + 1`,
      result: `μ_R = ${fmt(mu)}`,
    },
    {
      kind: 'formula',
      title: 'Desviación estándar de R',
      expression: 'σ²_R = 2n₁n₂(2n₁n₂ − n₁ − n₂) / [(n₁ + n₂)²(n₁ + n₂ − 1)]',
      substituted: `σ²_R = 2·${n1}·${n2}·(2·${n1}·${n2} − ${n1} − ${n2}) / (${N}²·${N - 1})`,
      result: `σ²_R = ${fmt(varR)},  σ_R = ${fmt(sigma)}`,
    },
    {
      kind: 'formula',
      title: 'Estadístico Z',
      expression: 'Z = (R − μ_R) / σ_R',
      substituted: `Z = (${R} − ${fmt(mu)}) / ${fmt(sigma)}`,
      result: `Z = ${fmt(Z)}`,
    },
  ];

  const a = opts.alpha;
  const pValue = 2 * normal.sf(Math.abs(Z));
  let comparison: Comparison;
  let criticalValue: TestResult['criticalValue'];
  let criticalLower: TestResult['criticalLower'];
  let statistic = { symbol: 'Z', value: Z };
  const small = n1 <= RUNS_TABLE_MAX && n2 <= RUNS_TABLE_MAX;

  if (opts.mode === 'tabla' && small) {
    const crit = runsCritical(n1, n2, a);
    const src = 'Tabla de Swed y Eisenhart (1943), distribución exacta de R';
    const lo = crit.lower ?? -Infinity;
    const hi = crit.upper ?? Infinity;
    criticalLower = { value: lo, source: src };
    criticalValue = { value: hi, source: src };
    steps.push({
      kind: 'text',
      title: 'Valores críticos (muestra pequeña)',
      body:
        `Como n₁ y n₂ ≤ 20 se usa la tabla de Swed y Eisenhart con α = ${fmt(a)}: ` +
        `se rechaza H₀ si R ≤ ${crit.lower ?? '— (no existe)'} o R ≥ ${crit.upper ?? '— (no existe)'}.`,
    });
    statistic = { symbol: 'R', value: R };
    comparison = compareTwoSided('R', R, lo, hi, 0);
    if (crit.lower === null && crit.upper === null) {
      comparison = { decision: 'fail_to_reject', phrase: `Con n₁ = ${n1} y n₂ = ${n2} ningún R es significativo a este α, no se rechaza H₀` };
    }
  } else if (opts.mode === 'tabla') {
    const z = round(normal.quantile(1 - a / 2), 2);
    criticalLower = { value: -z, source: 'Tabla normal estándar' };
    criticalValue = { value: z, source: 'Tabla normal estándar' };
    steps.push({ kind: 'text', title: 'Valores críticos', body: `Bilateral: ±z(${fmt(1 - a / 2)}) = ±${fix(z, 2)}.` });
    comparison = compareTwoSided('Z', Z, -z, z, 2);
  } else {
    steps.push({ kind: 'text', title: 'Valor p', body: `p = 2·P(Z ≥ |${fmt(Z)}|) = ${fmtP(pValue)}.` });
    comparison = compareP(pValue, a);
  }

  const conclusion = randomnessConclusion(comparison, a, runsDirection(R, mu));
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'runsMedian',
    testName: 'Rachas sobre y bajo la mediana (Wald-Wolfowitz)',
    family: 'aleatoriedad',
    alpha: a,
    mode: opts.mode,
    hypotheses,
    statistic,
    criticalValue,
    criticalLower,
    pValue: opts.mode === 'exacto' ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings: [],
    steps,
    chart: { kind: 'runs', values, median: med, signs: marks },
  };
}
