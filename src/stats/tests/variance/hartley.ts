import type { Step, TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import { variance } from '../../core/descriptive';
import { fix, fmt } from '../../core/rounding';
import { hartleyCritical } from '../../tables/hartley';
import { compareUpper, equalVarianceConclusion } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireGroups } from '../common';
import type { Group } from '../anova/anovaCore';
import { equalVarianceHypotheses } from './bartlett';

export function hartley(groups: Group[], opts: TestOptions): TestResult {
  requireGroups(groups.map((g) => g.values), 2, 2, 'Hartley');
  requireAlpha(opts.alpha);
  const k = groups.length;
  const n = groups[0].values.length;
  if (groups.some((g) => g.values.length !== n)) {
    throw new StatsInputError('Hartley exige grupos del mismo tamaño. Con tamaños distintos usa la prueba de Levene.');
  }
  if (k > 12) throw new StatsInputError('La tabla de Hartley llega hasta k = 12 grupos. Usa Levene o Bartlett.');
  const df = n - 1;
  const vars = groups.map((g) => variance(g.values));
  const iMax = vars.indexOf(Math.max(...vars));
  const iMin = vars.indexOf(Math.min(...vars));
  if (vars[iMin] === 0) throw new StatsInputError('Un grupo tiene varianza 0; Fmax no está definido.');
  const Fmax = vars[iMax] / vars[iMin];
  const hypotheses = equalVarianceHypotheses(k);

  const crit = hartleyCritical(k, df, opts.alpha);
  if (!crit) {
    throw new StatsInputError('La tabla de Hartley solo tiene α = 0.05 y α = 0.01, con ν = n − 1 ≥ 2.');
  }

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'table',
      title: 'Varianzas por grupo',
      columns: ['Grupo', 'n', 's²'],
      rows: groups.map((g, i) => [g.label, n, fix(vars[i], 4)]),
      highlight: [{ row: iMax, col: 2 }, { row: iMin, col: 2 }],
    },
    {
      kind: 'formula',
      title: 'Estadístico de prueba',
      expression: 'Fmax = s²máx / s²mín',
      substituted: `Fmax = ${fmt(vars[iMax])} / ${fmt(vars[iMin])}`,
      result: `Fmax = ${fmt(Fmax)}  (k = ${k}, ν = n − 1 = ${df})`,
    },
    {
      kind: 'text',
      title: 'Valor crítico',
      body:
        `Tabla de Hartley (Pearson y Hartley, Biometrika Tables, Tabla 31) con k = ${k}, ν = ${crit.dfUsed}, α = ${fmt(opts.alpha)}: ` +
        `Fmax crítico = ${fmt(crit.value)}.` +
        (crit.exactDf ? '' : ` ν = ${df} no está en la tabla; se usa la fila ν = ${crit.dfUsed} (más conservadora).`),
    },
  ];

  const comparison = compareUpper('Fmax', Fmax, crit.value, crit.value >= 100 ? 0 : crit.value >= 10 ? 1 : 2);
  const conclusion = equalVarianceConclusion(comparison, opts.alpha, k);
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));
  const warnings = ['Hartley supone normalidad y es muy sensible a su falta.'];
  if (opts.mode === 'exacto') warnings.push('Hartley no tiene un valor p de uso habitual; la decisión usa la tabla en ambos modos.');

  return {
    testId: 'hartley',
    testName: 'Hartley (Fmax)',
    family: 'varianza',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'Fmax', value: Fmax },
    df,
    criticalValue: { value: crit.value, source: 'Pearson y Hartley (1966), Tabla 31' },
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
  };
}
