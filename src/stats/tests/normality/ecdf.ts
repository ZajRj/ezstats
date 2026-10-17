import type { ChartSpec, Mode, Step } from '../../types';
import { frequencies } from '../../core/descriptive';
import { normal } from '../../core/distributions';
import { fix, fmt, round, tableRounder } from '../../core/rounding';

export interface EcdfRow {
  x: number;
  f: number;
  F: number;
  Fn: number;
  Fprev: number;
  z: number;
  Phi: number;
  Dplus: number;
  Dminus: number;
}

export interface EcdfComparison {
  rows: EcdfRow[];
  Dplus: number;
  Dminus: number;
  D: number;
  iPlus: number;
  iMinus: number;
}

/**
 * Groups repeated values into one row and compares the empirical CDF with
 * N(μ, σ). n is the total number of observations, not the number of rows.
 */
export function compareEcdf(values: number[], mu: number, sigma: number, mode: Mode): EcdfComparison {
  const r = tableRounder(mode);
  const n = values.length;
  const rows: EcdfRow[] = [];
  let Fprev = 0;
  for (const { x, f, F } of frequencies(values)) {
    const z = r.z((x - mu) / sigma);
    const Phi = r.p(normal.cdf(z));
    const Fn = F / n;
    // Rounded to 4 decimals in table mode so the subtraction shows no float noise.
    const Dplus = mode === 'tabla' ? round(Fn - Phi, 4) : Fn - Phi;
    const Dminus = mode === 'tabla' ? round(Phi - Fprev, 4) : Phi - Fprev;
    rows.push({ x, f, F, Fn, Fprev, z, Phi, Dplus, Dminus });
    Fprev = Fn;
  }
  let iPlus = 0;
  let iMinus = 0;
  rows.forEach((row, i) => {
    if (row.Dplus > rows[iPlus].Dplus) iPlus = i;
    if (row.Dminus > rows[iMinus].Dminus) iMinus = i;
  });
  const Dplus = rows[iPlus].Dplus;
  const Dminus = rows[iMinus].Dminus;
  return { rows, Dplus, Dminus, D: Math.max(Dplus, Dminus), iPlus, iMinus };
}

export function ecdfTableStep(cmp: EcdfComparison, mode: Mode): Step {
  const zd = mode === 'tabla' ? 2 : 4;
  const highlight: { row: number; col: number }[] = [];
  cmp.rows.forEach((row, i) => {
    if (row.f > 1) highlight.push({ row: i, col: 1 });
  });
  highlight.push({ row: cmp.iPlus, col: 7 }, { row: cmp.iMinus, col: 8 });
  return {
    kind: 'table',
    title: 'Tabla de frecuencias y comparación con la normal',
    columns: ['xᵢ', 'fᵢ', 'Fᵢ', 'Fᵢ/n', 'Fᵢ₋₁/n', 'zᵢ', 'Φ(zᵢ)', 'D⁺', 'D⁻'],
    rows: cmp.rows.map((row) => [
      fmt(row.x),
      row.f,
      row.F,
      fix(row.Fn, 4),
      fix(row.Fprev, 4),
      fix(row.z, zd),
      fix(row.Phi, 4),
      fix(row.Dplus, 4),
      fix(row.Dminus, 4),
    ]),
    highlight,
  };
}

export function ecdfChart(cmp: EcdfComparison, mu: number, sigma: number): ChartSpec {
  const useMinus = cmp.Dminus > cmp.Dplus;
  const row = cmp.rows[useMinus ? cmp.iMinus : cmp.iPlus];
  return {
    kind: 'ecdf',
    points: cmp.rows.map((r) => ({ x: r.x, F: r.Fn, Fprev: r.Fprev })),
    mean: mu,
    sd: sigma,
    dAt: useMinus ? { x: row.x, from: row.Fprev, to: row.Phi } : { x: row.x, from: row.Phi, to: row.Fn },
  };
}

export function dStatisticSteps(cmp: EcdfComparison): Step[] {
  const plusRow = cmp.rows[cmp.iPlus];
  const minusRow = cmp.rows[cmp.iMinus];
  return [
    {
      kind: 'formula',
      title: 'Estadístico de prueba',
      expression: 'D⁺ = máx(Fᵢ/n − Φ(zᵢ)),  D⁻ = máx(Φ(zᵢ) − Fᵢ₋₁/n),  D = máx(D⁺, D⁻)',
      substituted: `D⁺ = ${fix(cmp.Dplus, 4)} (en x = ${fmt(plusRow.x)}),  D⁻ = ${fix(cmp.Dminus, 4)} (en x = ${fmt(minusRow.x)})`,
      result: `D = ${fix(cmp.D, 4)}`,
    },
  ];
}
