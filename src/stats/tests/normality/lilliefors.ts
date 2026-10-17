import type { Step, TestOptions, TestResult } from '../../types';
import { mean, sd } from '../../core/descriptive';
import { fix, fmt, fmtP } from '../../core/rounding';
import { lillieforsCritical, lillieforsPValue } from '../../tables/lilliefors';
import { compareP, compareUpper, normalityConclusion, normalityHypotheses } from '../../text';
import { conclusionStep, dataStep, decisionStep, hypothesesStep, modeNote, requireAlpha, requireN } from '../common';
import { compareEcdf, dStatisticSteps, ecdfChart, ecdfTableStep } from './ecdf';

/** Lilliefors (1967) test: K-S with μ and σ estimated by x̄ and s. */
export function lilliefors(values: number[], opts: TestOptions): TestResult {
  requireN(values, 4, 'La prueba de Lilliefors');
  requireAlpha(opts.alpha);
  const n = values.length;
  const xbar = mean(values);
  const s = sd(values);
  const hypotheses = normalityHypotheses(opts);
  const warnings: string[] = [];

  const cmp = compareEcdf(values, xbar, s, opts.mode);
  const unique = cmp.rows.length;
  if (unique / n < 0.6) {
    warnings.push(`Muchos empates: solo ${unique} de ${n} valores son distintos, la prueba pierde precisión.`);
  }

  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    dataStep(values),
    {
      kind: 'formula',
      title: 'Media muestral',
      expression: 'x̄ = Σxᵢ / n',
      substituted: `x̄ = ${fmt(values.reduce((a, b) => a + b, 0))} / ${n}`,
      result: `x̄ = ${fmt(xbar)}`,
    },
    {
      kind: 'formula',
      title: 'Desviación estándar muestral',
      expression: 's = √[Σ(xᵢ − x̄)² / (n − 1)]',
      substituted: `s = √[${fmt(values.reduce((a, x) => a + (x - xbar) ** 2, 0))} / ${n - 1}]`,
      result: `s = ${fmt(s)}`,
    },
    {
      kind: 'text',
      title: 'Agrupación de datos',
      body:
        `Se ordenan los datos y los valores repetidos se agrupan en una sola fila (${unique} filas). ` +
        `n sigue siendo el total de observaciones: n = ${n}. ` +
        `zᵢ = (xᵢ − x̄)/s${opts.mode === 'tabla' ? ', redondeado a 2 decimales' : ''}.`,
    },
    ecdfTableStep(cmp, opts.mode),
    ...dStatisticSteps(cmp),
  ];

  const crit = lillieforsCritical(n, opts.alpha);
  let criticalValue: TestResult['criticalValue'];
  if (crit) {
    const source = 'Tabla de Lilliefors (1967)';
    if (crit.kind === 'table') {
      steps.push({ kind: 'text', title: 'Valor crítico', body: `De la tabla de Lilliefors con n = ${n} y α = ${fmt(opts.alpha)}: D crítico = ${fix(crit.value, 3)}.` });
      criticalValue = { value: crit.value, source };
    } else if (crit.kind === 'interpolated') {
      steps.push({
        kind: 'formula',
        title: 'Valor crítico (interpolación lineal)',
        expression: 'D = D₁ + (n − n₁)/(n₂ − n₁) · (D₂ − D₁)',
        substituted: `D = ${fix(crit.d1, 3)} + (${n} − ${crit.n1})/(${crit.n2} − ${crit.n1}) · (${fix(crit.d2, 3)} − ${fix(crit.d1, 3)})`,
        result: `D crítico = ${fmt(crit.value)}`,
      });
      criticalValue = { value: crit.value, source: `${source}, interpolado entre n = ${crit.n1} y n = ${crit.n2}`, interpolated: true };
    } else {
      steps.push({
        kind: 'formula',
        title: 'Valor crítico (n > 30)',
        expression: `D crítico = ${fix(crit.coefficient, 3)} / √n`,
        substituted: `D crítico = ${fix(crit.coefficient, 3)} / √${n}`,
        result: `D crítico = ${fmt(crit.value)}`,
      });
      criticalValue = { value: crit.value, source: `${source}, fórmula para n > 30` };
    }
  }

  let pValue: number | undefined;
  if (opts.mode === 'exacto') {
    pValue = lillieforsPValue(cmp.D, n);
    steps.push({
      kind: 'text',
      title: 'Valor p (aproximado)',
      body: `Aproximación de Dallal y Wilkinson (1986): p ≈ ${fmtP(pValue)}.`,
    });
  }

  // The table is the reference; the approximate p-value decides only for untabulated α.
  const comparison = criticalValue
    ? compareUpper('D', cmp.D, criticalValue.value, crit?.kind === 'table' ? 3 : 4)
    : compareP(pValue ?? lillieforsPValue(cmp.D, n), opts.alpha);
  if (!criticalValue && opts.mode === 'tabla') {
    warnings.push('El α elegido no está en la tabla de Lilliefors; se decidió con el valor p aproximado.');
  }

  const conclusion = normalityConclusion(comparison, opts.alpha, opts);
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'lilliefors',
    testName: 'Lilliefors (Kolmogorov-Smirnov con parámetros estimados)',
    family: 'normalidad',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'D', value: cmp.D },
    criticalValue,
    pValue,
    pValueApprox: pValue !== undefined,
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
    chart: ecdfChart(cmp, xbar, s),
  };
}
