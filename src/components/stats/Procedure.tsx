import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Share, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import { colors } from '../../theme/colors';
import type { Step, TestResult } from '../../stats/types';
import { resultToText } from '../../stats/export';

const ROW_H = 38;
const HEAD_H = 48;

function columnWidth(step: Extract<Step, { kind: 'table' }>, c: number): number {
  let len = step.columns[c].length * 0.75;
  for (const row of step.rows) len = Math.max(len, String(row[c] ?? '').length);
  return Math.min(240, Math.max(58, len * 8.6 + 22));
}

/** Table with a sticky first column; the rest scrolls horizontally. */
export function StepTable({ step }: { step: Extract<Step, { kind: 'table' }> }) {
  const widths = step.columns.map((_, c) => columnWidth(step, c));
  const hl = new Set((step.highlight ?? []).map((h) => `${h.row}:${h.col}`));
  const cell = (r: number, c: number, value: string | number) => {
    const on = hl.has(`${r}:${c}`);
    return (
      <View key={c} style={[styles.cell, { width: widths[c] }, r % 2 === 1 && styles.cellAlt, on && styles.cellOn]}>
        <Text style={[styles.cellText, on && styles.cellTextOn]} numberOfLines={1}>
          {value === '' ? ' ' : String(value)}
        </Text>
      </View>
    );
  };
  const head = (c: number) => (
    <View key={c} style={[styles.head, { width: widths[c] }]}>
      <Text style={styles.headText} numberOfLines={2}>{step.columns[c]}</Text>
    </View>
  );

  return (
    <View style={styles.table}>
      <View style={styles.sticky}>
        {head(0)}
        {step.rows.map((row, r) => cell(r, 0, row[0]))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
        <View>
          <View style={styles.row}>{step.columns.slice(1).map((_, i) => head(i + 1))}</View>
          {step.rows.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.slice(1).map((v, i) => cell(r, i + 1, v))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function StepView({ step, index }: { step: Step; index: number }) {
  return (
    <View style={styles.step}>
      {step.title ? (
        <Text style={styles.stepTitle}>
          <Text style={styles.stepNum}>{index + 1}. </Text>
          {step.title}
        </Text>
      ) : null}
      {step.kind === 'text' && <Text style={styles.body}>{step.body}</Text>}
      {step.kind === 'formula' && (
        <View style={styles.formula}>
          <Text style={styles.expression}>{step.expression}</Text>
          {step.substituted ? <Text style={styles.substituted}>{step.substituted}</Text> : null}
          {step.result ? <Text style={styles.result}>{step.result}</Text> : null}
        </View>
      )}
      {step.kind === 'table' && <StepTable step={step} />}
    </View>
  );
}

export default function Procedure({ result, initiallyOpen = false }: { result: TestResult; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };
  const copy = () => {
    Share.share({ message: resultToText(result), title: result.testName }).catch(() => undefined);
  };

  return (
    <View style={styles.card}>
      <View style={styles.bar}>
        <Pressable
          onPress={toggle}
          style={({ pressed }) => [styles.toggle, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
        >
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
          <Text style={styles.toggleText}>{open ? 'Ocultar procedimiento' : 'Ver procedimiento'}</Text>
        </Pressable>
        <Pressable
          onPress={copy}
          hitSlop={8}
          style={({ pressed }) => [styles.copy, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Copiar el procedimiento como texto"
        >
          <Ionicons name="copy-outline" size={16} color={colors.primary} />
          <Text style={styles.copyText}>Copiar</Text>
        </Pressable>
      </View>
      {open && (
        <View style={styles.steps}>
          {result.steps.map((s, i) => <StepView key={i} step={s} index={i} />)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, flex: 1 },
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },
  copyText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  steps: { paddingHorizontal: 14, paddingBottom: 16, gap: 18, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  step: { gap: 8 },
  stepTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  stepNum: { color: colors.primary },
  body: { fontSize: 14, lineHeight: 21, color: colors.text },
  formula: { padding: 12, borderRadius: 10, backgroundColor: colors.surface, gap: 6 },
  expression: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  substituted: { fontSize: 14, lineHeight: 20, color: colors.text },
  result: { fontSize: 15, fontWeight: 'bold', color: colors.primary, fontVariant: ['tabular-nums'] },
  table: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sticky: { borderRightWidth: 1, borderRightColor: colors.primary, backgroundColor: colors.card, zIndex: 1 },
  row: { flexDirection: 'row' },
  head: {
    height: HEAD_H,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  headText: { fontSize: 13, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  cell: { height: ROW_H, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  cellAlt: { backgroundColor: colors.rowAlt },
  cellOn: { backgroundColor: '#FDE68A' },
  cellText: { fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  cellTextOn: { fontWeight: 'bold', textDecorationLine: 'underline' },
});
