import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, TextInput, LayoutAnimation, ScrollView, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import { colors } from '../../theme/colors';
import { fix, fmt, fmtP } from '../../stats/core/rounding';
import { studentT, fDist } from '../../stats/core/distributions';
import { ols, type OlsFit } from '../../stats/regression/linear';
import { diagnoseResiduals, type ResidualsDiagnosis } from '../../stats/regression/residualsDiagnosis';
import {
  findBestRegressionModel,
  parseVarMeta,
  extractVarTag,
  type BestModelResult,
  type BackwardStep,
} from '../../stats/regression/bestModel';
import StudentTCurve from './StudentTCurve';
import type { Group } from '../../stats/tests/anova/anovaCore';

interface DirectRegressionViewProps {
  groups: Group[];
  allGroups?: Group[];
  alpha: number;
  onApplyBestModel?: (activeLabels: string[]) => void;
}

export default function DirectRegressionView({ groups, allGroups, alpha, onApplyBestModel }: DirectRegressionViewProps) {
  if (groups.length < 2) return null;

  const [yGroup, ...rawXGroups] = groups;

  // Ordenar regresoras por su subíndice natural (x₁, x₂, x₃, ...)
  const xGroups = useMemo(() => {
    return [...rawXGroups].sort((a, b) => {
      const metaA = parseVarMeta(a.label, 0);
      const metaB = parseVarMeta(b.label, 0);
      return metaA.order - metaB.order;
    });
  }, [rawXGroups]);

  const y = yGroup.values;
  const xs = xGroups.map((g) => g.values);
  const n = y.length;
  const k = xs.length;
  const p = k + 1;
  const df = n - p;

  if (xs.some((x) => x.length !== n) || df <= 0) return null;

  // Ajuste OLS
  const fit = useMemo(() => ols(y, xs), [y, xs]);
  const yName = yGroup.label;
  const xMetas = useMemo(() => xGroups.map((g, i) => parseVarMeta(g.label, i)), [xGroups]);
  const xNames = useMemo(() => xGroups.map((g) => g.label), [xGroups]);
  const xTags = useMemo(() => xMetas.map((m) => m.tag), [xMetas]);

  // Estado para acordeones de pruebas t de cada coeficiente (desplegables)
  const [openCoeffs, setOpenCoeffs] = useState<Record<number, boolean>>({});
  const toggleCoeff = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenCoeffs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Estado para la inspección de etapas en la Selección del Mejor Modelo (Backward Elimination)
  const [selectedFlowStepIdx, setSelectedFlowStepIdx] = useState<number | null>(null);
  const [openInspectedCoeffs, setOpenInspectedCoeffs] = useState<Record<string, boolean>>({});
  const toggleInspectedCoeff = (stepIndex: number, coeffJ: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const key = `${stepIndex}-${coeffJ}`;
    setOpenInspectedCoeffs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Estado para desplegar los Criterios Metodológicos
  const [showCriteria, setShowCriteria] = useState<boolean>(false);
  const toggleCriteria = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCriteria((prev) => !prev);
  };

  // Estado para valores de aplicación predictiva
  const [predInputs, setPredInputs] = useState<Record<number, string>>({});

  // Diagnóstico de residuos (QQ-Plot, homocedasticidad, linealidad)
  const resDiag = useMemo(() => diagnoseResiduals(fit.residuals, fit.fitted, alpha), [fit, alpha]);

  // Candidatas para el mejor modelo (evalúa todas las disponibles si se proporcionaron)
  const candidateXGroups = useMemo(() => {
    if (allGroups && allGroups.length >= 2) {
      // Filtrar sólo las que tengan la misma longitud n que Y
      const valid = allGroups.slice(1).filter((g) => g.values.length === n);
      if (valid.length > 0) return valid;
    }
    return xGroups;
  }, [allGroups, xGroups, n]);

  // Mejor modelo
  const bestModelResult = useMemo(
    () => findBestRegressionModel(y, candidateXGroups, alpha),
    [y, candidateXGroups, alpha],
  );

  // Estadísticas globales ANOVA
  const msr = fit.ssr / k;
  const F0 = fit.mse > 0 ? msr / fit.mse : Infinity;
  const pF = isFinite(F0) ? fDist.sf(F0, k, df) : 0;
  const fCrit = fDist.quantile(1 - alpha, k, df);
  const isGlobalSig = pF < alpha;

  // Pruebas t individuales para los 8 pasos
  const tCrit = studentT.quantile(1 - alpha / 2, df);
  const coeffRows = useMemo(() => {
    return fit.beta.map((b, j) => {
      const se = Math.sqrt(Math.max(0, fit.mse * fit.C[j][j]));
      const t0 = se > 0 ? b / se : 0;
      const pT = 2 * studentT.sf(Math.abs(t0), df);
      const isSig = pT < alpha;
      if (j === 0) {
        return {
          j: 0,
          betaHat: b,
          se,
          cjj: fit.C[0][0],
          t0,
          pT,
          isSig,
          tag: 'β₀',
          subscript: '₀',
          name: 'Intercepto (β₀)',
          shortName: 'Intercepto (β₀)',
          varName: 'Intercepto',
        };
      }
      const meta = xMetas[j - 1];
      return {
        j,
        betaHat: b,
        se,
        cjj: fit.C[j][j],
        t0,
        pT,
        isSig,
        tag: meta.tag,
        subscript: meta.subscript,
        name: `β${meta.subscript} (${xGroups[j - 1].label})`,
        shortName: `β${meta.subscript} (${meta.cleanName} (${meta.tag}))`,
        varName: meta.cleanName,
      };
    });
  }, [fit, df, alpha, xMetas, xGroups]);

  // Predicción calculada en tiempo real
  const prediction = useMemo(() => {
    const x0Vals: number[] = [];
    for (let i = 0; i < k; i++) {
      const val = parseFloat((predInputs[i] ?? '').replace(',', '.'));
      if (isNaN(val)) return null;
      x0Vals.push(val);
    }
    const x0 = [1, ...x0Vals];
    const yHat = x0.reduce((s, x, j) => s + x * fit.beta[j], 0);

    // x0ᵀ C x0
    const x0tC = x0.map((_, col) => x0.reduce((s, x, row) => s + x * fit.C[row][col], 0));
    const vMean = x0tC.reduce((s, v, j) => s + v * x0[j], 0);

    const seMean = Math.sqrt(Math.max(0, fit.mse * vMean));
    const sePred = Math.sqrt(Math.max(0, fit.mse * (1 + vMean)));

    return {
      yHat,
      seMean,
      sePred,
      ciMeanLower: yHat - tCrit * seMean,
      ciMeanUpper: yHat + tCrit * seMean,
      piLower: yHat - tCrit * sePred,
      piUpper: yHat + tCrit * sePred,
    };
  }, [predInputs, k, fit, tCrit]);

  const svgWidth = Math.min(350, Dimensions.get('window').width - 48);

  return (
    <View style={styles.container}>
      {/* 1. ECUACIÓN ESTIMADA */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="calculator-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>1. Ecuación Estimada del Modelo</Text>
        </View>

        {/* Modelo Teórico General */}
        <View style={styles.equationBoxTheoretical}>
          <Text style={styles.equationBoxSubtitleTheoretical}>Modelo poblacional teórico general:</Text>
          <Text style={styles.equationTextTheoretical}>
            Yᵢ = β₀ + {xMetas.map((m) => `β${m.subscript} · X${m.subscript}`).join(' + ')} + εᵢ
          </Text>
        </View>

        {/* Ecuación con nombres descriptivos de variables */}
        <View style={styles.equationBox}>
          <Text style={styles.equationBoxSubtitle}>Ecuación estimada con nombres de variables:</Text>
          <Text style={styles.equationText}>
            Ŷ = {fmt(fit.beta[0])}{' '}
            {fit.beta
              .slice(1)
              .map((b, i) => `${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))} · ${xNames[i]}`)
              .join(' ')}
          </Text>
        </View>

        {/* Ecuación estándar algebraica sin simplificar nombres (solo x₁, x₂, ...) */}
        <View style={[styles.equationBox, styles.equationBoxAlt]}>
          <Text style={styles.equationBoxSubtitleAlt}>Ecuación algebraica estándar (sin nombres, solo xᵢ):</Text>
          <Text style={styles.equationTextAlt}>
            Ŷ = {fmt(fit.beta[0])}{' '}
            {fit.beta
              .slice(1)
              .map((b, i) => `${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))} · ${xTags[i]}`)
              .join(' ')}
          </Text>
        </View>

        <Text style={styles.equationNote}>
          Donde <Text style={styles.bold}>{yName}</Text> es la variable dependiente (Y) estimada en función de las {k} regresoras activas ({xTags.join(', ')}).
        </Text>
      </View>

      {/* 2. TABLA ANOVA DE LA REGRESIÓN */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="grid-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>2. Tabla ANOVA de la Regresión</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
          <View style={styles.table}>
            <View style={styles.tableHeadRow}>
              <Text style={[styles.th, { width: 90 }]}>Fuente</Text>
              <Text style={[styles.th, { width: 95 }]}>SC</Text>
              <Text style={[styles.th, { width: 45 }]}>gl</Text>
              <Text style={[styles.th, { width: 95 }]}>CM</Text>
              <Text style={[styles.th, { width: 85 }]}>F₀</Text>
              <Text style={[styles.th, { width: 85 }]}>Valor p</Text>
              <Text style={[styles.th, { width: 75 }]}>F crítico</Text>
            </View>

            <View style={[styles.tableRow, styles.rowHighlight]}>
              <Text style={[styles.tdBold, { width: 90 }]}>Regresión</Text>
              <Text style={[styles.td, { width: 95 }]}>{fix(fit.ssr, 4)}</Text>
              <Text style={[styles.td, { width: 45 }]}>{k}</Text>
              <Text style={[styles.td, { width: 95 }]}>{fix(msr, 4)}</Text>
              <Text style={[styles.tdHighlight, { width: 85 }]}>{fix(F0, 4)}</Text>
              <Text style={[styles.tdBold, { width: 85, color: isGlobalSig ? '#15803D' : '#DC2626' }]}>
                {fmtP(pF)}
              </Text>
              <Text style={[styles.td, { width: 75 }]}>{fix(fCrit, 2)}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.td, { width: 90 }]}>Error</Text>
              <Text style={[styles.td, { width: 95 }]}>{fix(fit.sse, 4)}</Text>
              <Text style={[styles.td, { width: 45 }]}>{df}</Text>
              <Text style={[styles.td, { width: 95 }]}>{fix(fit.mse, 4)}</Text>
              <Text style={[styles.td, { width: 85 }]}>—</Text>
              <Text style={[styles.td, { width: 85 }]}>—</Text>
              <Text style={[styles.td, { width: 75 }]}>—</Text>
            </View>

            <View style={[styles.tableRow, styles.tableFooter]}>
              <Text style={[styles.tdBold, { width: 90 }]}>Total</Text>
              <Text style={[styles.tdBold, { width: 95 }]}>{fix(fit.sst, 4)}</Text>
              <Text style={[styles.tdBold, { width: 45 }]}>{n - 1}</Text>
              <Text style={[styles.td, { width: 95 }]}>—</Text>
              <Text style={[styles.td, { width: 85 }]}>—</Text>
              <Text style={[styles.td, { width: 85 }]}>—</Text>
              <Text style={[styles.td, { width: 75 }]}>—</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.badgeBanner, { backgroundColor: isGlobalSig ? '#DCFCE7' : '#FEE2E2' }]}>
          <Ionicons name={isGlobalSig ? 'checkmark-circle' : 'close-circle'} size={18} color={isGlobalSig ? '#16A34A' : '#DC2626'} />
          <Text style={[styles.badgeBannerText, { color: isGlobalSig ? '#166534' : '#991B1B' }]}>
            {isGlobalSig
              ? `El modelo es globalmente significativo (F₀ = ${fix(F0, 2)} > ${fix(fCrit, 2)}, p = ${fmtP(pF)} < ${alpha}). Al menos un predictor explica la variabilidad de ${yName}.`
              : `El modelo no es globalmente significativo (F₀ = ${fix(F0, 2)} ≤ ${fix(fCrit, 2)}, p = ${fmtP(pF)}).`}
          </Text>
        </View>
      </View>

      {/* 3. COEFICIENTES DE DETERMINACIÓN Y ESTADÍSTICOS CLAVE */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="pie-chart-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>3. Coeficientes de Determinación (Bondad de Ajuste) y MSE</Text>
        </View>

        <View style={styles.r2Row}>
          <View style={styles.r2Box}>
            <Text style={styles.r2Label}>R² Convencional</Text>
            <Text style={styles.r2Value}>{(fit.r2 * 100).toFixed(4)} %</Text>
            <Text style={styles.r2Sub}>R² = {fix(fit.r2, 6)}</Text>
          </View>

          <View style={[styles.r2Box, styles.r2BoxActive]}>
            <Text style={[styles.r2Label, { color: colors.primary }]}>R² Ajustado</Text>
            <Text style={[styles.r2Value, { color: colors.primary }]}>{(fit.r2adj * 100).toFixed(4)} %</Text>
            <Text style={styles.r2Sub}>R²_adj = {fix(fit.r2adj, 6)}</Text>
          </View>

          <View style={[styles.r2Box, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
            <Text style={[styles.r2Label, { color: '#B45309' }]}>MSE (σ²)</Text>
            <Text style={[styles.r2Value, { color: '#B45309' }]}>{fix(fit.mse, 4)}</Text>
            <Text style={styles.r2Sub}>CM Error ANOVA</Text>
          </View>
        </View>

        <Text style={styles.noteText}>
          • <Text style={styles.bold}>Interpretación R²:</Text> El {(fit.r2 * 100).toFixed(4)} % de la variabilidad observada en {yName} se explica linealmente por los predictores activos.
        </Text>
        <Text style={styles.noteText}>
          • <Text style={styles.bold}>MSE (Cuadrado Medio del Error, σ² = {fix(fit.mse, 4)}):</Text> Estimador insesgado de la varianza del término de error aleatorio. El modelo óptimo busca minimizar este error.
        </Text>
        <Text style={styles.noteText}>
          • <Text style={styles.bold}>¿Por qué R² ajustado?:</Text> El R² ordinario nunca disminuye al agregar variables redundantes. El <Text style={styles.bold}>R² ajustado</Text> penaliza con el factor (n − 1)/(n − p) y alcanza su máximo exactamente cuando el MSE se minimiza.
        </Text>
      </View>

      {/* 4. ANÁLISIS DE COEFICIENTES INDIVIDUALES (PRUEBA T EN 8 PASOS + GRÁFICAS) */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="git-branch-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>4. Pruebas t Individuales (8 Pasos)</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Toca cada parámetro para desplegar la prueba de hipótesis formal con sus 8 pasos y la gráfica de la campana t:
        </Text>

        {coeffRows.map((c, cIdx) => {
          const isOpen = !!openCoeffs[c.j];
          return (
            <View key={`coeff-acc-${c.j}-${cIdx}`} style={styles.accordionContainer}>
              {/* Header colapsable con preview verde / rojo */}
              <Pressable
                onPress={() => toggleCoeff(c.j)}
                style={({ pressed }) => [styles.accordionHead, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}: ${c.isSig ? 'Significativo' : 'No significativo'}`}
              >
                <View style={styles.accordionHeadLeft}>
                  <Text style={styles.paramItemTitle}>{c.shortName}</Text>
                  <Text style={styles.paramItemValue}>β̂ = {fmt(c.betaHat, 4)}</Text>
                </View>

                <View style={styles.accordionHeadRight}>
                  <View style={[styles.pillBadge, { backgroundColor: c.isSig ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Ionicons
                      name={c.isSig ? 'checkmark-circle' : 'close-circle'}
                      size={14}
                      color={c.isSig ? '#15803D' : '#DC2626'}
                    />
                    <Text style={[styles.pillBadgeText, { color: c.isSig ? '#15803D' : '#DC2626' }]}>
                      {c.isSig ? 'Significativo' : 'No significativo'}
                    </Text>
                  </View>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
                </View>
              </Pressable>

              {/* Contenido desplegado: Los 8 Pasos Universales */}
              {isOpen && (
                <View style={styles.accordionBody}>
                  {/* Gráfica de la campana t con zonas de rechazo y posición de t0 */}
                  <Text style={styles.graphTitle}>Distribución Student-t (gl = {df}, α = {alpha}):</Text>
                  <StudentTCurve df={df} alpha={alpha} t0={c.t0} tCrit={tCrit} />

                  {/* Pasos numerados */}
                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>① Parámetro a Evaluar:</Text>
                    <Text style={styles.stepContent}>
                      {c.name} (efecto lineal de {c.varName} sobre {yName}).
                    </Text>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>② Hipótesis Nula (H₀):</Text>
                    <Text style={styles.stepContent}>
                      H₀: {c.j === 0 ? 'β₀ = 0' : `β${c.subscript} = 0`} (la variable no aporta información lineal significativa al modelo en presencia de los demás predictores).
                    </Text>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>③ Hipótesis Alternativa (H₁):</Text>
                    <Text style={styles.stepContent}>
                      H₁: {c.j === 0 ? 'β₀ ≠ 0' : `β${c.subscript} ≠ 0`} (la variable influye significativamente sobre {yName}).
                    </Text>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>④ Nivel de Significancia:</Text>
                    <Text style={styles.stepContent}>
                      α = {alpha}  (α/2 = {(alpha / 2).toFixed(4)} para prueba bilateral de dos colas).
                    </Text>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>⑤ Estadístico de Prueba:</Text>
                    <Text style={styles.stepFormula}>
                      t₀ = β̂{c.subscript} / √(σ̂² · C{c.j}{c.j}) = β̂{c.subscript} / EE(β̂{c.subscript}) ~ t({df})
                    </Text>
                    <Text style={styles.stepContent}>
                      Donde σ̂² = MSE = {fix(fit.mse, 4)} y C{c.j}{c.j} es el elemento diagonal de la matriz (XᵀX)⁻¹.
                    </Text>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>⑥ Criterio de Rechazo:</Text>
                    <Text style={styles.stepContent}>
                      Se rechaza H₀ si |t₀| &gt; t({1 - alpha / 2}; {df}) = {fix(tCrit, 3)} o si Valor p &lt; {alpha}.
                    </Text>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>⑦ Cálculos:</Text>
                    <View style={styles.calcBox}>
                      <Text style={styles.calcLine}>• β̂{c.subscript} = {fmt(c.betaHat, 4)}</Text>
                      <Text style={styles.calcLine}>• C{c.j}{c.j} = {fix(c.cjj, 6)} (diagonal de (XᵀX)⁻¹)</Text>
                      <Text style={styles.calcLine}>• EE = √({fix(fit.mse, 4)} · {fix(c.cjj, 6)}) = {fix(c.se, 4)}</Text>
                      <Text style={styles.calcHighlight}>• Estadístico: t₀ = {fix(c.t0, 4)}</Text>
                      <Text style={styles.calcHighlight}>• Valor p: p = {fmtP(c.pT)}</Text>
                    </View>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>⑧ Decisión y Conclusión:</Text>
                    <View style={[styles.verdictBox, { backgroundColor: c.isSig ? '#DCFCE7' : '#FEE2E2' }]}>
                      <Text style={[styles.verdictText, { color: c.isSig ? '#14532D' : '#7F1D1D' }]}>
                        {c.isSig
                          ? `SE RECHAZA H₀ (|t₀| = ${fix(Math.abs(c.t0), 3)} > ${fix(tCrit, 3)}, p = ${fmtP(c.pT)} < ${alpha}). Conclusión: Existe evidencia estadística suficiente de que ${c.varName} tiene un efecto significativo sobre ${yName}. Por cada unidad que aumenta ${c.varName}, ${yName} cambia en promedio ${fmt(c.betaHat, 4)} unidades (manteniendo las demás constantes).`
                          : `NO SE RECHAZA H₀ (|t₀| = ${fix(Math.abs(c.t0), 3)} ≤ ${fix(tCrit, 3)}, p = ${fmtP(c.pT)} ≥ ${alpha}). Conclusión: No hay evidencia estadística suficiente de que ${c.varName} influya linealmente en ${yName} en presencia de los demás predictores. Se recomienda considerarla para eliminación hacia atrás.`}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* 5. EVALUACIÓN DE NORMALIDAD DE RESIDUOS */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="pulse-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>5. Evaluación de Normalidad de Residuos</Text>
        </View>

        {/* Gráfico QQ-Plot en SVG */}
        <View style={styles.graphContainer}>
          <Text style={styles.graphTitle}>Gráfico de Probabilidad Normal (QQ-Plot):</Text>
          <Svg width={svgWidth} height={160}>
            {/* Ejes */}
            <Line x1={30} y1={130} x2={svgWidth - 20} y2={130} stroke="#94A3B8" strokeWidth={1} />
            <Line x1={30} y1={20} x2={30} y2={130} stroke="#94A3B8" strokeWidth={1} />

            {/* Puntos QQ */}
            {(() => {
              const qs = resDiag.qqPoints.map((p) => p.q);
              const es = resDiag.qqPoints.map((p) => p.e);
              const minQ = Math.min(...qs);
              const maxQ = Math.max(...qs);
              const minE = Math.min(...es);
              const maxE = Math.max(...es);

              const mapX = (q: number) => 35 + ((q - minQ) / (maxQ - minQ || 1)) * (svgWidth - 65);
              const mapY = (e: number) => 125 - ((e - minE) / (maxE - minE || 1)) * 100;

              return (
                <>
                  <Line
                    x1={mapX(minQ)}
                    y1={mapY(minE)}
                    x2={mapX(maxQ)}
                    y2={mapY(maxE)}
                    stroke="#CBD5E1"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                  {resDiag.qqPoints.map((p, idx) => (
                    <Circle
                      key={`qq-${idx}`}
                      cx={mapX(p.q)}
                      cy={mapY(p.e)}
                      r={3.5}
                      fill={colors.primary}
                      opacity={0.8}
                    />
                  ))}
                </>
              );
            })()}
          </Svg>
        </View>

        {/* Estadísticas de la prueba de Shapiro-Wilk */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Estadístico W</Text>
            <Text style={styles.metricVal}>{fix(resDiag.normalityTest.statistic.value, 4)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Valor p (Normalidad)</Text>
            <Text style={[styles.metricVal, { color: resDiag.isNormal ? '#15803D' : '#DC2626' }]}>
              {fmtP(resDiag.normalityP)}
            </Text>
          </View>
        </View>

        <View style={[styles.badgeBanner, { backgroundColor: resDiag.isNormal ? '#DCFCE7' : '#FEE2E2' }]}>
          <Ionicons
            name={resDiag.isNormal ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={resDiag.isNormal ? '#16A34A' : '#DC2626'}
          />
          <Text style={[styles.badgeBannerText, { color: resDiag.isNormal ? '#166534' : '#991B1B' }]}>
            {resDiag.isNormal
              ? `Se cumple el supuesto de normalidad de residuos (p = ${fmtP(resDiag.normalityP)} ≥ ${alpha}). Las pruebas t y F son estadísticamente válidas.`
              : `Alerta: Los residuos muestran desviación de la normalidad (p = ${fmtP(resDiag.normalityP)} < ${alpha}). Se recomienda revisar observaciones atípicas.`}
          </Text>
        </View>
      </View>

      {/* 6. DIAGNÓSTICO DE VARIANZA Y LINEALIDAD */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="analytics-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>6. Diagnóstico de Varianza y Linealidad</Text>
        </View>

        {/* Gráfico Ajustados vs Residuos */}
        <View style={styles.graphContainer}>
          <Text style={styles.graphTitle}>Residuos vs Valores Ajustados (Homocedasticidad):</Text>
          <Svg width={svgWidth} height={160}>
            <Line x1={30} y1={130} x2={svgWidth - 20} y2={130} stroke="#94A3B8" strokeWidth={1} />
            <Line x1={30} y1={20} x2={30} y2={130} stroke="#94A3B8" strokeWidth={1} />

            {(() => {
              const fs = resDiag.fittedVsResiduals.map((p) => p.fitted);
              const rs = resDiag.fittedVsResiduals.map((p) => p.residual);
              const minF = Math.min(...fs);
              const maxF = Math.max(...fs);
              const minR = Math.min(...rs);
              const maxR = Math.max(...rs);

              const mapX = (f: number) => 35 + ((f - minF) / (maxF - minF || 1)) * (svgWidth - 65);
              const mapY = (r: number) => 125 - ((r - minR) / (maxR - minR || 1)) * 100;
              const yZero = mapY(0);

              return (
                <>
                  <Line x1={30} y1={yZero} x2={svgWidth - 20} y2={yZero} stroke="#EF4444" strokeWidth={1} strokeDasharray="3 3" />
                  {resDiag.fittedVsResiduals.map((p, idx) => (
                    <Circle
                      key={`fitres-${idx}`}
                      cx={mapX(p.fitted)}
                      cy={mapY(p.residual)}
                      r={3.5}
                      fill="#6366F1"
                      opacity={0.8}
                    />
                  ))}
                </>
              );
            })()}
          </Svg>
        </View>

        {/* Prueba de Homocedasticidad y Linealidad */}
        {(() => {
          const isHomoscedastic = !resDiag.heteroscedasticity.hasHetero;
          return (
            <>
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Correlación |e| vs Ŷ</Text>
                  <Text style={styles.metricVal}>{fix(resDiag.heteroscedasticity.correlation, 3)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Homocedasticidad</Text>
                  <Text style={[styles.metricVal, { color: isHomoscedastic ? '#15803D' : '#DC2626' }]}>
                    {isHomoscedastic ? 'Varianza Cte.' : 'Heterocedástico'}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Linealidad</Text>
                  <Text style={[styles.metricVal, { color: resDiag.linearity.isLinear ? '#15803D' : '#DC2626' }]}>
                    {resDiag.linearity.isLinear ? 'Adecuada' : 'No lineal'}
                  </Text>
                </View>
              </View>

              <View style={[styles.badgeBanner, { backgroundColor: isHomoscedastic ? '#DCFCE7' : '#FEE2E2' }]}>
                <Ionicons
                  name={isHomoscedastic ? 'checkmark-circle' : 'alert-circle'}
                  size={18}
                  color={isHomoscedastic ? '#16A34A' : '#DC2626'}
                />
                <Text style={[styles.badgeBannerText, { color: isHomoscedastic ? '#166534' : '#991B1B' }]}>
                  {resDiag.heteroscedasticity.description}
                </Text>
              </View>

              <Text style={styles.noteText}>
                • <Text style={styles.bold}>Diagnóstico de Linealidad:</Text> {resDiag.linearity.description}
              </Text>
            </>
          );
        })()}
      </View>

      {/* 7. CASO DE APLICACIÓN PREDICTIVA */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="flash-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>7. Caso de Aplicación Predictiva</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Ingresa valores para las variables predictoras (X) para predecir {yName} con intervalos de confianza y predicción al {(100 * (1 - alpha)).toFixed(0)}%:
        </Text>

        <View style={styles.predInputsGrid}>
          {xNames.map((name, i) => (
            <View key={`pred-input-${i}`} style={styles.predInputField}>
              <Text style={styles.predInputLabel}>{name}:</Text>
              <TextInput
                style={styles.predTextInput}
                placeholder="ej. 10.5"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={predInputs[i] ?? ''}
                onChangeText={(val) => setPredInputs((prev) => ({ ...prev, [i]: val }))}
              />
            </View>
          ))}
        </View>

        {prediction ? (
          <View style={styles.predictionBox}>
            <Text style={styles.predBoxTitle}>Valor Estimado Ŷ:</Text>
            <Text style={styles.predBoxValue}>{fmt(prediction.yHat, 4)}</Text>

            <View style={styles.intervalsContainer}>
              <View style={styles.intervalCard}>
                <Text style={styles.intervalCardLabel}>Intervalo de Confianza para la Respuesta Media ({(100 * (1 - alpha)).toFixed(0)}%):</Text>
                <Text style={styles.intervalCardValue}>
                  [{fmt(prediction.ciMeanLower, 4)} , {fmt(prediction.ciMeanUpper, 4)}]
                </Text>
                <Text style={styles.intervalCardSub}>SE(μ̂) = {fix(prediction.seMean, 4)}</Text>
              </View>

              <View style={styles.intervalCard}>
                <Text style={styles.intervalCardLabel}>Intervalo de Predicción para una Observación Individual ({(100 * (1 - alpha)).toFixed(0)}%):</Text>
                <Text style={styles.intervalCardValue}>
                  [{fmt(prediction.piLower, 4)} , {fmt(prediction.piUpper, 4)}]
                </Text>
                <Text style={styles.intervalCardSub}>SE(Ŷ₀) = {fix(prediction.sePred, 4)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.hint}>
            Completa todos los valores de las {k} regresoras para calcular la predicción e intervalos.
          </Text>
        )}
      </View>

      {/* 8. DETERMINACIÓN DEL MEJOR MODELO (ELIMINACIÓN HACIA ATRÁS / BACKWARD ELIMINATION) */}
      {bestModelResult && (() => {
        const selectedFlowStep =
          bestModelResult.steps.find((s) => s.stepIndex === selectedFlowStepIdx) ??
          bestModelResult.optimalStep;

        return (
          <View style={[styles.card, styles.bestModelCard]}>
            <View style={styles.cardHead}>
              <Ionicons name="trophy" size={22} color="#D97706" />
              <Text style={[styles.cardTitle, { color: '#92400E' }]}>
                8. Ruta de Mejora — Eliminación Hacia Atrás (Backward Elimination)
              </Text>
            </View>

            {/* Criterios Metodológicos Desplegables */}
            <View style={styles.criteriaCard}>
              <Pressable
                onPress={toggleCriteria}
                style={({ pressed }) => [styles.criteriaHead, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel="Alternar visualización de criterios metodológicos"
              >
                <View style={styles.criteriaHeadLeft}>
                  <Ionicons name="school-outline" size={18} color="#D97706" />
                  <Text style={styles.criteriaTitle}>
                    Criterios Metodológicos para la Selección del Modelo Óptimo
                  </Text>
                </View>
                <Ionicons
                  name={showCriteria ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#D97706"
                />
              </Pressable>
              {showCriteria && (
                <View style={styles.criteriaList}>
                  {bestModelResult.criteriaList.map((crit, idx) => (
                    <View key={`crit-${idx}`} style={styles.criteriaItem}>
                      <Text style={styles.criteriaItemTitle}>{crit.title}</Text>
                      <Text style={styles.criteriaItemDesc}>{crit.description}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Text style={styles.sectionSubtitle}>
              Toca cualquier etapa en el flujo inferior para desplegar sus cálculos completos (Ecuación, ANOVA, Métricas de Ajuste y Pruebas t con la decisión de eliminación):
            </Text>

            {/* Stepper / Flujo de Iteraciones Interactivo */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flowContainer}>
              {bestModelResult.steps.map((s, idx) => {
                const isSelected = s.stepIndex === selectedFlowStep.stepIndex;
                return (
                  <View key={`flow-step-${s.stepIndex}-${idx}`} style={styles.flowStepWrapper}>
                    {idx > 0 && (
                      <View style={styles.flowArrowBox}>
                        <Ionicons name="arrow-forward" size={18} color="#D97706" />
                      </View>
                    )}
                    <Pressable
                      onPress={() => setSelectedFlowStepIdx(s.stepIndex)}
                      style={({ pressed }) => [
                        styles.flowBox,
                        s.isOptimal ? styles.flowBoxOptimal : null,
                        isSelected ? styles.flowBoxSelected : null,
                        pressed && { opacity: 0.8 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver cálculos de ${s.title}`}
                    >
                      <View style={styles.flowBoxHeaderRow}>
                        <Text style={[styles.flowBoxTop, s.isOptimal ? { color: '#166534' } : null]}>
                          {s.title}
                        </Text>
                        {isSelected && (
                          <View style={styles.flowActiveDot} />
                        )}
                      </View>
                      <Text style={styles.flowBoxStats}>
                        MSE = {fix(s.mse, 2)} · F₀ = {fix(s.f0, 1)}
                      </Text>
                      <Text style={styles.flowBoxSe}>
                        R² = {(s.r2 * 100).toFixed(4)}% · R²_adj = {(s.r2adj * 100).toFixed(4)}%
                      </Text>
                      {s.worstReg ? (
                        <View style={styles.flowElimBox}>
                          <Text style={styles.flowElimText}>
                            ❌ Elimina {s.worstReg.label}
                          </Text>
                          <Text style={styles.flowElimSub}>
                            |t₀| = {fix(Math.abs(s.worstReg.t0), 2)} (p = {fmtP(s.worstReg.pT)})
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.flowOptBox}>
                          <Text style={styles.flowOptText}>
                            ★ Óptimo ({s.k} vars)
                          </Text>
                          <Text style={styles.flowOptSub}>
                            Todas p &lt; {alpha}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.flowClickHint, isSelected ? styles.flowClickHintActive : null]}>
                        {isSelected ? '✓ Viendo cálculos abajo' : 'Toca para ver cálculos'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>

            {/* PANEL DE CÁLCULOS COMPLETOS DEL PASO SELECCIONADO */}
            <View style={styles.inspectedStepCard}>
              <View style={styles.inspectedStepHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inspectedStepTitle}>
                    📐 Cálculos Detallados: {selectedFlowStep.title}
                  </Text>
                  <Text style={styles.inspectedStepSubtitle}>
                    {selectedFlowStep.isOptimal
                      ? '★ Etapa Final: Modelo Óptimo Alcanzado'
                      : `Etapa secuencial: k = ${selectedFlowStep.k} regresoras activas`}
                  </Text>
                </View>
                <View
                  style={[
                    styles.inspectedBadge,
                    { backgroundColor: selectedFlowStep.isOptimal ? '#DCFCE7' : '#FEF3C7' },
                  ]}
                >
                  <Text
                    style={[
                      styles.inspectedBadgeText,
                      { color: selectedFlowStep.isOptimal ? '#15803D' : '#B45309' },
                    ]}
                  >
                    {selectedFlowStep.isOptimal ? 'Modelo Óptimo' : 'Iteración'}
                  </Text>
                </View>
              </View>

              {/* 1. Ecuación de esta etapa */}
              <View style={styles.stepSectionBox}>
                <Text style={styles.stepSectionLabel}>1. Ecuación Estimada en esta Etapa:</Text>
                <View style={styles.equationBox}>
                  <Text style={styles.equationBoxSubtitle}>Con nombres de variables:</Text>
                  <Text style={styles.equationText}>
                    Ŷ = {fmt(selectedFlowStep.fit.beta[0])}{' '}
                    {selectedFlowStep.fit.beta
                      .slice(1)
                      .map((b, i) => `${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))} · ${selectedFlowStep.labels[i]}`)
                      .join(' ')}
                  </Text>
                </View>
                <View style={[styles.equationBox, styles.equationBoxAlt]}>
                  <Text style={styles.equationBoxSubtitleAlt}>Con subíndices estables xᵢ:</Text>
                  <Text style={styles.equationTextAlt}>
                    Ŷ = {fmt(selectedFlowStep.fit.beta[0])}{' '}
                    {selectedFlowStep.fit.beta
                      .slice(1)
                      .map((b, i) => `${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))} · ${selectedFlowStep.tags[i]}`)
                      .join(' ')}
                  </Text>
                </View>
              </View>

              {/* 2. Tabla ANOVA de esta etapa */}
              <View style={styles.stepSectionBox}>
                <Text style={styles.stepSectionLabel}>
                  2. Tabla ANOVA de la Regresión (gl_Error = {selectedFlowStep.dfe}):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
                  <View style={styles.table}>
                    <View style={styles.tableHeadRow}>
                      <Text style={[styles.th, { width: 90 }]}>Fuente</Text>
                      <Text style={[styles.th, { width: 95 }]}>SC</Text>
                      <Text style={[styles.th, { width: 45 }]}>gl</Text>
                      <Text style={[styles.th, { width: 95 }]}>CM</Text>
                      <Text style={[styles.th, { width: 85 }]}>F₀</Text>
                      <Text style={[styles.th, { width: 85 }]}>Valor p</Text>
                      <Text style={[styles.th, { width: 75 }]}>F crítico</Text>
                    </View>

                    <View style={[styles.tableRow, styles.rowHighlight]}>
                      <Text style={[styles.tdBold, { width: 90 }]}>Regresión</Text>
                      <Text style={[styles.td, { width: 95 }]}>{fix(selectedFlowStep.fit.ssr, 2)}</Text>
                      <Text style={[styles.td, { width: 45 }]}>{selectedFlowStep.k}</Text>
                      <Text style={[styles.td, { width: 95 }]}>
                        {fix(selectedFlowStep.fit.ssr / selectedFlowStep.k, 2)}
                      </Text>
                      <Text style={[styles.tdHighlight, { width: 85 }]}>{fix(selectedFlowStep.f0, 2)}</Text>
                      <Text style={[styles.tdBold, { width: 85, color: '#15803D' }]}>
                        {fmtP(selectedFlowStep.pF)}
                      </Text>
                      <Text style={[styles.td, { width: 75 }]}>{fix(selectedFlowStep.fCrit, 2)}</Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={[styles.td, { width: 90 }]}>Error</Text>
                      <Text style={[styles.td, { width: 95 }]}>{fix(selectedFlowStep.sse, 2)}</Text>
                      <Text style={[styles.td, { width: 45 }]}>{selectedFlowStep.dfe}</Text>
                      <Text style={[styles.td, { width: 95 }]}>{fix(selectedFlowStep.mse, 2)}</Text>
                      <Text style={[styles.td, { width: 85 }]}>—</Text>
                      <Text style={[styles.td, { width: 85 }]}>—</Text>
                      <Text style={[styles.td, { width: 75 }]}>—</Text>
                    </View>

                    <View style={[styles.tableRow, styles.tableFooter]}>
                      <Text style={[styles.tdBold, { width: 90 }]}>Total</Text>
                      <Text style={[styles.tdBold, { width: 95 }]}>{fix(selectedFlowStep.fit.sst, 2)}</Text>
                      <Text style={[styles.tdBold, { width: 45 }]}>{n - 1}</Text>
                      <Text style={[styles.td, { width: 95 }]}>—</Text>
                      <Text style={[styles.td, { width: 85 }]}>—</Text>
                      <Text style={[styles.td, { width: 85 }]}>—</Text>
                      <Text style={[styles.td, { width: 75 }]}>—</Text>
                    </View>
                  </View>
                </ScrollView>
              </View>

              {/* 3. Métricas clave y Significancia de esta etapa */}
              <View style={styles.stepSectionBox}>
                <Text style={styles.stepSectionLabel}>3. Métricas de Bondad de Ajuste y Significancia:</Text>
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>R² Ajustado</Text>
                    <Text style={[styles.metricVal, { color: '#15803D' }]}>
                      {(selectedFlowStep.r2adj * 100).toFixed(4)} %
                    </Text>
                    <Text style={styles.metricSubVal}>R²_adj = {fix(selectedFlowStep.r2adj, 6)}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>R² Convencional</Text>
                    <Text style={styles.metricVal}>
                      {(selectedFlowStep.r2 * 100).toFixed(4)} %
                    </Text>
                    <Text style={styles.metricSubVal}>R² = {fix(selectedFlowStep.r2, 6)}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>MSE (σ²)</Text>
                    <Text style={[styles.metricVal, { color: '#B45309' }]}>{fix(selectedFlowStep.mse, 2)}</Text>
                    <Text style={styles.metricSubVal}>CME residual</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>F₀ Global</Text>
                    <Text style={[styles.metricVal, { color: '#B45309' }]}>
                      {fix(selectedFlowStep.f0, 1)}
                    </Text>
                    <Text style={styles.metricSubVal}>p = {fmtP(selectedFlowStep.pF)}</Text>
                  </View>
                </View>
              </View>

              {/* 4. Pruebas t individuales de esta etapa con acordeones */}
              <View style={styles.stepSectionBox}>
                <Text style={styles.stepSectionLabel}>
                  4. Pruebas t Individuales de esta Etapa (t_crítico = ±{fix(selectedFlowStep.tCrit, 3)}):
                </Text>
                {selectedFlowStep.coeffRows.map((c, cIdx) => {
                  const isOpen = !!openInspectedCoeffs[`${selectedFlowStep.stepIndex}-${c.j}`];
                  return (
                    <View key={`insp-c-${selectedFlowStep.stepIndex}-${c.j}-${cIdx}`} style={styles.accordionContainer}>
                      <Pressable
                        onPress={() => toggleInspectedCoeff(selectedFlowStep.stepIndex, c.j)}
                        style={styles.accordionHead}
                        accessibilityRole="button"
                      >
                        <View style={styles.accordionHeadLeft}>
                          <Text style={styles.paramItemTitle}>
                            {c.j === 0 ? 'Intercepto (β₀)' : `β${c.subscript} (${c.varName} (${c.tag}))`}
                          </Text>
                          <Text style={styles.paramItemValue}>β̂ = {fmt(c.betaHat, 4)}</Text>
                        </View>
                        <View style={styles.accordionHeadRight}>
                          <View style={[styles.pillBadge, { backgroundColor: c.isSig ? '#DCFCE7' : '#FEE2E2' }]}>
                            <Ionicons
                              name={c.isSig ? 'checkmark-circle' : 'close-circle'}
                              size={14}
                              color={c.isSig ? '#15803D' : '#DC2626'}
                            />
                            <Text style={[styles.pillBadgeText, { color: c.isSig ? '#15803D' : '#DC2626' }]}>
                              {c.isSig ? 'Significativo' : 'No significativo'}
                            </Text>
                          </View>
                          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
                        </View>
                      </Pressable>

                      {isOpen && (
                        <View style={styles.accordionBody}>
                          <StudentTCurve
                            df={selectedFlowStep.dfe}
                            alpha={alpha}
                            t0={c.t0}
                            tCrit={selectedFlowStep.tCrit}
                          />
                          <View style={styles.stepItem}>
                            <Text style={styles.stepNum}>① Parámetro:</Text>
                            <Text style={styles.stepContent}>{c.label}</Text>
                          </View>
                          <View style={styles.stepItem}>
                            <Text style={styles.stepNum}>② Hipótesis Nula (H₀):</Text>
                            <Text style={styles.stepContent}>H₀: {c.j === 0 ? 'β₀ = 0' : `β${c.subscript} = 0`}</Text>
                          </View>
                          <View style={styles.stepItem}>
                            <Text style={styles.stepNum}>③ Hipótesis Alternativa (H₁):</Text>
                            <Text style={styles.stepContent}>H₁: {c.j === 0 ? 'β₀ ≠ 0' : `β${c.subscript} ≠ 0`}</Text>
                          </View>
                          <View style={styles.stepItem}>
                            <Text style={styles.stepNum}>④ Nivel de Significancia:</Text>
                            <Text style={styles.stepContent}>α = {alpha} (bilateral)</Text>
                          </View>
                          <View style={styles.stepItem}>
                            <Text style={styles.stepNum}>⑤ Estadístico de prueba:</Text>
                            <Text style={styles.stepFormula}>
                              t₀ = β̂ / EE = {fmt(c.betaHat, 4)} / {fix(c.se, 4)} = {fix(c.t0, 4)}
                            </Text>
                          </View>
                          <View style={styles.stepItem}>
                            <Text style={styles.stepNum}>⑥ Criterio de Rechazo:</Text>
                            <Text style={styles.stepContent}>
                              Rechazar H₀ si |t₀| &gt; {fix(selectedFlowStep.tCrit, 3)} o si p &lt; {alpha}.
                            </Text>
                          </View>
                          <View style={styles.stepItem}>
                            <Text style={styles.stepNum}>⑦ Cálculos:</Text>
                            <View style={styles.calcBox}>
                              <Text style={styles.calcLine}>• β̂ = {fmt(c.betaHat, 4)}</Text>
                              <Text style={styles.calcLine}>• C{c.j}{c.j} = {fix(c.cjj, 6)}</Text>
                              <Text style={styles.calcLine}>• EE = {fix(c.se, 4)}</Text>
                              <Text style={styles.calcHighlight}>• t₀ = {fix(c.t0, 4)}</Text>
                              <Text style={styles.calcHighlight}>• Valor p: p = {fmtP(c.pT)}</Text>
                            </View>
                          </View>
                          <View style={styles.stepItem}>
                            <Text style={styles.stepNum}>⑧ Decisión parcial:</Text>
                            <Text style={styles.stepContent}>
                              {c.isSig
                                ? `Se rechaza H₀. La variable ${c.varName} aporta significativamente al modelo en esta etapa.`
                                : `No se rechaza H₀. La variable ${c.varName} no aporta significativamente en presencia de las demás activas.`}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* 5. Decisión de esta etapa */}
              <View
                style={[
                  styles.verdictBox,
                  {
                    backgroundColor: selectedFlowStep.isOptimal ? '#DCFCE7' : '#FEE2E2',
                    marginTop: 6,
                    borderWidth: 1,
                    borderColor: selectedFlowStep.isOptimal ? '#86EFAC' : '#FCA5A5',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.verdictText,
                    { color: selectedFlowStep.isOptimal ? '#14532D' : '#7F1D1D', fontWeight: 'bold' },
                  ]}
                >
                  {selectedFlowStep.decisionText}
                </Text>
              </View>
            </View>

            {/* TABLA COMPARATIVA DE TODAS LAS ITERACIONES */}
            <Text style={styles.subHeading}>📊 Tabla Comparativa de Todas las Iteraciones:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
              <View style={styles.table}>
                <View style={styles.tableHeadRow}>
                  <Text style={[styles.th, { width: 95 }]}>Etapa</Text>
                  <Text style={[styles.th, { width: 140 }]}>Variables Activas</Text>
                  <Text style={[styles.th, { width: 35 }]}>k</Text>
                  <Text style={[styles.th, { width: 40 }]}>gl_E</Text>
                  <Text style={[styles.th, { width: 90 }]}>SS_E</Text>
                  <Text style={[styles.th, { width: 95 }]}>MSE (σ²)</Text>
                  <Text style={[styles.th, { width: 95 }]}>F₀ Global</Text>
                  <Text style={[styles.th, { width: 110 }]}>R²_adj (%)</Text>
                  <Text style={[styles.th, { width: 220 }]}>Decisión Estadística</Text>
                </View>

                {bestModelResult.comparisonTable.map((row, rIdx) => (
                  <View
                    key={`comp-row-${row.stepIndex}-${rIdx}`}
                    style={[styles.tableRow, row.isOptimal ? styles.rowOptimal : null]}
                  >
                    <Text style={[styles.tdBold, { width: 95, color: row.isOptimal ? '#15803D' : '#1E293B' }]}>
                      {row.title}
                    </Text>
                    <Text style={[styles.td, { width: 140, textAlign: 'left', paddingHorizontal: 4 }]}>
                      {row.varsList}
                    </Text>
                    <Text style={[styles.td, { width: 35 }]}>{row.k}</Text>
                    <Text style={[styles.td, { width: 40 }]}>{row.dfe}</Text>
                    <Text style={[styles.td, { width: 90 }]}>{fix(row.sse, 2)}</Text>
                    <Text style={[styles.tdBold, { width: 95, color: row.isOptimal ? '#15803D' : '#92400E' }]}>
                      {fix(row.mse, 2)}
                    </Text>
                    <Text style={[styles.tdBold, { width: 95, color: '#B45309' }]}>
                      {fix(row.f0, 1)}
                    </Text>
                    <Text style={[styles.tdBold, { width: 110, color: '#15803D' }]}>
                      {(row.r2adj * 100).toFixed(4)} %
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        {
                          width: 220,
                          textAlign: 'left',
                          paddingHorizontal: 4,
                          color: row.isOptimal ? '#15803D' : '#B91C1C',
                          fontWeight: row.isOptimal ? '700' : '500',
                        },
                      ]}
                    >
                      {row.decision}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {onApplyBestModel && (
              <Pressable
                onPress={() => onApplyBestModel(bestModelResult.bestModel.labels)}
                style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="Ajustar predictores al modelo óptimo"
              >
                <Ionicons name="flash" size={16} color="#FFFFFF" />
                <Text style={styles.applyBtnText}>
                  Ajustar a este modelo óptimo ({bestModelResult.bestModel.labels.join(', ')})
                </Text>
              </Pressable>
            )}
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  equationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  equationBoxSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  equationText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
    lineHeight: 22,
  },
  equationBoxAlt: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  equationBoxSubtitleAlt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
  },
  equationTextAlt: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
    lineHeight: 21,
  },
  equationBoxTheoretical: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 4,
  },
  equationBoxSubtitleTheoretical: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  equationTextTheoretical: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#334155',
    fontVariant: ['tabular-nums'],
    lineHeight: 18,
  },
  equationNote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.text,
  },
  table: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeadRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  tableFooter: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0,
  },
  rowHighlight: {
    backgroundColor: '#F0F9FF',
  },
  th: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  td: {
    fontSize: 11.5,
    color: '#1E293B',
    textAlign: 'center',
    paddingHorizontal: 4,
    fontVariant: ['tabular-nums'],
  },
  tdBold: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    paddingHorizontal: 4,
    fontVariant: ['tabular-nums'],
  },
  tdHighlight: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    paddingHorizontal: 4,
    fontVariant: ['tabular-nums'],
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  badgeBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  r2Row: {
    flexDirection: 'row',
    gap: 10,
  },
  r2Box: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    gap: 3,
  },
  r2BoxActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  r2Label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  r2Value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  r2Sub: {
    fontSize: 10,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  noteText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  accordionContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginVertical: 4,
  },
  accordionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  accordionHeadLeft: {
    flex: 1,
    gap: 2,
  },
  accordionHeadRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paramItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  paramItemValue: {
    fontSize: 11.5,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  accordionBody: {
    padding: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  graphContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  graphTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    textAlign: 'center',
  },
  stepItem: {
    gap: 3,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  stepContent: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  stepFormula: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  calcBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 4,
  },
  calcLine: {
    fontSize: 11.5,
    color: '#334155',
    fontVariant: ['tabular-nums'],
  },
  calcHighlight: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  verdictBox: {
    borderRadius: 8,
    padding: 10,
  },
  verdictText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  predInputsGrid: {
    gap: 8,
  },
  predInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  predInputLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  predTextInput: {
    width: 110,
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  predictionBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  predBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  predBoxValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  intervalsContainer: {
    gap: 8,
  },
  intervalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  intervalCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  intervalCardValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  intervalCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bestModelCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  criteriaCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    gap: 8,
    marginVertical: 4,
  },
  criteriaHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  criteriaHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  criteriaTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400E',
    flexShrink: 1,
  },
  criteriaList: {
    gap: 6,
  },
  criteriaItem: {
    gap: 2,
  },
  criteriaItemTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#78350F',
  },
  criteriaItemDesc: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
  bestModelHeader: {
    gap: 4,
  },
  bestModelSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  bestModelFormula: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#78350F',
    fontFamily: 'Inter_700Bold',
  },
  justificationBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  justificationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
  },
  justificationLine: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  flowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  flowStepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flowArrowBox: {
    paddingHorizontal: 2,
  },
  flowBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 10,
    minWidth: 160,
    gap: 4,
  },
  flowBoxSelected: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
  },
  flowBoxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flowActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  flowBoxOptimal: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  flowBoxTop: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  flowBoxStats: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  flowBoxSe: {
    fontSize: 10,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  flowClickHint: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  flowClickHintActive: {
    color: '#B45309',
    fontWeight: 'bold',
  },
  flowElimBox: {
    backgroundColor: '#FEE2E2',
    padding: 4,
    borderRadius: 6,
  },
  flowElimText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B91C1C',
  },
  flowElimSub: {
    fontSize: 10,
    color: '#991B1B',
    fontVariant: ['tabular-nums'],
  },
  flowOptBox: {
    backgroundColor: '#DCFCE7',
    padding: 4,
    borderRadius: 6,
  },
  flowOptText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803D',
  },
  flowOptSub: {
    fontSize: 10,
    color: '#166534',
  },
  inspectedStepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    padding: 14,
    gap: 12,
    marginTop: 10,
  },
  inspectedStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  inspectedStepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  inspectedStepSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
  },
  inspectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  inspectedBadgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  stepSectionBox: {
    gap: 6,
  },
  stepSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  metricSubVal: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 6,
  },
  rowOptimal: {
    backgroundColor: '#F0FDF4',
  },
});
