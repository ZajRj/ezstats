import type { Step, TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import { normal } from '../../core/distributions';
import { sorted, sumSquares, mean } from '../../core/descriptive';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareP, normalityConclusion, normalityHypotheses } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha } from '../common';

// Royston (1995), Algorithm AS R94 — polynomial coefficients.
const C1 = [0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056];
const C2 = [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633];
const C3 = [0.544, -0.39978, 0.025054, -6.714e-4];
const C4 = [1.3822, -0.77857, 0.062767, -0.0020322];
const C5 = [-1.5861, -0.31082, -0.083751, 0.0038915];
const C6 = [-0.4803, -0.082676, 0.0030302];
const G = [-2.273, 0.459];

const poly = (c: number[], x: number) => c.reduceRight((acc, ci) => acc * x + ci, 0);

/** Coefficients a₁ … a_{n/2} (positive), Royston's approximation. */
export function shapiroWilkCoefficients(n: number): number[] {
  const nn2 = Math.floor(n / 2);
  if (n === 3) return [Math.SQRT1_2];
  const an25 = n + 0.25;
  const m: number[] = [];
  let summ2 = 0;
  for (let i = 1; i <= nn2; i++) {
    const mi = normal.quantile((i - 0.375) / an25);
    m.push(mi);
    summ2 += mi * mi;
  }
  summ2 *= 2;
  const ssumm2 = Math.sqrt(summ2);
  const rsn = 1 / Math.sqrt(n);
  const a1 = poly(C1, rsn) - m[0] / ssumm2;
  const a = new Array(nn2);
  let i1: number;
  let fac: number;
  if (n > 5) {
    i1 = 2;
    const a2 = -m[1] / ssumm2 + poly(C2, rsn);
    fac = Math.sqrt((summ2 - 2 * m[0] ** 2 - 2 * m[1] ** 2) / (1 - 2 * a1 ** 2 - 2 * a2 ** 2));
    a[1] = a2;
  } else {
    i1 = 1;
    fac = Math.sqrt((summ2 - 2 * m[0] ** 2) / (1 - 2 * a1 ** 2));
  }
  a[0] = a1;
  for (let i = i1; i < nn2; i++) a[i] = -m[i] / fac;
  return a;
}

/** Royston's normalizing transformation of W into a p-value. */
export function shapiroWilkPValue(W: number, n: number): number {
  if (n === 3) {
    const p = (6 / Math.PI) * (Math.asin(Math.sqrt(W)) - Math.PI / 3);
    return Math.max(0, Math.min(1, p));
  }
  const w1 = Math.log(1 - W);
  let y: number;
  let m: number;
  let s: number;
  if (n <= 11) {
    const gamma = poly(G, n);
    if (w1 >= gamma) return 1e-99;
    y = -Math.log(gamma - w1);
    m = poly(C3, n);
    s = Math.exp(poly(C4, n));
  } else {
    const xx = Math.log(n);
    m = poly(C5, xx);
    s = Math.exp(poly(C6, xx));
    y = w1;
  }
  return normal.sf(y, m, s);
}

export function shapiroWilk(values: number[], opts: TestOptions): TestResult {
  requireAlpha(opts.alpha);
  const n = values.length;
  if (n < 3 || n > 5000) throw new StatsInputError(`Shapiro-Wilk requiere entre 3 y 5000 datos (hay ${n}).`);
  const x = sorted(values);
  if (x[0] === x[n - 1]) throw new StatsInputError('Todos los datos son iguales; no se puede calcular W.');

  const a = shapiroWilkCoefficients(n);
  const rows: (string | number)[][] = [];
  let b = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = x[n - 1 - i] - x[i];
    const term = a[i] * diff;
    b += term;
    rows.push([i + 1, fmt(x[n - 1 - i]), fmt(x[i]), fmt(diff), fix(a[i], 4), fix(term, 4)]);
  }
  const SS = sumSquares(x);
  const Wraw = (b * b) / SS;
  const W = opts.mode === 'tabla' ? round(Wraw, 4) : Wraw;
  const pValue = shapiroWilkPValue(Wraw, n);
  const hypotheses = normalityHypotheses(opts);
  const warnings: string[] = [];
  if (n < 8) warnings.push('n pequeño: la prueba tiene poca potencia para detectar falta de normalidad.');

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    { kind: 'text', title: 'Datos ordenados', body: `${x.map((v) => fmt(v)).join(', ')}\n(n = ${n}, x̄ = ${fmt(mean(x))})` },
    {
      kind: 'text',
      title: 'Coeficientes aᵢ',
      body: 'Los coeficientes aᵢ se obtienen con el algoritmo de Royston (1995, AS R94), que aproxima la tabla de Shapiro-Wilk para 3 ≤ n ≤ 5000.',
    },
    {
      kind: 'table',
      title: 'Cálculo de b',
      columns: ['i', 'x₍ₙ₋ᵢ₊₁₎', 'x₍ᵢ₎', 'diferencia', 'aᵢ', 'aᵢ · diferencia'],
      rows,
    },
    {
      kind: 'formula',
      title: 'Numerador',
      expression: 'b = Σ aᵢ (x₍ₙ₋ᵢ₊₁₎ − x₍ᵢ₎)',
      result: `b = ${fmt(b)}`,
    },
    {
      kind: 'formula',
      title: 'Suma de cuadrados',
      expression: 'SS = Σ(xᵢ − x̄)²',
      result: `SS = ${fmt(SS)}`,
    },
    {
      kind: 'formula',
      title: 'Estadístico de prueba',
      expression: 'W = b² / SS',
      substituted: `W = ${fmt(b)}² / ${fmt(SS)}`,
      result: `W = ${fix(W, 4)}`,
    },
    {
      kind: 'text',
      title: 'Valor p',
      body:
        `Transformación normalizadora de Royston: p = ${fmtP(pValue)}. ` +
        'Valores pequeños de W indican falta de normalidad; se rechaza H₀ si p ≤ α.',
    },
  ];

  const comparison = compareP(pValue, opts.alpha);
  const conclusion = normalityConclusion(comparison, opts.alpha, opts);
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'shapiroWilk',
    testName: 'Shapiro-Wilk',
    family: 'normalidad',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'W', value: W },
    pValue,
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
  };
}
