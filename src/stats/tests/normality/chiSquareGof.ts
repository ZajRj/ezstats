import type { Step, TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import { chiSquare, normal } from '../../core/distributions';
import { mean, sd } from '../../core/descriptive';
import { fix, fmt, fmtP, round, tableRounder } from '../../core/rounding';
import { compareP, compareUpper, normalityConclusion, normalityHypotheses } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireN } from '../common';

export function sturges(n: number): number {
  return Math.round(1 + 3.322 * Math.log10(n));
}

interface Bin {
  lower: number; // -Infinity for the first
  upper: number; // +Infinity for the last
  O: number;
  E: number;
  label: string;
}

const intervalLabel = (lo: number, hi: number) =>
  `${isFinite(lo) ? `[${fmt(lo)}` : '(−∞'}, ${isFinite(hi) ? `${fmt(hi)})` : '+∞)'}`;

/** χ² goodness of fit to a normal with μ and σ estimated (df = k − 1 − 2). */
export function chiSquareGof(values: number[], params: { k?: number }, opts: TestOptions): TestResult {
  requireN(values, 10, 'La prueba χ² de bondad de ajuste');
  requireAlpha(opts.alpha);
  const n = values.length;
  const r = tableRounder(opts.mode);
  const xbar = mean(values);
  const s = sd(values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const k0 = params.k && params.k >= 2 ? Math.round(params.k) : sturges(n);
  if (k0 < 4) throw new StatsInputError('Se necesitan al menos 4 intervalos para tener gl ≥ 1.');
  const width = (max - min) / k0;
  if (width === 0) throw new StatsInputError('Todos los datos son iguales; no se pueden formar intervalos.');

  // Inner boundaries min + j·w for j = 1..k−1; outer intervals are open.
  const bounds = Array.from({ length: k0 - 1 }, (_, j) => min + (j + 1) * width);
  const edges = [-Infinity, ...bounds, Infinity];
  const cdfAt = (b: number) => {
    if (b === -Infinity) return { z: -Infinity, Phi: 0 };
    if (b === Infinity) return { z: Infinity, Phi: 1 };
    const z = r.z((b - xbar) / s);
    return { z, Phi: r.p(normal.cdf(z)) };
  };
  const edgeCdf = edges.map(cdfAt);

  let bins: Bin[] = [];
  for (let j = 0; j < k0; j++) {
    const lo = edges[j];
    const hi = edges[j + 1];
    const O = values.filter((x) => (j === 0 || x >= lo) && (j === k0 - 1 || x < hi)).length;
    const pj = edgeCdf[j + 1].Phi - edgeCdf[j].Phi;
    const E = opts.mode === 'tabla' ? round(n * pj, 4) : n * pj;
    bins.push({ lower: lo, upper: hi, O, E, label: intervalLabel(lo, hi) });
  }

  const hypotheses = normalityHypotheses(opts);
  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'text',
      title: 'Parámetros y número de intervalos',
      body:
        `x̄ = ${fmt(xbar)}, s = ${fmt(s)}, n = ${n}. ` +
        (params.k ? `k = ${k0} (elegido por el usuario).` : `Regla de Sturges: k = 1 + 3.322·log₁₀(${n}) ≈ ${k0}.`) +
        ` Ancho = (máx − mín)/k = (${fmt(max)} − ${fmt(min)})/${k0} = ${fmt(width)}. ` +
        'El primer y el último intervalo son abiertos (−∞ y +∞) para que las probabilidades sumen 1.',
    },
    {
      kind: 'table',
      title: 'Frecuencias observadas y esperadas',
      columns: ['Intervalo', 'Oᵢ', 'z inferior', 'z superior', 'Φ(z sup) − Φ(z inf)', 'Eᵢ = n·pᵢ'],
      rows: bins.map((b, j) => [
        b.label,
        b.O,
        isFinite(edgeCdf[j].z) ? fix(edgeCdf[j].z, opts.mode === 'tabla' ? 2 : 4) : '−∞',
        isFinite(edgeCdf[j + 1].z) ? fix(edgeCdf[j + 1].z, opts.mode === 'tabla' ? 2 : 4) : '+∞',
        fix(edgeCdf[j + 1].Phi - edgeCdf[j].Phi, 4),
        fix(b.E, 4),
      ]),
    },
  ];

  // Merge adjacent intervals while any Eᵢ < 5: the smallest one joins its smaller neighbour.
  const merges: string[] = [];
  while (bins.length > 1) {
    let idx = -1;
    bins.forEach((b, i) => {
      if (b.E < 5 && (idx < 0 || b.E < bins[idx].E)) idx = i;
    });
    if (idx < 0) break;
    const nb =
      idx === 0 ? 1 : idx === bins.length - 1 ? idx - 1 : bins[idx - 1].E <= bins[idx + 1].E ? idx - 1 : idx + 1;
    const [a, b] = idx < nb ? [bins[idx], bins[nb]] : [bins[nb], bins[idx]];
    const merged: Bin = {
      lower: a.lower,
      upper: b.upper,
      O: a.O + b.O,
      E: a.E + b.E,
      label: intervalLabel(a.lower, b.upper),
    };
    merges.push(`${a.label} + ${b.label} → ${merged.label} (E = ${fmt(merged.E)})`);
    bins.splice(Math.min(idx, nb), 2, merged);
  }
  if (merges.length) {
    steps.push({
      kind: 'text',
      title: 'Unión de intervalos con Eᵢ < 5',
      body: merges.join('\n'),
    });
  }
  const k = bins.length;
  const df = k - 1 - 2;
  if (df < 1) {
    throw new StatsInputError(
      `Tras unir intervalos con Eᵢ < 5 quedan ${k}; gl = k − 3 = ${df}. Se necesitan más datos o más intervalos.`,
    );
  }

  let chi2 = 0;
  const finalRows = bins.map((b) => {
    const term = ((b.O - b.E) * (b.O - b.E)) / b.E;
    chi2 += term;
    return [b.label, b.O, fix(b.E, 4), fix(b.O - b.E, 4), fix(term, 4)];
  });
  steps.push(
    { kind: 'table', title: 'Cálculo de χ²', columns: ['Intervalo', 'Oᵢ', 'Eᵢ', 'Oᵢ − Eᵢ', '(Oᵢ − Eᵢ)²/Eᵢ'], rows: finalRows },
    {
      kind: 'formula',
      title: 'Estadístico de prueba',
      expression: 'χ² = Σ (Oᵢ − Eᵢ)² / Eᵢ,   gl = k − 1 − 2',
      substituted: `gl = ${k} − 1 − 2 = ${df}`,
      result: `χ² = ${fmt(chi2)}`,
    },
  );

  const pValue = chiSquare.sf(chi2, df);
  let comparison;
  let criticalValue: TestResult['criticalValue'];
  if (opts.mode === 'tabla') {
    const crit = round(chiSquare.quantile(1 - opts.alpha, df), 3);
    criticalValue = { value: crit, source: `Tabla χ² con ${df} gl` };
    steps.push({ kind: 'text', title: 'Valor crítico', body: `χ²(${fmt(1 - opts.alpha)}; ${df}) = ${fix(crit, 3)}.` });
    comparison = compareUpper('χ²', chi2, crit, 3);
  } else {
    steps.push({ kind: 'text', title: 'Valor p', body: `p = P(χ²_${df} ≥ ${fmt(chi2)}) = ${fmtP(pValue)}.` });
    comparison = compareP(pValue, opts.alpha);
  }
  const conclusion = normalityConclusion(comparison, opts.alpha, opts);
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'chiSquareGof',
    testName: 'χ² de bondad de ajuste (normal)',
    family: 'normalidad',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'χ²', value: chi2 },
    df,
    criticalValue,
    pValue: opts.mode === 'exacto' ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings: [],
    steps,
  };
}
