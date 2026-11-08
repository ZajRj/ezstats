/**
 * Ordinary least squares, worked step by step through the matrix route
 * β̂ = (XᵀX)⁻¹Xᵀy. For simple regression the algebraic route (Sxx, Syy, Sxy)
 * is shown too, as a cross-check.
 */
import type { Step, TestOptions, TestResult } from '../types';
import { StatsInputError } from '../types';
import { column, invert, multiply, transpose, type Matrix } from '../core/matrix';
import { fDist, studentT } from '../core/distributions';
import { mean } from '../core/descriptive';
import { fix, fmt, fmtP, fmtSci, round } from '../core/rounding';
import { compareP, compareUpper, significance } from '../text';
import { conclusionStep, decisionStep, hypothesesStep, modeNote, requireAlpha } from '../tests/common';
import { subscript } from '../tests/variance/bartlett';
import type { Group } from '../tests/anova/anovaCore';

export interface OlsFit {
  n: number;
  p: number;
  X: Matrix;
  y: number[];
  XtX: Matrix;
  Xty: number[];
  C: Matrix;
  det: number;
  beta: number[];
  fitted: number[];
  residuals: number[];
  leverage: number[];
  yty: number;
  btXty: number;
  nYbar2: number;
  sst: number;
  ssr: number;
  sse: number;
  mse: number;
  r2: number;
  r2adj: number;
}

/** Fits y on the given regressors with an intercept. */
export function ols(y: number[], xs: number[][]): OlsFit {
  const n = y.length;
  const p = xs.length + 1;
  const X: Matrix = y.map((_, i) => [1, ...xs.map((c) => c[i])]);
  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  const Xty = multiply(Xt, column(y)).map((r) => r[0]);
  const { inverse: C, determinant: det } = invert(XtX);
  const beta = multiply(C, column(Xty)).map((r) => r[0]);
  const fitted = X.map((row) => row.reduce((s, x, j) => s + x * beta[j], 0));
  const residuals = y.map((v, i) => v - fitted[i]);
  // hᵢᵢ = xᵢᵀ C xᵢ (diagonal of H = X(XᵀX)⁻¹Xᵀ) without forming the n×n matrix.
  const leverage = X.map((row) => row.reduce((s, xi, a) => s + xi * row.reduce((t, xj, b) => t + C[a][b] * xj, 0), 0));
  const ybar = mean(y);
  const yty = y.reduce((s, v) => s + v * v, 0);
  const btXty = beta.reduce((s, b, j) => s + b * Xty[j], 0);
  const nYbar2 = n * ybar * ybar;
  const sse = residuals.reduce((s, e) => s + e * e, 0);
  const sst = y.reduce((s, v) => s + (v - ybar) ** 2, 0);
  const ssr = sst - sse;
  const mse = sse / (n - p);
  const r2 = sst === 0 ? 0 : ssr / sst;
  const r2adj = 1 - (1 - r2) * ((n - 1) / (n - p));
  return { n, p, X, y, XtX, Xty, C, det, beta, fitted, residuals, leverage, yty, btXty, nYbar2, sst, ssr, sse, mse, r2, r2adj };
}

/** VIFⱼ = 1/(1 − Rⱼ²), regressing Xⱼ on the other regressors. */
export function vifs(xs: number[][]): { r2: number; vif: number }[] {
  return xs.map((xj, j) => {
    const others = xs.filter((_, i) => i !== j);
    const r2 = ols(xj, others).r2;
    return { r2, vif: r2 >= 1 ? Infinity : 1 / (1 - r2) };
  });
}

function matrixStep(title: string, M: Matrix, rowLabels: string[], colLabels: string[]): Step {
  return {
    kind: 'table',
    title,
    columns: ['', ...colLabels],
    rows: M.map((row, i) => [rowLabels[i], ...row.map((v) => fmtSci(v))]),
  };
}

