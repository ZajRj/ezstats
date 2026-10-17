import type { TestOptions, TestResult } from '../../types';
import { StatsInputError } from '../../types';
import type { Group } from './anovaCore';
import { runsMedian } from '../randomness/runsMedian';
import { shapiroWilk } from '../normality/shapiroWilk';
import { lilliefors } from '../normality/lilliefors';
import { levene } from '../variance/levene';
import { bartlett } from '../variance/bartlett';
import { oneWayAnova } from './oneWay';
import { kruskalWallis } from './kruskalWallis';
import { requireGroups } from '../common';

export type AssumptionKind = 'aleatoriedad' | 'normalidad' | 'homocedasticidad';

export interface AssumptionCheck {
  kind: AssumptionKind;
  label: string;
  /** null when the test could not be run (the reason is in `error`). */
  passed: boolean | null;
  result?: TestResult;
  error?: string;
}

export interface PipelineResult {
  checks: AssumptionCheck[];
  allHold: boolean;
  /** One-way ANOVA (with Tukey in followUp) or Kruskal-Wallis. */
  final: TestResult;
  reason: string;
  warnings: string[];
}

function attempt(kind: AssumptionKind, label: string, run: () => TestResult): AssumptionCheck {
  try {
    const result = run();
    return { kind, label, passed: result.decision === 'fail_to_reject', result };
  } catch (e) {
    if (e instanceof StatsInputError) return { kind, label, passed: null, error: e.message };
    throw e;
  }
}

/**
 * Guided analysis: randomness and normality per group, then homogeneity of
 * variances, then one-way ANOVA (+ Tukey) or Kruskal-Wallis.
 */
export function assumptionsPipeline(
  groups: Group[],
  params: { normality: 'shapiroWilk' | 'lilliefors' },
  opts: TestOptions,
): PipelineResult {
  requireGroups(groups.map((g) => g.values), 2, 2, 'El análisis completo');
  const checks: AssumptionCheck[] = [];
  const warnings: string[] = [];

  for (const g of groups) {
    checks.push(attempt('aleatoriedad', `Aleatoriedad — ${g.label}`, () => runsMedian(g.values, opts)));
  }
  const normalityChecks = groups.map((g) =>
    attempt('normalidad', `Normalidad — ${g.label}`, () =>
      params.normality === 'lilliefors' ? lilliefors(g.values, opts) : shapiroWilk(g.values, opts),
    ),
  );
  checks.push(...normalityChecks);
  const allNormal = normalityChecks.every((c) => c.passed === true);

  const varianceCheck = allNormal
    ? attempt('homocedasticidad', 'Homogeneidad de varianzas — Bartlett', () => bartlett(groups, opts))
    : attempt('homocedasticidad', 'Homogeneidad de varianzas — Levene', () => levene(groups, { center: 'mean' }, opts));
  checks.push(varianceCheck);

  const randomFails = checks.filter((c) => c.kind === 'aleatoriedad' && c.passed === false);
  if (randomFails.length) {
    warnings.push(
      `Falla la aleatoriedad en ${randomFails.map((c) => c.label.replace('Aleatoriedad — ', '')).join(', ')}: ` +
        'las observaciones podrían no ser independientes, y eso afecta tanto al ANOVA como a Kruskal-Wallis.',
    );
  }
  const unrun = checks.filter((c) => c.passed === null);
  if (unrun.length) warnings.push(`No se pudieron ejecutar: ${unrun.map((c) => `${c.label} (${c.error})`).join('; ')}`);

  const homoscedastic = varianceCheck.passed === true;
  const allHold = allNormal && homoscedastic && randomFails.length === 0;

  let final: TestResult;
  let reason: string;
  if (allNormal && homoscedastic) {
    final = oneWayAnova(groups, opts);
    reason =
      'Todos los grupos pasan la normalidad y las varianzas son homogéneas, así que se aplica el ANOVA de un factor' +
      (final.followUp?.length ? ' y, como resultó significativo, Tukey HSD.' : '.');
  } else {
    final = kruskalWallis(groups, opts);
    const why = [
      !allNormal ? 'al menos un grupo no pasa la prueba de normalidad (o no se pudo verificar)' : null,
      !homoscedastic ? 'las varianzas no son homogéneas (o no se pudo verificar)' : null,
    ].filter(Boolean);
    reason = `Se usa Kruskal-Wallis, la alternativa no paramétrica, porque ${why.join(' y ')}. El ANOVA supone normalidad y varianzas iguales.`;
  }

  return { checks, allHold, final, reason, warnings };
}
