import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import { colors } from '../../theme/colors';
import type { TestResult } from '../../stats/types';
import { fix, fmt, fmtP } from '../../stats/core/rounding';

const REJECT_BG = '#FDECEC';
const KEEP_BG = '#E3F4EA';

export function DecisionBadge({ decision }: { decision: TestResult['decision'] }) {
  const reject = decision === 'reject';
  return (
    <View
      style={[styles.badge, { backgroundColor: reject ? REJECT_BG : KEEP_BG }]}
      accessibilityLabel={reject ? 'Decisión: se rechaza H cero' : 'Decisión: no se rechaza H cero'}
    >
      <Ionicons name={reject ? 'close-circle' : 'checkmark-circle'} size={18} color={reject ? colors.danger : colors.success} />
      <Text style={[styles.badgeText, { color: reject ? colors.danger : colors.success }]}>
        {reject ? 'Se rechaza H₀' : 'No se rechaza H₀'}
      </Text>
    </View>
  );
}

/** Table values below 1 keep 3 decimals (0.190), larger ones drop trailing zeros (3.68). */
export function critText(v: number): string {
  if (!isFinite(v)) return v > 0 ? '∞' : '−∞';
  return Math.abs(v) < 1 && fmt(v, 4).length <= 5 ? fix(v, 3) : fmt(v, 4);
}

function dfText(df: TestResult['df']) {
  if (df === undefined) return null;
  return Array.isArray(df) ? `gl = (${df[0]}, ${df[1]})` : `gl = ${df}`;
}

export default function ResultCard({ result, title }: { result: TestResult; title?: string }) {
  const crit = result.criticalValue;
  const lower = result.criticalLower;
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title ?? result.testName}</Text>
        <Text style={styles.meta}>α = {fmt(result.alpha)} · {result.mode}</Text>
      </View>

      <View style={styles.hyp}>
        <Text style={styles.hypLine}><Text style={styles.hypKey}>H₀: </Text>{result.hypotheses.h0}</Text>
        <Text style={styles.hypLine}><Text style={styles.hypKey}>H₁: </Text>{result.hypotheses.h1}</Text>
      </View>

      <View style={styles.numbers}>
        <View style={styles.numberBox}>
          <Text style={styles.numberLabel}>Estadístico</Text>
          <Text style={styles.numberValue}>{result.statistic.symbol} = {fmt(result.statistic.value)}</Text>
          {dfText(result.df) ? <Text style={styles.numberNote}>{dfText(result.df)}</Text> : null}
        </View>
        {crit && (
          <View style={styles.numberBox}>
            <Text style={styles.numberLabel}>{lower ? 'Región de aceptación' : 'Valor crítico'}</Text>
            <Text style={styles.numberValue}>
              {lower ? `${critText(lower.value)} … ${critText(crit.value)}` : critText(crit.value)}
            </Text>
            {crit.interpolated ? <Text style={styles.numberNote}>interpolado</Text> : null}
          </View>
        )}
        {result.pValue !== undefined && (
          <View style={styles.numberBox}>
            <Text style={styles.numberLabel}>Valor p{result.pValueApprox ? ' (aprox.)' : ''}</Text>
            <Text style={styles.numberValue}>{fmtP(result.pValue)}</Text>
          </View>
        )}
      </View>

      <DecisionBadge decision={result.decision} />
      <Text style={styles.conclusion}>{result.conclusion}</Text>

      {result.warnings.map((w, i) => (
        <View key={i} style={styles.warning}>
          <Ionicons name="warning-outline" size={16} color="#92400E" />
          <Text style={styles.warningText}>{w}</Text>
        </View>
      ))}
      {crit ? <Text style={styles.source}>Fuente del valor crítico: {crit.source}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  titleRow: { gap: 2 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary },
  hyp: { gap: 4, padding: 12, borderRadius: 10, backgroundColor: colors.surface },
  hypLine: { fontSize: 14, lineHeight: 20, color: colors.text },
  hypKey: { fontWeight: 'bold', color: colors.primary },
  numbers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  numberBox: {
    flexGrow: 1,
    minWidth: 96,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  numberLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  numberValue: { fontSize: 17, fontWeight: 'bold', color: colors.text, fontVariant: ['tabular-nums'], marginTop: 2 },
  numberNote: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: { fontSize: 15, fontWeight: 'bold' },
  conclusion: { fontSize: 15, lineHeight: 22, color: colors.text },
  warning: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
  },
  warningText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#78350F' },
  source: { fontSize: 12, color: colors.textSecondary },
});