export function linearRegression(groups: Group[], opts: TestOptions): TestResult {
  requireAlpha(opts.alpha);
  if (groups.length < 2) throw new StatsInputError('Ingresa Y y al menos una variable regresora X.');
  const [yGroup, ...xGroups] = groups;
  const y = yGroup.values;
  const xs = xGroups.map((g) => g.values);
  const n = y.length;
  xGroups.forEach((g) => {
    if (g.values.length !== n) {
      throw new StatsInputError(`“${g.label}” tiene ${g.values.length} datos y Y tiene ${n}. Todas las variables deben tener el mismo n.`);
    }
  });
  const k = xs.length;
  const p = k + 1;
  if (n <= p) throw new StatsInputError(`Con ${p} parámetros se necesitan más de ${p} observaciones (hay ${n}).`);

  const fit = ols(y, xs);
  const df = n - p;
  const yName = yGroup.label || 'Y';
  const xNames = xGroups.map((g, j) => g.label || `X${subscript(j + 1)}`);
  const bNames = ['β₀', ...xNames.map((nm, j) => `β${subscript(j + 1)} (${nm})`)];
  const simple = k === 1;
  const warnings: string[] = [];

  const model = `${yName} = β₀ + ${xNames.map((nm, j) => `β${subscript(j + 1)}·${nm}`).join(' + ')} + ε`;
  const hypotheses = simple
    ? { h0: `β₁ = 0 (no hay relación lineal entre ${xNames[0]} y ${yName})`, h1: 'β₁ ≠ 0' }
    : {
        h0: `${Array.from({ length: k }, (_, j) => `β${subscript(j + 1)}`).join(' = ')} = 0 (ninguna regresora explica ${yName})`,
        h1: 'Al menos un βⱼ ≠ 0',
      };

  const colX = ['1', ...xNames];
  const steps: Step[] = [
    hypothesesStep(hypotheses),
    modeNote(opts.mode),
    {
      kind: 'text',
      title: 'Modelo',
      body: `${model}\nn = ${n} observaciones, k = ${k} regresora${k > 1 ? 's' : ''}, p = k + 1 = ${p} parámetros.\nEn forma matricial: y = Xβ + ε.`,
    },
    {
      kind: 'table',
      title: 'Matriz X y vector y',
      columns: ['i', ...colX.map((c, j) => (j === 0 ? '1 (intercepto)' : c)), `y = ${yName}`],
      rows: fit.X.map((row, i) => [i + 1, ...row.map((v) => fmt(v)), fmt(y[i])]),
    },
  ];

  if (simple) {
    const x = xs[0];
    const sx = x.reduce((a, b) => a + b, 0);
    const sy = y.reduce((a, b) => a + b, 0);
    const sxx = x.reduce((a, v) => a + v * v, 0) - (sx * sx) / n;
    const syy = y.reduce((a, v) => a + v * v, 0) - (sy * sy) / n;
    const sxy = x.reduce((a, v, i) => a + v * y[i], 0) - (sx * sy) / n;
    const b1 = sxy / sxx;
    const b0 = sy / n - b1 * (sx / n);
    const r = sxy / Math.sqrt(sxx * syy);
    steps.push(
      {
        kind: 'formula',
        title: 'Enfoque algebraico: sumas corregidas',
        expression: 'Sxx = ΣX² − (ΣX)²/n,  Syy = ΣY² − (ΣY)²/n,  Sxy = ΣXY − (ΣX)(ΣY)/n',
        substituted: `ΣX = ${fmt(sx)}, ΣY = ${fmt(sy)}, ΣX² = ${fmt(sxx + (sx * sx) / n)}, ΣY² = ${fmt(syy + (sy * sy) / n)}, ΣXY = ${fmt(sxy + (sx * sy) / n)}`,
        result: `Sxx = ${fmt(sxx)},  Syy = ${fmt(syy)},  Sxy = ${fmt(sxy)}`,
      },
      {
        kind: 'formula',
        title: 'Estimadores MCO (algebraico)',
        expression: 'β̂₁ = Sxy / Sxx,   β̂₀ = Ȳ − β̂₁ X̄',
        substituted: `β̂₁ = ${fmt(sxy)} / ${fmt(sxx)},   β̂₀ = ${fmt(sy / n)} − ${fmt(b1)} · ${fmt(sx / n)}`,
        result: `β̂₀ = ${fmt(b0)},  β̂₁ = ${fmt(b1)}  (coinciden con el resultado matricial de abajo)`,
      },
      {
        kind: 'formula',
        title: 'Correlación de Pearson',
        expression: 'r = Sxy / √(Sxx · Syy)',
        result: `r = ${fmt(r)}  →  r² = ${fmt(r * r)} = R²`,
      },
    );
  }

  steps.push(
    {
      kind: 'text',
      title: 'Puente algebraico ↔ matricial',
      body:
        'XᵀX contiene las sumatorias de las ecuaciones normales: n, ΣXⱼ en la primera fila y columna, ΣXⱼ² en la diagonal y ΣXⱼXₗ fuera de ella. ' +
        'Xᵀy contiene ΣY y ΣXⱼY.',
    },
    matrixStep(`XᵀX  (${p}×${p})`, fit.XtX, colX, colX),
    matrixStep(`Xᵀy  (${p}×1)`, column(fit.Xty), colX, ['Xᵀy']),
    {
      kind: 'formula',
      title: 'Ecuaciones normales',
      expression: '(XᵀX) β̂ = Xᵀy   ⇒   β̂ = (XᵀX)⁻¹ Xᵀy',
      substituted: `det(XᵀX) = ${fmtSci(fit.det)} ≠ 0, así que XᵀX es invertible (rango completo).`,
    },
    matrixStep(`C = (XᵀX)⁻¹  (Gauss-Jordan)`, fit.C, colX, colX),
    {
      kind: 'table',
      title: 'β̂ = C · Xᵀy',
      columns: ['Parámetro', 'β̂ⱼ'],
      rows: fit.beta.map((b, j) => [bNames[j], fmtSci(b)]),
    },
    {
      kind: 'text',
      title: 'Ecuación estimada',
      body: `Ŷ = ${fmt(fit.beta[0])} ${fit.beta.slice(1).map((b, j) => `${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}·${xNames[j]}`).join(' ')}`,
    },
  );

  // Residuals and leverage; flag hᵢᵢ > 2p/n.
  const levCut = (2 * p) / n;
  const highLev = fit.leverage.map((h, i) => (h > levCut ? i : -1)).filter((i) => i >= 0);
  steps.push(
    {
      kind: 'table',
      title: 'Valores ajustados ŷ = Xβ̂ = Hy, residuos e = (I − H)y y apalancamiento hᵢᵢ',
      columns: ['i', 'yᵢ', 'ŷᵢ', 'eᵢ', 'eᵢ²', 'hᵢᵢ'],
      rows: y.map((v, i) => [i + 1, fmt(v), fix(fit.fitted[i], 4), fix(fit.residuals[i], 4), fix(fit.residuals[i] ** 2, 4), fix(fit.leverage[i], 4)]),
      highlight: highLev.map((i) => ({ row: i, col: 5 })),
    },
    {
      kind: 'formula',
      title: 'Matriz sombrero H = X(XᵀX)⁻¹Xᵀ',
      expression: 'H es simétrica e idempotente; tr(H) = Σhᵢᵢ = p',
      result: `Σhᵢᵢ = ${fmt(fit.leverage.reduce((a, b) => a + b, 0))} = p = ${p} ✓`,
    },
  );
  if (highLev.length) {
    warnings.push(`Observaciones con alto apalancamiento (hᵢᵢ > 2p/n = ${fmt(levCut)}): ${highLev.map((i) => i + 1).join(', ')}.`);
  }

  steps.push(
    {
      kind: 'formula',
      title: 'Sumas de cuadrados (forma matricial)',
      expression: 'SCT = yᵀy − nȲ²,   SCR = β̂ᵀXᵀy − nȲ²,   SCE = eᵀe = yᵀy − β̂ᵀXᵀy',
      substituted: `yᵀy = ${fmt(fit.yty)},  β̂ᵀXᵀy = ${fmt(fit.btXty)},  nȲ² = ${fmt(fit.nYbar2)}`,
      result: `SCT = ${fmt(fit.sst)},  SCR = ${fmt(fit.ssr)},  SCE = ${fmt(fit.sse)}   (SCR + SCE = ${fmt(fit.ssr + fit.sse)} ✓)`,
    },
    {
      kind: 'formula',
      title: 'Varianza residual',
      expression: 'σ̂² = CME = SCE / (n − p)',
      substituted: `σ̂² = ${fmt(fit.sse)} / (${n} − ${p})`,
      result: `σ̂² = ${fmt(fit.mse)},  σ̂ = ${fmt(Math.sqrt(fit.mse))}`,
    },
  );

  // Global F test
  const msr = fit.ssr / k;
  const F = msr / fit.mse;
  const pF = fDist.sf(F, k, df);
  const fCrit = opts.mode === 'tabla' ? round(fDist.quantile(1 - opts.alpha, k, df), 2) : undefined;
  const anovaCols = fCrit !== undefined
    ? ['Fuente', 'SC', 'gl', 'CM', 'F₀', 'Valor p', 'F crítico']
    : ['Fuente', 'SC', 'gl', 'CM', 'F₀', 'Valor p'];
  steps.push({
    kind: 'table',
    title: 'Tabla ANOVA de la regresión',
    columns: anovaCols,
    rows: [
      ['Regresión', fix(fit.ssr, 4), k, fix(msr, 4), fix(F, 4), fmtP(pF), ...(fCrit !== undefined ? [fix(fCrit, 2)] : [])],
      ['Error', fix(fit.sse, 4), df, fix(fit.mse, 4), '', '', ...(fCrit !== undefined ? [''] : [])],
      ['Total', fix(fit.sst, 4), n - 1, '', '', '', ...(fCrit !== undefined ? [''] : [])],
    ],
    highlight: [{ row: 0, col: 4 }, { row: 0, col: 5 }],
  });
  steps.push({
    kind: 'formula',
    title: 'Coeficientes de determinación',
    expression: 'R² = SCR/SCT,   R²adj = 1 − (1 − R²)(n − 1)/(n − k − 1)',
    result: `R² = ${fmt(fit.r2)} (${fmt(fit.r2 * 100, 2)} % de la variación de ${yName} se explica por el modelo),  R²adj = ${fmt(fit.r2adj)}`,
  });

  // Variance-covariance matrix and individual t tests
  const varCov = fit.C.map((row) => row.map((c) => fit.mse * c));
  steps.push(matrixStep('Matriz de varianza-covarianza  σ̂²C', varCov, colX, colX));
  const tCrit = opts.mode === 'tabla' ? round(studentT.quantile(1 - opts.alpha / 2, df), 3) : undefined;
  const coefRows = fit.beta.map((b, j) => {
    const se = Math.sqrt(fit.mse * fit.C[j][j]);
    const t = b / se;
    const pT = 2 * studentT.sf(Math.abs(t), df);
    const sig = tCrit !== undefined ? Math.abs(t) >= tCrit : pT <= opts.alpha;
    return { b, se, t, pT, sig };
  });
  steps.push({
    kind: 'table',
    title: `Pruebas t parciales  (H₀: βⱼ = 0, gl = ${df})`,
    columns: ['Parámetro', 'β̂ⱼ', 'Cⱼⱼ', 'EE = √(σ̂²Cⱼⱼ)', 't₀ = β̂ⱼ/EE', tCrit !== undefined ? `±t crítico` : 'p', '¿Significativo?'],
    rows: coefRows.map((r, j) => [
      bNames[j],
      fmtSci(r.b),
      fmtSci(fit.C[j][j]),
      fmtSci(r.se),
      fix(r.t, 4),
      tCrit !== undefined ? fix(tCrit, 3) : fmtP(r.pT),
      r.sig ? 'Sí' : 'No',
    ]),
    highlight: coefRows.flatMap((r, j) => (r.sig ? [{ row: j, col: 6 }] : [])),
  });
  const insignificant = coefRows.map((r, j) => (j > 0 && !r.sig ? xNames[j - 1] : null)).filter(Boolean);
  steps.push({
    kind: 'text',
    title: 'Interpretación de las pruebas t',
    body:
      coefRows
        .slice(1)
        .map((r, j) => `${bNames[j + 1]}: ${r.sig ? 'significativo' : 'no significativo'}; por cada unidad más de ${xNames[j]}, ${yName} cambia en promedio ${fmt(r.b)} unidades${k > 1 ? ', manteniendo constantes las demás regresoras' : ''}.`)
        .join('\n') + (insignificant.length && k > 1 ? `\nConsidera retirar: ${insignificant.join(', ')}.` : ''),
  });

  if (k > 1) {
    const v = vifs(xs);
    steps.push({
      kind: 'table',
      title: 'Multicolinealidad: VIFⱼ = 1/(1 − Rⱼ²)',
      columns: ['Regresora', 'Rⱼ² (Xⱼ contra las demás)', 'VIFⱼ', 'Diagnóstico'],
      rows: v.map((r, j) => [xNames[j], fix(r.r2, 4), isFinite(r.vif) ? fix(r.vif, 4) : '∞', r.vif > 10 ? 'Severa' : r.vif > 5 ? 'Moderada' : 'Aceptable']),
      highlight: v.flatMap((r, j) => (r.vif > 5 ? [{ row: j, col: 3 }] : [])),
    });
    const severe = v.map((r, j) => (r.vif > 10 ? xNames[j] : null)).filter(Boolean);
    if (severe.length) warnings.push(`Multicolinealidad severa (VIF > 10) en ${severe.join(', ')}: los errores estándar están inflados.`);
  }
  if (df < 5) warnings.push(`Solo ${df} grados de libertad para el error: las inferencias son poco confiables.`);

  const comparison = fCrit !== undefined ? compareUpper('F₀', F, fCrit, 2) : compareP(pF, opts.alpha);
  if (fCrit !== undefined) {
    steps.push({ kind: 'text', title: 'Valor crítico', body: `F(${fmt(1 - opts.alpha)}; ${k}, ${df}) = ${fix(fCrit, 2)}.` });
  } else {
    steps.push({ kind: 'text', title: 'Valor p', body: `p = P(F ≥ ${fmt(F)}) = ${fmtP(pF)}.` });
  }
  const tail =
    comparison.decision === 'reject'
      ? simple
        ? `existe una relación lineal significativa entre ${xNames[0]} y ${yName}.`
        : `el modelo es significativo: al menos una de las regresoras explica la variación de ${yName}.`
      : simple
        ? `no hay evidencia de una relación lineal entre ${xNames[0]} y ${yName}.`
        : `no hay evidencia de que las regresoras expliquen la variación de ${yName}.`;
  const conclusion = `${comparison.phrase}. ${significance(opts.alpha)}, ${tail}`;
  steps.push(decisionStep(comparison.phrase), conclusionStep(conclusion));

  return {
    testId: 'linearRegression',
    testName: simple ? 'Regresión lineal simple' : 'Regresión lineal múltiple',
    family: 'regresion',
    alpha: opts.alpha,
    mode: opts.mode,
    hypotheses,
    statistic: { symbol: 'F₀', value: F },
    df: [k, df],
    criticalValue: fCrit !== undefined ? { value: fCrit, source: `Tabla F con (${k}, ${df}) gl` } : undefined,
    pValue: pF,
    decision: comparison.decision,
    conclusion,
    warnings,
    steps,
    chart: simple
      ? { kind: 'scatterFit', x: xs[0], y, b0: fit.beta[0], b1: fit.beta[1], xLabel: xNames[0], yLabel: yName }
      : { kind: 'residuals', fitted: fit.fitted, residuals: fit.residuals },
  };
}
