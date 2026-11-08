import type { TestDef } from './registry';
import type { TestResult } from './types';
import type { GroupDraft } from '../components/stats/Controls';
import { parseGroups } from '../components/stats/Controls';
import type { DecimalSeparator } from './core/parse';
import { ols } from './regression/linear';
import { studentT, fDist } from './core/distributions';
import { fix, fmt, fmtP } from './core/rounding';
import { findBestRegressionModel, parseVarMeta } from './regression/bestModel';
import { diagnoseResiduals } from './regression/residualsDiagnosis';
import { resultToText } from './export';

export interface GenerateAIReportParams {
  def: TestDef;
  groups: GroupDraft[];
  decimal: DecimalSeparator;
  alpha: number;
  mode: 'directo' | 'detallado';
  result: TestResult | null;
  variableName?: string;
  unit?: string;
}

/**
 * Genera un reporte exhaustivo en formato Markdown estructurado,
 * diseñado específicamente para ser copiado y proporcionado a una IA
 * (Gemini, ChatGPT, Claude) para su análisis, explicación o verificación.
 */
export function generateAIReport({
  def,
  groups,
  decimal,
  alpha,
  mode,
  result,
  variableName,
  unit,
}: GenerateAIReportParams): string {
  const isReg = def.input === 'regression';
  const lines: string[] = [];

  // Encabezado principal
  lines.push(`# REPORTE ESTADÍSTICO PARA ANÁLISIS CON INTELIGENCIA ARTIFICIAL`);
  lines.push(`**Prueba aplicada:** ${def.name}`);
  lines.push(`**Propósito:** ${def.when}`);
  lines.push(`**Nivel de significancia (α):** ${alpha} (${(alpha * 100).toFixed(1)}%)`);
  lines.push(`**Modo de cálculo:** ${isReg ? (mode === 'directo' ? 'Procedimiento Directo' : 'Procedimiento Detallado (Matricial)') : 'Estándar'}`);
  if (variableName) lines.push(`**Variable de estudio:** ${variableName}${unit ? ` (${unit})` : ''}`);
  lines.push('');

  // 1. Datos de entrada
  lines.push(`---`);
  lines.push(`## 1. DATOS DE ENTRADA`);
  const parsedAll = parseGroups(groups, decimal, true);
  const allGroups = 'groups' in parsedAll ? parsedAll.groups : [];

  if (allGroups.length === 0) {
    lines.push(`_No se han ingresado datos suficientes._`);
  } else {
    allGroups.forEach((g, idx) => {
      const isEnabled = groups[idx]?.enabled !== false;
      const statusText = isReg && idx > 0 ? (isEnabled ? ' [ACTIVA]' : ' [DESACTIVADA / EXCLUIDA]') : '';
      const role = isReg ? (idx === 0 ? ' (Variable dependiente Y)' : ` (Predictor X${idx})`) : '';
      lines.push(`### ${g.label}${role}${statusText}`);
      lines.push(`- **Observaciones (n):** ${g.values.length}`);
      lines.push(`- **Valores:** ${g.values.join(', ')}`);
      lines.push('');
    });
  }

  // Si es Regresión Lineal, generar el reporte completo
  if (isReg) {
    const parsedActive = parseGroups(groups, decimal, false);
    const activeGroups = 'groups' in parsedActive ? parsedActive.groups : [];

    if (activeGroups.length >= 2) {
      const [yGroup, ...xGroups] = activeGroups;
      const y = yGroup.values;
      const xs = xGroups.map((g) => g.values);
      const n = y.length;
      const k = xs.length;
      const p = k + 1;
      const df = n - p;

      if (df > 0 && xs.every((x) => x.length === n)) {
        try {
          const fit = ols(y, xs);
          const msr = fit.ssr / k;
          const F0 = fit.mse > 0 ? msr / fit.mse : Infinity;
          const pF = isFinite(F0) ? fDist.sf(F0, k, df) : 0;
          const fCrit = fDist.quantile(1 - alpha, k, df);
          const tCrit = studentT.quantile(1 - alpha / 2, df);

          const xMetas = xGroups.map((g, i) => parseVarMeta(g.label, i));

          // 2. Ecuación Estimada
          lines.push(`---`);
          lines.push(`## 2. ECUACIÓN ESTIMADA DEL MODELO`);
          const eqWithNames = `Ŷ = ${fmt(fit.beta[0])} ${fit.beta
            .slice(1)
            .map((b, i) => `${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))} · ${xGroups[i].label}`)
            .join(' ')}`;
          const eqWithTags = `Ŷ = ${fmt(fit.beta[0])} ${fit.beta
            .slice(1)
            .map((b, i) => `${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))} · ${xMetas[i].tag}`)
            .join(' ')}`;

          lines.push(`- **Forma nominal:** \`${eqWithNames}\``);
          lines.push(`- **Forma algebraica:** \`${eqWithTags}\``);
          lines.push(`- **Interpretación:** ${yGroup.label} estimada en función de ${k} regresores activos.`);
          lines.push('');

          // 3. Tabla ANOVA
          lines.push(`---`);
          lines.push(`## 3. TABLA ANOVA DE LA REGRESIÓN`);
          lines.push(`| Fuente de Variación | Suma de Cuadrados (SC) | Grados de Libertad (gl) | Cuadrado Medio (CM) | Estadístico F₀ | Valor p | F Crítico (α=${alpha}) |`);
          lines.push(`|---|---|---|---|---|---|---|`);
          lines.push(`| Regresión | ${fix(fit.ssr, 2)} | ${k} | ${fix(msr, 2)} | ${fix(F0, 2)} | ${fmtP(pF)} | ${fix(fCrit, 2)} |`);
          lines.push(`| Error (Residual) | ${fix(fit.sse, 2)} | ${df} | ${fix(fit.mse, 2)} (MSE) | — | — | — |`);
          lines.push(`| Total | ${fix(fit.sst, 2)} | ${n - 1} | — | — | — | — |`);
          lines.push('');
          lines.push(`**Decisión Global:** ${pF < alpha ? `Se rechaza H₀ (F₀ = ${fix(F0, 2)} > ${fix(fCrit, 2)}, p = ${fmtP(pF)}). El hiperplano de regresión lineal es estadísticamente significativo.` : `No se rechaza H₀ (F₀ = ${fix(F0, 2)} ≤ ${fix(fCrit, 2)}, p = ${fmtP(pF)}).`}`);
          lines.push('');

          // 4. Coeficientes de Determinación y MSE
          lines.push(`---`);
          lines.push(`## 4. BONDAD DE AJUSTE Y MSE`);
          lines.push(`- **R² Convencional:** ${(fit.r2 * 100).toFixed(4)} % (R² = ${fix(fit.r2, 6)})`);
          lines.push(`  _El ${(fit.r2 * 100).toFixed(4)} % de la variabilidad observada en ${yGroup.label} es explicada por el modelo._`);
          lines.push(`- **R² Ajustado (R²_adj):** ${(fit.r2adj * 100).toFixed(4)} % (R²_adj = ${fix(fit.r2adj, 6)})`);
          lines.push(`  _Penaliza variables redundantes mediante el factor (n−1)/(n−p)._`);
          lines.push(`- **MSE (Cuadrado Medio del Error / σ²):** ${fix(fit.mse, 4)}`);
          lines.push(`  _Estimador insesgado de la varianza residual._`);
          lines.push(`- **F₀ Global:** ${fix(F0, 2)} (p = ${fmtP(pF)})`);
          lines.push('');

          // 5. Pruebas t individuales en 8 pasos
          lines.push(`---`);
          lines.push(`## 5. PRUEBAS t INDIVIDUALES DE SIGNIFICANCIA (8 PASOS FORMALES)`);
          lines.push(`Grados de libertad residuales: df = ${df}. Valor crítico: t_crit = ±${fix(tCrit, 4)}.`);
          lines.push('');

          // Intercepto
          const seB0 = Math.sqrt(Math.max(0, fit.mse * fit.C[0][0]));
          const t0B0 = seB0 > 0 ? fit.beta[0] / seB0 : 0;
          const pTB0 = 2 * studentT.sf(Math.abs(t0B0), df);
          const isB0Sig = pTB0 < alpha;

          lines.push(`### Intercepto (β₀)`);
          lines.push(`1. **Parámetro:** Intercepto del modelo (β₀).`);
          lines.push(`2. **Hipótesis nula:** H₀: β₀ = 0`);
          lines.push(`3. **Hipótesis alternativa:** H₁: β₀ ≠ 0`);
          lines.push(`4. **Nivel de significancia:** α = ${alpha}`);
          lines.push(`5. **Estadístico de prueba:** t₀ = β̂₀ / SE(β̂₀) = ${fmt(fit.beta[0])} / ${fmt(seB0)}`);
          lines.push(`6. **Criterio de decisión:** Rechazar H₀ si |t₀| > ${fix(tCrit, 4)} o si p < ${alpha}.`);
          lines.push(`7. **Cálculos:** t₀ = ${fix(t0B0, 4)}, Valor p = ${fmtP(pTB0)}, C₀₀ = ${fix(fit.C[0][0], 6)}.`);
          lines.push(`8. **Decisión:** ${isB0Sig ? `Se rechaza H₀. El intercepto es estadísticamente significativo (p = ${fmtP(pTB0)} < ${alpha}).` : `No se rechaza H₀. El intercepto no es estadísticamente significativo (p = ${fmtP(pTB0)} ≥ ${alpha}).`}`);
          lines.push('');

          // Pendientes
          for (let j = 1; j <= k; j++) {
            const se = Math.sqrt(Math.max(0, fit.mse * fit.C[j][j]));
            const t0 = se > 0 ? fit.beta[j] / se : 0;
            const pT = 2 * studentT.sf(Math.abs(t0), df);
            const isSig = pT < alpha;
            const meta = xMetas[j - 1];

            lines.push(`### Pendiente β${meta.subscript} (${xGroups[j - 1].label})`);
            lines.push(`1. **Parámetro:** Coeficiente de regresión para ${meta.cleanName} (${meta.tag}).`);
            lines.push(`2. **Hipótesis nula:** H₀: β${meta.subscript} = 0`);
            lines.push(`3. **Hipótesis alternativa:** H₁: β${meta.subscript} ≠ 0`);
            lines.push(`4. **Nivel de significancia:** α = ${alpha}`);
            lines.push(`5. **Estadístico de prueba:** t₀ = β̂${meta.subscript} / SE(β̂${meta.subscript}) = ${fmt(fit.beta[j])} / ${fmt(se)}`);
            lines.push(`6. **Criterio de decisión:** Rechazar H₀ si |t₀| > ${fix(tCrit, 4)} o si p < ${alpha}.`);
            lines.push(`7. **Cálculos:** t₀ = ${fix(t0, 4)}, Valor p = ${fmtP(pT)}, C_${j}${j} = ${fix(fit.C[j][j], 6)}.`);
            lines.push(`8. **Decisión:** ${isSig ? `Se rechaza H₀. ${meta.cleanName} es estadísticamente significativa y aporta linealmente al modelo.` : `No se rechaza H₀. ${meta.cleanName} no es estadísticamente significativa al nivel α = ${alpha}.`}`);
            lines.push('');
          }

          // 6. Diagnóstico de residuos
          const resDiag = diagnoseResiduals(fit.residuals, fit.fitted, alpha);
          lines.push(`---`);
          lines.push(`## 6. DIAGNÓSTICO DE SUPUESTOS DE LOS RESIDUOS`);
          lines.push(`- **Normalidad (${resDiag.normalityTest.testName}):** Estadístico = ${fix(resDiag.normalityTest.statistic.value, 4)}, Valor p = ${fmtP(resDiag.normalityTest.pValue ?? 0)}. Conclusión: ${resDiag.normalityTest.conclusion}`);
          lines.push(`- **Homocedasticidad:** ${resDiag.heteroscedasticity.description} (Varianza ${resDiag.heteroscedasticity.hasHetero ? 'heterocedástica' : 'constante / homocedástica'}).`);
          lines.push(`- **Linealidad:** ${resDiag.linearity.description}`);
          lines.push('');

          // 7. Ruta de Mejora / Selección del Mejor Modelo (Backward Elimination)
          const bestModelRes = findBestRegressionModel(y, allGroups.slice(1).length >= 2 ? allGroups.slice(1) : xGroups, alpha);
          if (bestModelRes) {
            lines.push(`---`);
            lines.push(`## 7. RUTA DE MEJORA: ELIMINACIÓN HACIA ATRÁS (BACKWARD ELIMINATION)`);
            lines.push(`### Tabla Comparativa de Iteraciones:`);
            lines.push(`| Etapa | Variables Activas | k | gl_E | SS_E | MSE (σ²) | F₀ Global | R²_adj (%) | Decisión |`);
            lines.push(`|---|---|---|---|---|---|---|---|---|`);
            bestModelRes.comparisonTable.forEach((row) => {
              lines.push(`| ${row.title} | ${row.varsList} | ${row.k} | ${row.dfe} | ${fix(row.sse, 2)} | ${fix(row.mse, 2)} | ${fix(row.f0, 1)} | ${(row.r2adj * 100).toFixed(4)}% | ${row.decision} |`);
            });
            lines.push('');
            lines.push(`### ★ MODELO ÓPTIMO SELECCIONADO:`);
            lines.push(`- **Variables:** ${bestModelRes.optimalStep.labels.join(', ')}`);
            lines.push(`- **Mínimo MSE:** ${fix(bestModelRes.optimalStep.mse, 4)}`);
            lines.push(`- **Máximo R²_adj:** ${(bestModelRes.optimalStep.r2adj * 100).toFixed(4)} %`);
            lines.push(`- **F₀ Global:** ${fix(bestModelRes.optimalStep.f0, 2)} (p < 0.0001)`);
            lines.push(`- **Recomendación:** ${bestModelRes.recommendation}`);
            lines.push('');
          }
        } catch (e) {
          lines.push(`_Error al calcular regresión completa: ${(e as Error).message}_`);
        }
      }
    }
  } else if (result) {
    // Si no es regresión y tenemos un TestResult estándar
    lines.push(`---`);
    lines.push(`## 2. RESULTADOS ESTADÍSTICOS Y PROCEDIMIENTO`);
    lines.push(resultToText(result));
  }

  lines.push('');
  lines.push(`---`);
  lines.push(`_Reporte exportado desde Zajtistics para análisis con Asistente de IA._`);

  return lines.join('\n');
}
