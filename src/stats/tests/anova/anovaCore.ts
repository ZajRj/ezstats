import type { Step } from '../../types';
import { mean, variance } from '../../core/descriptive';
import { fDist } from '../../core/distributions';
import { fix, fmt, fmtP } from '../../core/rounding';

export interface Group {
  label: string;
  values: number[];
}

export interface AnovaCore {
  k: number;
  N: number;
  ns: number[];
  means: number[];
  variances: number[];
  grandMean: number;
  ssBetween: number;
  ssWithin: number;
  ssTotal: number;
  dfBetween: number;
  dfWithin: number;
  msBetween: number;
  msWithin: number;
  F: number;
  p: number;
}

export function anovaCore(groups: Group[]): AnovaCore {
  const k = groups.length;
  const ns = groups.map((g) => g.values.length);
  const N = ns.reduce((a, b) => a + b, 0);
  const means = groups.map((g) => mean(g.values));
  const variances = groups.map((g) => (g.values.length > 1 ? variance(g.values) : 0));
  const all = groups.flatMap((g) => g.values);
  const grandMean = mean(all);
  let ssBetween = 0;
  let ssWithin = 0;
  groups.forEach((g, i) => {
    ssBetween += ns[i] * (means[i] - grandMean) ** 2;
    for (const x of g.values) ssWithin += (x - means[i]) ** 2;
  });
  let ssTotal = 0;
  for (const x of all) ssTotal += (x - grandMean) ** 2;
  const dfBetween = k - 1;
  const dfWithin = N - k;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const F = msWithin === 0 ? Infinity : msBetween / msWithin;
  const p = isFinite(F) ? fDist.sf(F, dfBetween, dfWithin) : 0;
  return { k, N, ns, means, variances, grandMean, ssBetween, ssWithin, ssTotal, dfBetween, dfWithin, msBetween, msWithin, F, p };
}

export function groupSummaryStep(groups: Group[], core: AnovaCore, title = 'Resumen por grupo'): Step {
  return {
    kind: 'table',
    title,
    columns: ['Grupo', 'nⱼ', 'Σxⱼ', 'x̄ⱼ', 'sⱼ²'],
    rows: groups.map((g, i) => [
      g.label,
      core.ns[i],
      fmt(g.values.reduce((a, b) => a + b, 0)),
      fix(core.means[i], 4),
      fix(core.variances[i], 4),
    ]),
  };
}

/** Sums of squares, the SC_total check and the classic ANOVA table. */
export function anovaSteps(core: AnovaCore, critical?: number): Step[] {
  const lastCol = critical !== undefined ? 'F crítico' : 'p';
  const lastVal = critical !== undefined ? fix(critical, 2) : fmtP(core.p);
  return [
    {
      kind: 'formula',
      title: 'Media general',
      expression: 'x̄ = Σ nⱼ x̄ⱼ / N',
      result: `x̄ = ${fmt(core.grandMean)}  (N = ${core.N})`,
    },
    {
      kind: 'formula',
      title: 'Suma de cuadrados entre grupos',
      expression: 'SC_entre = Σ nⱼ (x̄ⱼ − x̄)²',
      substituted: core.means.map((m, i) => `${core.ns[i]}(${fmt(m)} − ${fmt(core.grandMean)})²`).join(' + '),
      result: `SC_entre = ${fmt(core.ssBetween)}`,
    },
    {
      kind: 'formula',
      title: 'Suma de cuadrados dentro de los grupos',
      expression: 'SC_dentro = Σⱼ Σᵢ (xᵢⱼ − x̄ⱼ)² = Σ (nⱼ − 1) sⱼ²',
      substituted: core.variances.map((v, i) => `${core.ns[i] - 1}·${fmt(v)}`).join(' + '),
      result: `SC_dentro = ${fmt(core.ssWithin)}`,
    },
    {
      kind: 'formula',
      title: 'Suma de cuadrados total (comprobación)',
      expression: 'SC_total = Σ (xᵢⱼ − x̄)² = SC_entre + SC_dentro',
      substituted: `${fmt(core.ssBetween)} + ${fmt(core.ssWithin)} = ${fmt(core.ssBetween + core.ssWithin)}`,
      result: `SC_total = ${fmt(core.ssTotal)} ✓`,
    },
    {
      kind: 'table',
      title: 'Tabla ANOVA',
      columns: ['Fuente', 'SC', 'gl', 'CM', 'F', lastCol],
      rows: [
        ['Entre grupos', fix(core.ssBetween, 4), core.dfBetween, fix(core.msBetween, 4), fix(core.F, 4), lastVal],
        ['Dentro (error)', fix(core.ssWithin, 4), core.dfWithin, fix(core.msWithin, 4), '', ''],
        ['Total', fix(core.ssTotal, 4), core.N - 1, '', '', ''],
      ],
      highlight: [{ row: 0, col: 4 }],
    },
  ];
}
