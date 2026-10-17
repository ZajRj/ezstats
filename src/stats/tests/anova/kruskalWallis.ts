import type { Step, TestOptions, TestResult } from '../../types';
import { chiSquare } from '../../core/distributions';
import { rank } from '../../core/descriptive';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareP, compareUpper, equalMeansConclusion } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireGroups } from '../common';
import type { Group } from './anovaCore';
import { StatsInputError } from '../../types';

export function kruskalWallis(groups: Group[], opts: TestOptions): TestResult {
  requireGroups(groups.map((g) => g.values), 2, 1, 'Kruskal-Wallis');
  requireAlpha(opts.alpha);
  const k = groups.length;
  const all = groups.flatMap((g, j) => g.values.map((x) => ({ x, j })));
  const N = all.length;
  if (N < 3) throw new StatsInputError('Kruskal-Wallis necesita al menos 3 datos en total.');
  const { ranks, ties } = rank(all.map((d) => d.x));
  const ns = groups.map((g) => g.values.length);
  const R = new Array(k).fill(0);
  all.forEach((d, i) => (R[d.j] += ranks[i]));
  const sumTerm = R.reduce((acc, r, j) => acc + (r * r) / ns[j], 0);
  const H = (12 / (N * (N + 1))) * sumTerm - 3 * (N + 1);
  const tieSum = ties.reduce((acc, t) => acc + t ** 3 - t, 0);
  const C = 1 - tieSum / (N ** 3 - N);
  if (C === 0) throw new StatsInputError('Todos los datos son iguales; H no está definido.');
  const Hc = H / C;
  const df = k - 1;
  const pValue = chiSquare.sf(Hc, df);
  const hypotheses = {
    h0: 'Las k poblaciones tienen la misma distribución (misma mediana).',
    h1: 'Al menos una población tiende a dar valores mayores o menores.',
  };

  const maxN = Math.max(...ns);
  const offsets = ns.map((_, j) => ns.slice(0, j).reduce((a, b) => a + b, 0));
  const rankRows: (string | number)[][] = [];
  for (let i = 0; i < maxN; i++) {
    rankRows.push(
      groups.flatMap((g, j) => (i < ns[j] ? [fmt(g.values[i]), fmt(ranks[offsets[j] + i])] : ['', ''])),
    );
  }

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'text',
      title: 'Rangos',
      body: `Se ordenan los N = ${N} datos de todos los grupos juntos y se asigna el rango; los empates reciben el rango promedio.`,
    },
    { kind: 'table', title: 'Datos y rangos', columns: groups.flatMap((g) => [`${g.label}: x`, `${g.label}: rango`]), rows: rankRows },
    {
      kind: 'table',
      title: 'Suma de rangos por grupo',
      columns: ['Grupo', 'nⱼ', 'Rⱼ', 'Rⱼ²/nⱼ'],
      rows: groups.map((g, j) => [g.label, ns[j], fmt(R[j]), fix((R[j] * R[j]) / ns[j], 4)]),
    },
    {
      kind: 'formula',
      title: 'Estadístico H',
      expression: 'H = [12 / (N(N + 1))] Σ Rⱼ²/nⱼ − 3(N + 1)',
      substituted: `H = [12 / (${N}·${N + 1})]·${fmt(sumTerm)} − 3·${N + 1}`,
      result: `H = ${fmt(H)}`,
    },
    {
      kind: 'formula',
      title: 'Corrección por empates',
      expression: 'C = 1 − Σ(t³ − t) / (N³ − N),   H_c = H / C',
      substituted: ties.length
        ? `Grupos de empates: ${ties.join(', ')} → C = 1 − ${fmt(tieSum)} / ${N ** 3 - N}`
        : 'No hay empates: C = 1',
      result: `C = ${fmt(C)},  H_c = ${fmt(Hc)}  (gl = ${df})`,
    },
  ];

  let comparison;
  let criticalValue: TestResult['criticalValue'];
  if (opts.mode === 'tabla') {
    const crit = round(chiSquare.quantile(1 - opts.alpha, df), 3);
    criticalValue = { value: crit, source: `Tabla χ² con ${df} gl` };
    steps.push({ kind: 'text', title: 'Valor crítico', body: `χ²(${fmt(1 - opts.alpha)}; ${df}) = ${fix(crit, 3)}.` });
    comparison = compareUpper('H', Hc, crit, 3);
  } else {
    steps.push({ kind: 'text', title: 'Valor p', body: `p = P(χ²_${df} ≥ ${fmt(Hc)}) = ${fmtP(pValue)}.` });
    comparison = compareP(pValue, opts.alpha);
  }
  const conclusion = equalMeansConclusion(comparison, opts.alpha, 'las distribuciones (medianas) de los grupos');
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));
  const warnings = ns.some((n) => n < 5) ? ['Algún grupo tiene n < 5: la aproximación χ² de H es menos precisa.'] : [];

  return {
    testId: 'kruskalWallis',
    testName: 'Kruskal-Wallis',
    family: 'anova',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'H', value: Hc },
    df,
    criticalValue,
    pValue: opts.mode === 'exacto' ? pValue : undefined,
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
  };
}
