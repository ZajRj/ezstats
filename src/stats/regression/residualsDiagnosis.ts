import { normal } from '../core/distributions';
import { mean, sd, skewness, kurtosis } from '../core/descriptive';
import { shapiroWilk } from '../tests/normality/shapiroWilk';
import type { TestResult } from '../types';

export interface QQPoint {
  q: number;
  e: number;
}

export interface ResidualsDiagnosis {
  n: number;
  qqPoints: QQPoint[];
  qqLine: { slope: number; intercept: number };
  fittedVsResiduals: { fitted: number; residual: number }[];
  sdResiduals: number;
  skew: number;
  kurt: number;
  normalityTest: TestResult;
  isNormal: boolean;
  normalityP: number;
  heteroscedasticity: {
    hasHetero: boolean;
    correlation: number;
    description: string;
  };
  linearity: {
    isLinear: boolean;
    curvatureCorr: number;
    description: string;
  };
}

export function diagnoseResiduals(residuals: number[], fitted: number[], alpha = 0.05): ResidualsDiagnosis {
  const n = residuals.length;
  const s = [...residuals].sort((a, b) => a - b);
  const m = mean(residuals);
  const sDev = sd(residuals);
  const skew = skewness(residuals);
  const kurt = kurtosis(residuals);

  // QQ plot: cuantiles teóricos normales de Blom
  const an25 = n + 0.25;
  const qqPoints: QQPoint[] = s.map((e, idx) => {
    const p = (idx + 1 - 0.375) / an25;
    const q = normal.quantile(p);
    return { q, e };
  });

  // Línea de referencia QQ (recta ideal que pasa por los cuartiles o MCO de (q, e))
  const meanQ = mean(qqPoints.map((p) => p.q));
  const meanE = mean(qqPoints.map((p) => p.e));
  let ssQ = 0;
  let ssQE = 0;
  qqPoints.forEach((p) => {
    ssQ += (p.q - meanQ) ** 2;
    ssQE += (p.q - meanQ) * (p.e - meanE);
  });
  const slope = ssQ > 0 ? ssQE / ssQ : sDev;
  const intercept = meanE - slope * meanQ;

  // Normalidad formal con Shapiro-Wilk
  const normalityTest = shapiroWilk(residuals, { alpha, mode: 'exacto' });
  const normalityP = normalityTest.pValue ?? 0;
  const isNormal = normalityTest.decision === 'fail_to_reject';

  // Diagnóstico de heterocedasticidad (correlación entre |e| y fitted)
  const absRes = residuals.map(Math.abs);
  const meanAbs = mean(absRes);
  const meanFit = mean(fitted);
  let covAbsFit = 0;
  let varAbs = 0;
  let varFit = 0;
  for (let i = 0; i < n; i++) {
    const da = absRes[i] - meanAbs;
    const df = fitted[i] - meanFit;
    covAbsFit += da * df;
    varAbs += da * da;
    varFit += df * df;
  }
  const heteroCorr = varAbs > 0 && varFit > 0 ? covAbsFit / Math.sqrt(varAbs * varFit) : 0;
  const hasHetero = Math.abs(heteroCorr) > 0.35;
  const heteroDesc = hasHetero
    ? `Posible heterocedasticidad detectada (r = ${heteroCorr.toFixed(2)}): la dispersión de los residuos varía con la magnitud de los valores ajustados Ŷ.`
    : `Homocedasticidad adecuada (r = ${heteroCorr.toFixed(2)} ≈ 0): la varianza de los residuos se mantiene sensiblemente constante a lo largo de Ŷ.`;

  // Diagnóstico de linealidad (correlación de e con fitted²)
  const fittedSq = fitted.map((f) => f * f);
  const meanFitSq = mean(fittedSq);
  let covResSq = 0;
  let varFitSq = 0;
  for (let i = 0; i < n; i++) {
    const dr = residuals[i] - m;
    const df2 = fittedSq[i] - meanFitSq;
    covResSq += dr * df2;
    varFitSq += df2 * df2;
  }
  const linCorr = varAbs > 0 && varFitSq > 0 ? covResSq / Math.sqrt(varAbs * varFitSq) : 0;
  const isLinear = Math.abs(linCorr) < 0.30;
  const linDesc = isLinear
    ? `Linealidad validada (r = ${linCorr.toFixed(2)}): los residuos se distribuyen aleatoriamente alrededor de 0 sin patrones curvos evidentes.`
    : `Posible no linealidad (r = ${linCorr.toFixed(2)}): existe un patrón de curvatura sistemático en los residuos que sugiere evaluar términos polinómicos o transformaciones.`;

  const fittedVsResiduals = fitted.map((f, i) => ({ fitted: f, residual: residuals[i] }));

  return {
    n,
    qqPoints,
    qqLine: { slope, intercept },
    fittedVsResiduals,
    sdResiduals: sDev,
    skew,
    kurt,
    normalityTest,
    isNormal,
    normalityP,
    heteroscedasticity: {
      hasHetero,
      correlation: heteroCorr,
      description: heteroDesc,
    },
    linearity: {
      isLinear,
      curvatureCorr: linCorr,
      description: linDesc,
    },
  };
}
