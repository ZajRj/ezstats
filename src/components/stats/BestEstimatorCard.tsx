import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import SegmentedControl from '../ui/SegmentedControl';
import { colors } from '../../theme/colors';
import { mean, median, sd, variance, skewness, kurtosis, sorted } from '../../stats/core/descriptive';
import { fmt, fix } from '../../stats/core/rounding';
import type { Group } from '../../stats/tests/anova/anovaCore';

interface BestEstimatorCardProps {
  testId: string;
  groups: Group[];
}

export default function BestEstimatorCard({ testId, groups }: BestEstimatorCardProps) {
  const isReg = testId === 'linearRegression';
  const [selectedVarIdx, setSelectedVarIdx] = useState<number>(0);
  const [showTheory, setShowTheory] = useState<boolean>(false);

  if (!groups || groups.length === 0) return null;

  const currentGroup = groups[Math.min(selectedVarIdx, groups.length - 1)];
  const vals = currentGroup?.values ?? [];

  // Diagnóstico de la variable seleccionada
  const diag = useMemo(() => {
    if (vals.length < 3) return null;
    const n = vals.length;
    const s = sorted(vals);
    const m = mean(vals);
    const med = median(vals);
    const s2 = variance(vals);
    const sDev = sd(vals);
    const g1 = skewness(vals);
    const b2 = kurtosis(vals);

    // Cuartiles y regla de Tukey para outliers
    const q1Idx = Math.floor(n * 0.25);
    const q3Idx = Math.floor(n * 0.75);
    const q1 = s[q1Idx];
    const q3 = s[q3Idx];
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    const outliers = s.filter((x) => x < lowerFence || x > upperFence);

    // Media recortada al 10%
    const trimK = Math.max(1, Math.floor(n * 0.1));
    const trimmed = s.slice(trimK, n - trimK);
    const trimmedM = trimmed.length > 0 ? mean(trimmed) : m;

    // Decisión del mejor estimador de tendencia central
    let bestLoc: 'mean' | 'median' | 'trimmed';
    let locReason: string;
    let locProps: { unbiased: string; efficiency: string; robustness: string; breakdown: string };

    if (outliers.length > 0) {
      bestLoc = 'median';
      locReason = `Se detectaron ${outliers.length} valor(es) atípico(s) [${outliers.map((o) => fmt(o)).join(', ')}] fuera de los límites de Tukey [${fmt(lowerFence)} , ${fmt(upperFence)}]. La media muestral tiene punto de ruptura del 0% y queda gravemente distorsionada. La mediana es el estimador óptimo por su máxima resistencia a datos extremos.`;
      locProps = {
        unbiased: 'Insesgado bajo distribuciones simétricas.',
        efficiency: 'Alta robustez ante contaminación de datos.',
        robustness: 'Máxima resistencia (insensible a valores extremos).',
        breakdown: '50% (soporta hasta la mitad de datos contaminados).',
      };
    } else if (Math.abs(g1) > 0.8) {
      bestLoc = 'median';
      locReason = `La muestra presenta una asimetría marcada (g₁ = ${fix(g1, 2)}). En distribuciones sesgadas, la media es arrastrada por la cola larga y no representa el centro de masa de la población. La mediana representa con fidelidad el percentil 50 real.`;
      locProps = {
        unbiased: 'Representa el punto donde el 50% de las observaciones es menor.',
        efficiency: 'Superior a la media en presencia de asimetría o colas pesadas.',
        robustness: 'Excelente contra asimetrías extremas.',
        breakdown: '50%.',
      };
    } else {
      bestLoc = 'mean';
      locReason = `La distribución es simétrica (g₁ = ${fix(g1, 2)} ≈ 0) y no presenta valores atípicos. Por el Teorema de Gauss-Markov y Cramer-Rao, la Media Muestral (x̄) es el Estimador Insesgado de Mínima Varianza (EMVU / UMVUE) y de Máxima Verosimilitud (MLE). Posee 100% de eficiencia matemática.`;
      locProps = {
        unbiased: 'E[X̄] = μ (exactamente insesgado).',
        efficiency: '100% (alcanza la cota de varianza mínima de Fréchet-Cramér-Rao).',
        robustness: 'Baja frente a valores extremos (punto de ruptura 0%).',
        breakdown: '0% (un solo outlier puede desplazarla indefinidamente).',
      };
    }

    // Decisión del mejor estimador de dispersión
    let bestDisp: 'variance' | 'iqr';
    let dispReason: string;
    if (outliers.length > 0) {
      bestDisp = 'iqr';
      dispReason = `Al haber valores atípicos, la varianza muestral s² se infla cuadráticamente por las desviaciones extremas. El Rango Intercuartílico (IQR = ${fmt(iqr)}) es el mejor estimador robusto de dispersión.`;
    } else {
      bestDisp = 'variance';
      dispReason = `La varianza muestral con divisor (n − 1) [s² = ${fmt(s2)}] es el mejor estimador insesgado de la dispersión poblacional (corrección de Bessel: E[S²] = σ²).`;
    }

    return {
      n,
      mean: m,
      median: med,
      trimmedMean: trimmedM,
      s2,
      sDev,
      iqr,
      g1,
      b2,
      outliers,
      bestLoc,
      locReason,
      locProps,
      bestDisp,
      dispReason,
    };
  }, [vals]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Diagnóstico del Mejor Estimador</Text>
          <Text style={styles.subtitle}>
            Análisis de propiedades estadísticas (Insesgadez, Eficiencia, Robustez y Gauss-Markov).
          </Text>
        </View>
      </View>

      {/* TEOREMA DE GAUSS-MARKOV SI ES REGRESIÓN */}
      {isReg && (
        <View style={styles.modelBox}>
          <View style={styles.modelHead}>
            <Ionicons name="school-outline" size={16} color={colors.primary} />
            <Text style={styles.modelHeadTitle}>Estimadores del Modelo (MCO / OLS)</Text>
          </View>
          <Text style={styles.modelText}>
            Bajo el <Text style={styles.bold}>Teorema de Gauss-Markov</Text>, los coeficientes estimados por Mínimos Cuadrados Ordinarios{' '}
            <Text style={styles.mathSpan}>β̂ = (XᵀX)⁻¹Xᵀy</Text> constituyen el <Text style={styles.bold}>MELI (Mejor Estimador Lineal Insesgado / BLUE)</Text>:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Insesgadez:</Text> E[β̂] = β (su valor esperado coincide exactamente con los parámetros poblacionales verdaderos).
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Mínima varianza:</Text> Var(β̂) ≤ Var(β̃) para cualquier otro estimador lineal e insesgado de los coeficientes.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Eficiencia máxima:</Text> Si los residuos son normales, β̂ es además el estimador de Máxima Verosimilitud (MLE).
            </Text>
          </View>
        </View>
      )}

      {/* SELECTOR DE VARIABLES */}
      {groups.length > 1 && (
        <View style={styles.field}>
          <Text style={styles.label}>Analizar muestra de la variable:</Text>
          <SegmentedControl
            compact
            options={groups.map((g) => g.label)}
            selectedIndex={Math.min(selectedVarIdx, groups.length - 1)}
            onChange={setSelectedVarIdx}
          />
        </View>
      )}

      {/* RESULTADOS DEL DIAGNÓSTICO */}
      {diag ? (
        <View style={styles.diagContainer}>
          {/* Tarjeta de Tendencia Central */}
          <View style={styles.winnerCard}>
            <View style={styles.winnerHeader}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.winnerTitle}>
                Mejor Estimador de Tendencia Central:{' '}
                {diag.bestLoc === 'mean' ? 'Media Muestral (x̄)' : 'Mediana Muestral (x̃)'}
              </Text>
            </View>

            <View style={styles.compareRow}>
              <View style={[styles.valPill, diag.bestLoc === 'mean' && styles.valPillActive]}>
                <Text style={styles.pillLabel}>Media (x̄)</Text>
                <Text style={styles.pillValue}>{fmt(diag.mean, 4)}</Text>
              </View>
              <View style={[styles.valPill, diag.bestLoc === 'median' && styles.valPillActive]}>
                <Text style={styles.pillLabel}>Mediana (x̃)</Text>
                <Text style={styles.pillValue}>{fmt(diag.median, 4)}</Text>
              </View>
              <View style={styles.valPill}>
                <Text style={styles.pillLabel}>Recortada 10%</Text>
                <Text style={styles.pillValue}>{fmt(diag.trimmedMean, 4)}</Text>
              </View>
            </View>

            <Text style={styles.justificationText}>{diag.locReason}</Text>
          </View>

          {/* Tarjeta de Dispersión */}
          <View style={styles.winnerCard}>
            <View style={styles.winnerHeader}>
              <Ionicons name="checkmark-circle" size={18} color="#0284C7" />
              <Text style={styles.winnerTitle}>
                Mejor Estimador de Dispersión:{' '}
                {diag.bestDisp === 'variance' ? 'Varianza Insesgada (s²)' : 'Rango Intercuartílico (IQR)'}
              </Text>
            </View>
            <Text style={styles.justificationText}>{diag.dispReason}</Text>
          </View>

          {/* Botón desplegable de justificación teórica matemática */}
          <Pressable
            onPress={() => setShowTheory(!showTheory)}
            style={({ pressed }) => [styles.theoryToggle, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name={showTheory ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
            <Text style={styles.theoryToggleText}>
              {showTheory ? 'Ocultar fundamentos matemáticos' : 'Ver justificación de propiedades teóricas'}
            </Text>
          </Pressable>

          {showTheory && (
            <View style={styles.theoryBox}>
              <Text style={styles.theoryTitle}>Propiedades del Estimador Recomendado:</Text>
              <View style={styles.propRow}>
                <Text style={styles.propKey}>Insesgadez:</Text>
                <Text style={styles.propVal}>{diag.locProps.unbiased}</Text>
              </View>
              <View style={styles.propRow}>
                <Text style={styles.propKey}>Eficiencia:</Text>
                <Text style={styles.propVal}>{diag.locProps.efficiency}</Text>
              </View>
              <View style={styles.propRow}>
                <Text style={styles.propKey}>Robustez:</Text>
                <Text style={styles.propVal}>{diag.locProps.robustness}</Text>
              </View>
              <View style={styles.propRow}>
                <Text style={styles.propKey}>Punto de ruptura:</Text>
                <Text style={styles.propVal}>{diag.locProps.breakdown}</Text>
              </View>
              <View style={styles.propRow}>
                <Text style={styles.propKey}>Asimetría (g₁):</Text>
                <Text style={styles.propVal}>{fix(diag.g1, 4)}</Text>
              </View>
              <View style={styles.propRow}>
                <Text style={styles.propKey}>Curtosis (b₂):</Text>
                <Text style={styles.propVal}>{fix(diag.b2, 4)} (Normal = 3.0)</Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.hint}>Ingresa al menos 3 datos numéricos en la variable para diagnosticar el estimador.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    padding: 16,
    gap: 14,
    marginVertical: 12,
    shadowColor: '#4338CA',
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
    backgroundColor: '#EEF2FF',
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
  modelBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  modelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modelHeadTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5B21B6',
  },
  modelText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  mathSpan: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
  bulletList: {
    gap: 4,
    marginTop: 4,
  },
  bulletItem: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  diagContainer: {
    gap: 12,
  },
  winnerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  winnerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  compareRow: {
    flexDirection: 'row',
    gap: 8,
  },
  valPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  valPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  pillLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pillValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  justificationText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  theoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  theoryToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  theoryBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  theoryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  propKey: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    width: 110,
  },
  propVal: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    textAlign: 'right',
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
