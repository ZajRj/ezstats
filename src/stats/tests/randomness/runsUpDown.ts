import type { Step, TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import { normal } from '../../core/distributions';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareP, compareTwoSided, randomnessConclusion, randomnessHypotheses } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireN } from '../common';
import { countRuns, runsDirection } from './runsMedian';

/** Runs up and down (Wallis & Moore 1941). Ties between consecutive values are ignored. */
export function runsUpDown(values: number[], opts: TestOptions): TestResult {
  requireN(values, 5, 'La prueba de rachas ascendentes y descendentes');
  requireAlpha(opts.alpha);
  const marks: (1 | -1 | 0)[] = [0];
  for (let i = 1; i < values.length; i++) {
    marks.push(values[i] > values[i - 1] ? 1 : values[i] < values[i - 1] ? -1 : 0);
  }
  const signs = marks.slice(1).filter((s) => s !== 0);
  const ties = values.length - 1 - signs.length;
  if (signs.length < 2) throw new StatsInputError('Hay muy pocos cambios entre valores consecutivos para contar rachas.');
  const n = signs.length + 1;
  const R = countRuns(signs);
  const mu = (2 * n - 1) / 3;
  const varR = (16 * n - 29) / 90;
  const sigma = Math.sqrt(varR);
  const Z = (R - mu) / sigma;
  const hypotheses = randomnessHypotheses();

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'table',
      title: 'Secuencia en el orden ingresado y dirección del cambio',
      columns: ['i', 'xᵢ', 'xᵢ vs xᵢ₋₁'],
      rows: values.map((x, i) => [i + 1, fmt(x), i === 0 ? '' : marks[i] === 1 ? '↑' : marks[i] === -1 ? '↓' : 'empate (se ignora)']),
      highlight: marks.flatMap((m, i) => (i > 0 && m === 0 ? [{ row: i, col: 2 }] : [])),
    },
    {
      kind: 'text',
      title: 'Conteo de rachas',
      body:
        (ties > 0 ? `Se ignoran ${ties} empate(s) entre valores consecutivos, así que n efectivo = ${n}. ` : '') +
        `Signos: ${signs.map((s) => (s === 1 ? '↑' : '↓')).join(' ')}\nR = ${R} rachas, n = ${n}.`,
    },
    {
      kind: 'formula',
      title: 'Media y varianza de R',
      expression: 'μ_R = (2n − 1)/3,   σ²_R = (16n − 29)/90',
      substituted: `μ_R = (2·${n} − 1)/3,   σ²_R = (16·${n} − 29)/90`,
      result: `μ_R = ${fmt(mu)},  σ_R = ${fmt(sigma)}`,
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
  let comparison;
  let criticalValue: TestResult['criticalValue'];
  let criticalLower: TestResult['criticalLower'];
  if (opts.mode === 'tabla') {
    const z = round(normal.quantile(1 - a / 2), 2);
    criticalValue = { value: z, source: 'Tabla normal estándar' };
    criticalLower = { value: -z, source: 'Tabla normal estándar' };
    steps.push({ kind: 'text', title: 'Valores críticos', body: `Bilateral: ±z(${fmt(1 - a / 2)}) = ±${fix(z, 2)}.` });
    comparison = compareTwoSided('Z', Z, -z, z, 2);
  } else {
    steps.push({ kind: 'text', title: 'Valor p', body: `p = 2·P(Z ≥ |${fmt(Z)}|) = ${fmtP(pValue)}.` });
    comparison = compareP(pValue, a);
  }
  const warnings = n < 20 ? ['n < 20: la aproximación normal de R es poco precisa.'] : [];
  const conclusion = randomnessConclusion(comparison, a, runsDirection(R, mu));
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'runsUpDown',
    testName: 'Rachas ascendentes y descendentes',
    family: 'aleatoriedad',
    alpha: a,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'Z', value: Z },
    criticalValue,
    criticalLower,
    pValue: opts.mode === 'exacto' ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
    chart: { kind: 'updown', values, signs: marks },
  };
}
