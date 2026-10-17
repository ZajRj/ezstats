import type { Step, TestOptions, TestResult } from '../../types';
import { fDist } from '../../core/distributions';
import { mean, median } from '../../core/descriptive';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareP, compareUpper, equalVarianceConclusion } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireGroups } from '../common';
import { anovaCore, anovaSteps, groupSummaryStep, type Group } from '../anova/anovaCore';
import { equalVarianceHypotheses } from './bartlett';

/** Levene (center = mean) or Brown-Forsythe (center = median): ANOVA on |xᵢⱼ − centerⱼ|. */
export function levene(groups: Group[], params: { center: 'mean' | 'median' }, opts: TestOptions): TestResult {
  requireGroups(groups.map((g) => g.values), 2, 2, 'Levene');
  requireAlpha(opts.alpha);
  const useMedian = params.center === 'median';
  const centers = groups.map((g) => (useMedian ? median(g.values) : mean(g.values)));
  const deviations: Group[] = groups.map((g, j) => ({
    label: g.label,
    values: g.values.map((x) => Math.abs(x - centers[j])),
  }));
  const core = anovaCore(deviations);
  const k = groups.length;
  const hypotheses = equalVarianceHypotheses(k);
  const cName = useMedian ? 'mediana' : 'media';
  const cSym = useMedian ? 'x̃ⱼ' : 'x̄ⱼ';

  const maxN = Math.max(...groups.map((g) => g.values.length));
  const devRows: (string | number)[][] = [];
  for (let i = 0; i < maxN; i++) {
    devRows.push(
      groups.flatMap((g, j) =>
        i < g.values.length ? [fmt(g.values[i]), fix(deviations[j].values[i], 4)] : ['', ''],
      ),
    );
  }

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'text',
      title: useMedian ? 'Variante de Brown-Forsythe' : 'Prueba de Levene',
      body: `Se transforma cada dato en zᵢⱼ = |xᵢⱼ − ${cSym}|, donde ${cSym} es la ${cName} del grupo, y se aplica un ANOVA de un factor a los zᵢⱼ.`,
    },
    {
      kind: 'table',
      title: `${capitalize(cName)} de cada grupo`,
      columns: ['Grupo', cSym],
      rows: groups.map((g, j) => [g.label, fix(centers[j], 4)]),
    },
    {
      kind: 'table',
      title: 'Datos transformados zᵢⱼ',
      columns: groups.flatMap((g) => [`${g.label}: x`, `${g.label}: z`]),
      rows: devRows,
    },
    groupSummaryStep(deviations, core, 'Resumen de las desviaciones zᵢⱼ'),
  ];

  let comparison;
  let criticalValue: TestResult['criticalValue'];
  if (opts.mode === 'tabla') {
    const crit = round(fDist.quantile(1 - opts.alpha, core.dfBetween, core.dfWithin), 2);
    criticalValue = { value: crit, source: `Tabla F con (${core.dfBetween}, ${core.dfWithin}) gl` };
    steps.push(...anovaSteps(core, crit));
    steps.push({ kind: 'text', title: 'Valor crítico', body: `F(${fmt(1 - opts.alpha)}; ${core.dfBetween}, ${core.dfWithin}) = ${fix(crit, 2)}.` });
    comparison = compareUpper('W', core.F, crit, 2);
  } else {
    steps.push(...anovaSteps(core));
    steps.push({ kind: 'text', title: 'Valor p', body: `p = P(F ≥ ${fmt(core.F)}) = ${fmtP(core.p)}.` });
    comparison = compareP(core.p, opts.alpha);
  }
  const conclusion = equalVarianceConclusion(comparison, opts.alpha, k);
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: useMedian ? 'brownForsythe' : 'levene',
    testName: useMedian ? 'Brown-Forsythe (Levene con mediana)' : 'Levene',
    family: 'varianza',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'W', value: core.F },
    df: [core.dfBetween, core.dfWithin],
    criticalValue,
    pValue: opts.mode === 'exacto' ? core.p : undefined,
    decision: comparison.decision,
    conclusion,
    warnings: [],
    steps,
  };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
