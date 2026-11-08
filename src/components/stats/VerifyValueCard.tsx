import React, { useState, useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import SegmentedControl from '../ui/SegmentedControl';
import { colors } from '../../theme/colors';
import { type DecimalSeparator, parseData } from '../../stats/core/parse';
import { ols } from '../../stats/regression/linear';
import { studentT } from '../../stats/core/distributions';
import { fix, fmt, fmtP } from '../../stats/core/rounding';
import { mean, sd } from '../../stats/core/descriptive';
import type { Group } from '../../stats/tests/anova/anovaCore';

interface VerifyValueCardProps {
  testId: string;
  groups: Group[];
  decimal: DecimalSeparator;
  alpha?: number;
}

export default function VerifyValueCard({ testId, groups, decimal, alpha = 0.05 }: VerifyValueCardProps) {
  const isReg = testId === 'linearRegression';
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Coeficiente / Media, 1: Predicción (en regresión)

  // Para prueba de hipótesis sobre regresora / media
  const [selectedIdx, setSelectedIdx] = useState<number>(1); // por defecto primera regresora o primer grupo
  const [nullValueText, setNullValueText] = useState<string>('0');

  // Para predicción en regresión (vector X0)
  const [predInputs, setPredInputs] = useState<Record<number, string>>({});

  // Verificamos si hay suficientes datos
  if (!groups || groups.length === 0) return null;
  if (isReg && groups.length < 2) return null;

  // Cálculos si es regresión
  const regFit = useMemo(() => {
    if (!isReg) return null;
    try {
      const [yGroup, ...xGroups] = groups;
      const y = yGroup.values;
      const xs = xGroups.map((g) => g.values);
      const n = y.length;
      if (xs.some((x) => x.length !== n)) return null;
      if (n <= xs.length + 1) return null;
      return {
        fit: ols(y, xs),
        yLabel: yGroup.label,
        xLabels: xGroups.map((g) => g.label),
        df: n - (xs.length + 1),
      };
    } catch {
      return null;
    }
  }, [isReg, groups]);

  // Nombres de opciones para selector
  const varOptions = useMemo(() => {
    if (isReg) {
      if (!regFit) return [];
      return ['Intercepto (β₀)', ...regFit.xLabels.map((l, i) => `${l} (β${i + 1})`)];
    }
    return groups.map((g) => g.label);
  }, [isReg, regFit, groups]);

  // Ejecución de prueba de hipótesis sobre un valor X / Beta
  const hypothesisResult = useMemo(() => {
    const rawVal = parseData(nullValueText, decimal);
    const targetVal = rawVal.values.length > 0 ? rawVal.values[0] : 0;

    if (isReg) {
      if (!regFit) return null;
      const j = Math.min(selectedIdx, regFit.fit.beta.length - 1);
      const bHat = regFit.fit.beta[j];
      const se = Math.sqrt(regFit.fit.mse * regFit.fit.C[j][j]);
      if (se === 0) return null;
      const t = (bHat - targetVal) / se;
      const df = regFit.df;
      const p = 2 * studentT.sf(Math.abs(t), df);
      const tCrit = studentT.quantile(1 - alpha / 2, df);
      const ciLower = bHat - tCrit * se;
      const ciUpper = bHat + tCrit * se;
      const isSignificant = p < alpha;

      return {
        targetVal,
        estimatedVal: bHat,
        se,
        t,
        df,
        p,
        tCrit,
        ciLower,
        ciUpper,
        isSignificant,
        label: varOptions[j] ?? `β${j}`,
      };
    } else {
      // Prueba t de 1 muestra sobre el grupo seleccionado
      const g = groups[Math.min(selectedIdx, groups.length - 1)];
      if (!g || g.values.length < 2) return null;
      const xBar = mean(g.values);
      const s = sd(g.values);
      const n = g.values.length;
      const se = s / Math.sqrt(n);
      if (se === 0) return null;
      const t = (xBar - targetVal) / se;
      const df = n - 1;
      const p = 2 * studentT.sf(Math.abs(t), df);
      const tCrit = studentT.quantile(1 - alpha / 2, df);
      const ciLower = xBar - tCrit * se;
      const ciUpper = xBar + tCrit * se;
      const isSignificant = p < alpha;

      return {
        targetVal,
        estimatedVal: xBar,
        se,
        t,
        df,
        p,
        tCrit,
        ciLower,
        ciUpper,
        isSignificant,
        label: g.label,
      };
    }
  }, [isReg, regFit, groups, selectedIdx, nullValueText, decimal, alpha, varOptions]);

  // Ejecución de predicción si es regresión
  const predictionResult = useMemo(() => {
    if (!isReg || !regFit) return null;
    const xVals: number[] = [];
    for (let i = 0; i < regFit.xLabels.length; i++) {
      const parsed = parseData(predInputs[i] ?? '', decimal);
      if (parsed.values.length === 0) return null;
      xVals.push(parsed.values[0]);
    }

    const x0 = [1, ...xVals];
    const { fit, df } = regFit;
    const yHat = x0.reduce((s, x, j) => s + x * fit.beta[j], 0);

    // x0ᵀ C x0
    const x0tC = x0.map((_, col) => x0.reduce((s, x, row) => s + x * fit.C[row][col], 0));
    const vMean = x0tC.reduce((s, v, j) => s + v * x0[j], 0);

    const seMean = Math.sqrt(fit.mse * vMean);
    const sePred = Math.sqrt(fit.mse * (1 + vMean));
    const tCrit = studentT.quantile(1 - alpha / 2, df);

    return {
      yHat,
      seMean,
      sePred,
      df,
      tCrit,
      ciMeanLower: yHat - tCrit * seMean,
      ciMeanUpper: yHat + tCrit * seMean,
      piLower: yHat - tCrit * sePred,
      piUpper: yHat + tCrit * sePred,
      t: seMean > 0 ? yHat / seMean : 0,
      p: seMean > 0 ? 2 * studentT.sf(Math.abs(yHat / seMean), df) : 1,
    };
  }, [isReg, regFit, predInputs, decimal, alpha]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Verificar valor de referencia X</Text>
          <Text style={styles.subtitle}>
            Comprueba mediante prueba de hipótesis si un valor específico es estadísticamente significativo (α = {alpha}).
          </Text>
        </View>
      </View>

      {isReg && (
        <SegmentedControl
          compact
          options={['Probar significancia de β', 'Predecir Y con nuevo X']}
          selectedIndex={activeTab}
          onChange={setActiveTab}
        />
      )}

      {/* TAB 0: PRUEBA DE HIPÓTESIS */}
      {activeTab === 0 && (
        <View style={styles.body}>
          {varOptions.length > 1 && (
            <View style={styles.field}>
              <Text style={styles.label}>Selecciona la variable a contrastar:</Text>
              <SegmentedControl
                compact
                options={varOptions}
                selectedIndex={Math.min(selectedIdx, varOptions.length - 1)}
                onChange={setSelectedIdx}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>
              {isReg ? 'Valor nulo a contrastar (H₀: β = X₀)' : 'Valor de referencia a contrastar (H₀: μ = X₀)'}:
            </Text>
            <TextInput
              style={styles.input}
              value={nullValueText}
              onChangeText={setNullValueText}
              placeholder="0 (o valor personalizado, ej. 2.5)"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>
              Por defecto 0 comprueba si el efecto de la variable es significativamente diferente de cero.
            </Text>
          </View>

          {hypothesisResult && (
            <View style={styles.resultBox}>
              <View style={styles.numbersGrid}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Estimado</Text>
                  <Text style={styles.statVal}>{fmt(hypothesisResult.estimatedVal)}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Error Est. (EE)</Text>
                  <Text style={styles.statVal}>{fix(hypothesisResult.se, 4)}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Estadístico t₀</Text>
                  <Text style={styles.statVal}>{fix(hypothesisResult.t, 4)}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Valor p</Text>
                  <Text style={[styles.statVal, { color: hypothesisResult.isSignificant ? colors.danger : colors.success }]}>
                    {fmtP(hypothesisResult.p)}
                  </Text>
                </View>
              </View>

              <View style={styles.ciBox}>
                <Text style={styles.ciText}>
                  Intervalo de Confianza al 95%: [{fmt(hypothesisResult.ciLower, 4)} , {fmt(hypothesisResult.ciUpper, 4)}]
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: hypothesisResult.isSignificant ? '#FEE2E2' : '#DCFCE7' },
                ]}
              >
                <Ionicons
                  name={hypothesisResult.isSignificant ? 'alert-circle' : 'checkmark-circle'}
                  size={20}
                  color={hypothesisResult.isSignificant ? '#DC2626' : '#16A34A'}
                />
                <View style={styles.flex}>
                  <Text
                    style={[
                      styles.badgeTitle,
                      { color: hypothesisResult.isSignificant ? '#991B1B' : '#166534' },
                    ]}
                  >
                    {hypothesisResult.isSignificant
                      ? 'ES SIGNIFICATIVO (Se rechaza H₀)'
                      : 'NO ES SIGNIFICATIVO (No se rechaza H₀)'}
                  </Text>
                  <Text
                    style={[
                      styles.badgeDesc,
                      { color: hypothesisResult.isSignificant ? '#B91C1C' : '#15803D' },
                    ]}
                  >
                    {hypothesisResult.isSignificant
                      ? `Con p = ${fmtP(hypothesisResult.p)} < ${alpha}, el parámetro difiere significativamente del valor contrastado (${fmt(hypothesisResult.targetVal)}). Cae fuera del intervalo de confianza.`
                      : `Con p = ${fmtP(hypothesisResult.p)} ≥ ${alpha}, no hay evidencia estadística suficiente de que difiera del valor ${fmt(hypothesisResult.targetVal)}. Es compatible con el intervalo.`}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* TAB 1: PREDICCIÓN EN REGRESIÓN */}
      {isReg && activeTab === 1 && regFit && (
        <View style={styles.body}>
          <Text style={styles.label}>Ingresa los valores de las regresoras para predecir Y ({regFit.yLabel}):</Text>
          {regFit.xLabels.map((lbl, i) => (
            <View key={i} style={styles.predRow}>
              <Text style={styles.predLabel}>{lbl}:</Text>
              <TextInput
                style={[styles.input, styles.flex]}
                value={predInputs[i] ?? ''}
                onChangeText={(t) => setPredInputs((s) => ({ ...s, [i]: t }))}
                placeholder={`Valor de ${lbl}`}
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
              />
            </View>
          ))}

          {predictionResult ? (
            <View style={styles.resultBox}>
              <View style={styles.predHighlight}>
                <Text style={styles.predResultLabel}>Respuesta estimada Ŷ₀:</Text>
                <Text style={styles.predResultVal}>{fmt(predictionResult.yHat, 4)}</Text>
              </View>

              <View style={styles.numbersGrid}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>EE (Media)</Text>
                  <Text style={styles.statVal}>{fix(predictionResult.seMean, 4)}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>EE (Indiv.)</Text>
                  <Text style={styles.statVal}>{fix(predictionResult.sePred, 4)}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Valor p (Ŷ ≠ 0)</Text>
                  <Text style={styles.statVal}>{fmtP(predictionResult.p)}</Text>
                </View>
              </View>

              <View style={styles.ciBox}>
                <Text style={styles.ciText}>
                  IC 95% para respuesta media: [{fmt(predictionResult.ciMeanLower, 4)} , {fmt(predictionResult.ciMeanUpper, 4)}]
                </Text>
                <Text style={[styles.ciText, { marginTop: 4 }]}>
                  Intervalo de predicción 95% (nueva obs.): [{fmt(predictionResult.piLower, 4)} , {fmt(predictionResult.piUpper, 4)}]
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.hint}>Completa los valores numéricos de todas las regresoras para calcular la predicción.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: 16,
    gap: 14,
    marginVertical: 12,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  flex: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  body: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  predRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  predLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  resultBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 10,
  },
  numbersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  ciBox: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
  },
  ciText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  badgeDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  predHighlight: {
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  predResultLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  predResultVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2,
  },
});
