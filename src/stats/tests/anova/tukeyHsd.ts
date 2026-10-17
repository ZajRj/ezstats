import type { Step, TestOptions, TestResult } from '../../types';
import { studentizedRange } from '../../core/distributions';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { significance } from '../../text';
import { conclusionStep, hypothesesStep, requireAlpha, requireGroups } from '../common';
import { anovaCore, type AnovaCore, type Group } from './anovaCore';

export interface TukeyPair {
  a: number;
  b: number;
  diff: number;
  se: number;
  q: number;
  p: number;
}

/** Tukey-Kramer comparisons (equal n reduces to classic Tukey HSD). */
export function tukeyPairs(groups: Group[], core: AnovaCore = anovaCore(groups)): TukeyPair[] {
  const pairs: TukeyPair[] = [];
  for (let a = 0; a < groups.length; a++) {
    for (let b = a + 1; b < groups.length; b++) {
      const diff = core.means[a] - core.means[b];
      const se = Math.sqrt((core.msWithin / 2) * (1 / core.ns[a] + 1 / core.ns[b]));
      const q = Math.abs(diff) / se;
      pairs.push({ a, b, diff, se, q, p: studentizedRange.sf(q, groups.length, core.dfWithin) });
    }
  }
  return pairs;
}

export function tukeyHsd(groups: Group[], opts: TestOptions, precomputed?: AnovaCore): TestResult {
  requireGroups(groups.map((g) => g.values), 2, 2, 'Tukey HSD');
  requireAlpha(opts.alpha);
  const core = precomputed ?? anovaCore(groups);
  const k = groups.length;
  const pairs = tukeyPairs(groups, core);
  const qExact = studentizedRange.quantile(1 - opts.alpha, k, core.dfWithin);
  const qCrit = opts.mode === 'tabla' ? round(qExact, 2) : qExact;
  const equalN = core.ns.every((n) => n === core.ns[0]);

  const rows = pairs.map((p) => {
    const hsd = qCrit * p.se;
    const sig = opts.mode === 'tabla' ? Math.abs(p.diff) >= hsd : p.p <= opts.alpha;
    return {
      sig,
      cells: [
        `${groups[p.a].label} − ${groups[p.b].label}`,
        fix(p.diff, 4),
        fix(hsd, 4),
        opts.mode === 'tabla' ? fix(p.q, 4) : fmtP(p.p),
        sig ? 'Sí' : 'No',
      ] as (string | number)[],
    };
  });
  const significant = pairs.filter((_, i) => rows[i].sig);

  const steps: Step[] = [
    hypothesesStep({ h0: 'μᵢ = μⱼ para cada par de grupos.', h1: 'μᵢ ≠ μⱼ.' }),
    {
      kind: 'formula',
      title: 'Valor crítico del rango studentizado',
      expression: 'q(1 − α; k, gl_dentro)',
      substituted: `q(${fmt(1 - opts.alpha)}; ${k}, ${core.dfWithin})`,
      result: `q = ${opts.mode === 'tabla' ? fix(qCrit, 2) : fmt(qCrit)}`,
    },
    {
      kind: 'formula',
      title: equalN ? 'Diferencia honestamente significativa' : 'HSD de Tukey-Kramer (n distintos)',
      expression: equalN ? 'HSD = q · √(CM_dentro / n)' : 'HSD = q · √[(CM_dentro / 2)(1/nᵢ + 1/nⱼ)]',
      substituted: equalN ? `HSD = ${fmt(qCrit)} · √(${fmt(core.msWithin)} / ${core.ns[0]})` : undefined,
      result: equalN ? `HSD = ${fmt(qCrit * pairs[0].se)}` : 'Se calcula para cada par (ver tabla).',
    },
    {
      kind: 'table',
      title: 'Comparaciones por pares',
      columns: ['Par', 'x̄ᵢ − x̄ⱼ', 'HSD', opts.mode === 'tabla' ? 'q obs.' : 'p', '¿Significativa?'],
      rows: rows.map((r) => r.cells),
      highlight: rows.flatMap((r, i) => (r.sig ? [{ row: i, col: 4 }] : [])),
    },
  ];

  const names = significant.map((p) => `${groups[p.a].label} y ${groups[p.b].label}`);
  const conclusion =
    names.length > 0
      ? `${significance(opts.alpha)}, hay diferencia significativa entre las medias de: ${names.join('; ')}. ` +
        `Los demás pares no difieren significativamente.`
      : `${significance(opts.alpha)}, ningún par de medias difiere significativamente.`;
  steps.push(conclusionStep(conclusion));

  return {
    testId: 'tukeyHsd',
    testName: 'Tukey HSD (comparaciones múltiples)',
    family: 'anova',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses: { h0: 'μᵢ = μⱼ para cada par.', h1: 'μᵢ ≠ μⱼ para al menos un par.' },
    statistic: { symbol: 'q crítico', value: qCrit },
    df: [k, core.dfWithin],
    criticalValue: { value: qCrit, source: 'Distribución del rango studentizado (Copenhaver y Holland 1988)' },
    decision: significant.length > 0 ? 'reject' : 'fail_to_reject',
    conclusion,
    warnings: [],
    steps,
  };
}
