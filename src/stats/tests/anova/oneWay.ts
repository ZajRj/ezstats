import type { Step, TestOptions, TestResult } from '../../types';
import { fDist } from '../../core/distributions';
import { fix, fmt, fmtP, round } from '../../core/rounding';
import { compareP, compareUpper, equalMeansConclusion } from '../../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireGroups } from '../common';
import { anovaCore, anovaSteps, groupSummaryStep, type Group } from './anovaCore';
import { tukeyHsd } from './tukeyHsd';
import { subscript } from '../variance/bartlett';

export function oneWayAnova(groups: Group[], opts: TestOptions, withTukey = true): TestResult {
  requireGroups(groups.map((g) => g.values), 2, 2, 'El ANOVA de un factor');
  requireAlpha(opts.alpha);
  const core = anovaCore(groups);
  const k = core.k;
  const hypotheses = {
    h0: Array.from({ length: k }, (_, i) => `μ${subscript(i + 1)}`).join(' = '),
    h1: 'Al menos una media poblacional es diferente.',
  };
  const eta2 = core.ssBetween / core.ssTotal;

  const steps: Step[] = [hypothesesStep(hypotheses), modeNote(opts.mode), groupSummaryStep(groups, core)];

  let comparison;
  let criticalValue: TestResult['criticalValue'];
  if (opts.mode === 'tabla') {
    const crit = round(fDist.quantile(1 - opts.alpha, core.dfBetween, core.dfWithin), 2);
    criticalValue = { value: crit, source: `Tabla F con (${core.dfBetween}, ${core.dfWithin}) gl` };
    steps.push(...anovaSteps(core, crit));
    steps.push({
      kind: 'text',
      title: 'Valor crítico',
      body: `F(${fmt(1 - opts.alpha)}; ${core.dfBetween}, ${core.dfWithin}) = ${fix(crit, 2)}.`,
    });
    comparison = compareUpper('F', core.F, crit, 2);
  } else {
    steps.push(...anovaSteps(core));
    steps.push({ kind: 'text', title: 'Valor p', body: `p = P(F ≥ ${fmt(core.F)}) = ${fmtP(core.p)}.` });
    comparison = compareP(core.p, opts.alpha);
  }
  steps.push({
    kind: 'formula',
    title: 'Tamaño del efecto',
    expression: 'η² = SC_entre / SC_total',
    substituted: `η² = ${fmt(core.ssBetween)} / ${fmt(core.ssTotal)}`,
    result: `η² = ${fmt(eta2)} (${fmt(eta2 * 100, 2)} % de la variabilidad total se explica por los grupos)`,
  });

  const conclusion = equalMeansConclusion(comparison, opts.alpha, 'las medias poblacionales');
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));
  const warnings: string[] = [];
  const followUp: TestResult[] = [];
  if (comparison.decision === 'reject' && withTukey && k > 2) {
    followUp.push(tukeyHsd(groups, opts, core));
  }

  return {
    testId: 'oneWayAnova',
    testName: 'ANOVA de un factor',
    family: 'anova',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'F', value: core.F },
    df: [core.dfBetween, core.dfWithin],
    criticalValue,
    pValue: opts.mode === 'exacto' ? core.p : undefined,
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
    chart: {
      kind: 'means',
      labels: groups.map((g) => g.label),
      means: core.means,
      sds: core.variances.map(Math.sqrt),
      ns: core.ns,
      grandMean: core.grandMean,
    },
    followUp: followUp.length ? followUp : undefined,
  };
}
