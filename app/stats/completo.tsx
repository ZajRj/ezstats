import React, { useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform, LayoutAnimation } from 'react-native';
import { Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../../src/components/ui/Text';
import SegmentedControl from '../../src/components/ui/SegmentedControl';
import DataInput from '../../src/components/stats/DataInput';
import ResultBlock from '../../src/components/stats/ResultBlock';
import {
  draft, useGroups, parseGroups, resolveAlpha, valuesToText,
  SettingsPanel, PrimaryButton, GhostButton, ErrorBox, SectionTitle,
} from '../../src/components/stats/Controls';
import { colors } from '../../src/theme/colors';
import { assumptionsPipeline, type AssumptionCheck, type PipelineResult } from '../../src/stats/tests/anova/assumptionsPipeline';
import { StatsInputError, StatsNumericError } from '../../src/stats/types';
import { useStatsPrefs } from '../../src/store/statsPrefsStore';
import { ANOVA_GROUPS } from '../../src/stats/fixtures';

const KIND_TITLE = {
  aleatoriedad: '1. Aleatoriedad (rachas sobre/bajo la mediana)',
  normalidad: '2. Normalidad',
  homocedasticidad: '3. Homogeneidad de varianzas',
} as const;

function CheckRow({ check }: { check: AssumptionCheck }) {
  const [open, setOpen] = useState(false);
  const status = check.passed === true ? 'cumple' : check.passed === false ? 'no cumple' : 'no se pudo evaluar';
  const icon = check.passed === true ? 'checkmark-circle' : check.passed === false ? 'close-circle' : 'remove-circle';
  const tint = check.passed === true ? colors.success : check.passed === false ? colors.danger : colors.textSecondary;
  return (
    <View style={styles.check}>
      <Pressable
        onPress={() => {
          if (!check.result) return;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((v) => !v);
        }}
        style={({ pressed }) => [styles.checkHead, pressed && check.result && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${check.label}: ${status}`}
      >
        <Ionicons name={icon} size={22} color={tint} />
        <View style={styles.flex}>
          <Text style={styles.checkLabel}>{check.label}</Text>
          <Text style={[styles.checkStatus, { color: tint }]}>
            {check.passed === true ? '✓ Cumple' : check.passed === false ? '✗ No cumple' : `— ${check.error}`}
          </Text>
        </View>
        {check.result && <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />}
      </Pressable>
      {open && check.result && (
        <View style={styles.checkBody}>
          <ResultBlock result={check.result} />
        </View>
      )}
    </View>
  );
}

export default function FullAnalysis() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const resultY = useRef(0);
  const { decimal, setDecimal, mode, setMode } = useStatsPrefs();
  const { groups, setGroups, update, add, remove } = useGroups([draft('Grupo 1'), draft('Grupo 2'), draft('Grupo 3')]);
  const [normality, setNormality] = useState<'shapiroWilk' | 'lilliefors'>('shapiroWilk');
  const [alpha, setAlpha] = useState(0.05);
  const [customAlpha, setCustomAlpha] = useState('');
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    setResult(null);
    setError(null);
  };

  const loadExample = () => {
    setGroups(Object.entries(ANOVA_GROUPS).map(([, v], i) => draft(`Grupo ${i + 1}`, valuesToText(v, decimal))));
    invalidate();
  };

  const run = () => {
    setError(null);
    const parsed = parseGroups(groups, decimal);
    if ('error' in parsed) return setError(parsed.error);
    const a = resolveAlpha(alpha, customAlpha, mode, decimal);
    if (typeof a === 'string') return setError(a);
    try {
      setResult(assumptionsPipeline(parsed.groups, { normality }, { alpha: a, mode }));
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: resultY.current - 12, animated: true }));
    } catch (e) {
      if (e instanceof StatsInputError) return setError(e.message);
      if (e instanceof StatsNumericError) return setError(`No se pudo completar el cálculo numérico: ${e.message}`);
      throw e;
    }
  };

  const kinds = ['aleatoriedad', 'normalidad', 'homocedasticidad'] as const;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <Stack.Screen options={{ title: 'Análisis completo' }} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.intro}>
          <Text style={styles.introText}>
            Se verifican en orden la aleatoriedad (en el orden ingresado), la normalidad de cada grupo y la homogeneidad de
            varianzas. Si todo se cumple se aplica ANOVA (y Tukey si es significativo); si no, Kruskal-Wallis.
          </Text>
        </View>

        <View style={styles.rowBetween}>
          <SectionTitle>Grupos</SectionTitle>
          <GhostButton label="Cargar ejemplo" icon="flask-outline" onPress={loadExample} />
        </View>
        {groups.map((g) => (
          <DataInput
            key={g.key}
            label={g.label}
            text={g.text}
            decimal={decimal}
            hint="En el orden de observación."
            onChangeText={(t) => { update(g.key, { text: t }); invalidate(); }}
            onChangeLabel={(l) => update(g.key, { label: l })}
            onRemove={groups.length > 2 ? () => { remove(g.key); invalidate(); } : undefined}
          />
        ))}
        <GhostButton label="Agregar grupo" icon="add-circle-outline" onPress={() => { add(); invalidate(); }} />

        <SectionTitle>Opciones</SectionTitle>
        <View style={styles.card}>
          <Text style={styles.label}>Prueba de normalidad</Text>
          <SegmentedControl
            compact
            options={['Shapiro-Wilk', 'Lilliefors']}
            selectedIndex={normality === 'shapiroWilk' ? 0 : 1}
            onChange={(i) => { setNormality(i === 0 ? 'shapiroWilk' : 'lilliefors'); invalidate(); }}
          />
          <Text style={styles.hint}>Homogeneidad: Bartlett si todos pasan la normalidad; Levene en caso contrario.</Text>
        </View>
        <SettingsPanel
          alpha={alpha}
          setAlpha={(a) => { setAlpha(a); invalidate(); }}
          customAlpha={customAlpha}
          setCustomAlpha={(s) => { setCustomAlpha(s); invalidate(); }}
          mode={mode}
          setMode={(m) => { setMode(m); invalidate(); }}
          decimal={decimal}
          setDecimal={(d) => { setDecimal(d); invalidate(); }}
        />

        <PrimaryButton label="Analizar" icon="play" onPress={run} />
        {error ? <ErrorBox message={error} /> : null}

        <View onLayout={(e) => (resultY.current = e.nativeEvent.layout.y)} style={styles.results}>
          {result && (
            <>
              <SectionTitle>Supuestos</SectionTitle>
              {kinds.map((k) => (
                <View key={k} style={styles.card}>
                  <Text style={styles.kindTitle}>{KIND_TITLE[k]}</Text>
                  {result.checks.filter((c) => c.kind === k).map((c) => <CheckRow key={c.label} check={c} />)}
                </View>
              ))}
              {result.warnings.map((w, i) => (
                <View key={i} style={styles.warning}>
                  <Ionicons name="warning-outline" size={16} color="#92400E" />
                  <Text style={styles.warningText}>{w}</Text>
                </View>
              ))}
              <SectionTitle>4. Prueba de medias</SectionTitle>
              <View style={styles.reason}>
                <Ionicons name={result.final.testId === 'oneWayAnova' ? 'git-compare' : 'swap-vertical'} size={18} color={colors.primary} />
                <Text style={styles.reasonText}>{result.reason}</Text>
              </View>
              <ResultBlock result={result.final} />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  intro: { padding: 14, borderRadius: 14, backgroundColor: colors.primaryLight },
  introText: { fontSize: 14, lineHeight: 21, color: colors.primary },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  hint: { fontSize: 12, color: colors.textSecondary },
  results: { gap: 12 },
  kindTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  check: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  checkHead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  checkStatus: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  checkBody: { marginTop: 10 },
  warning: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 10, backgroundColor: '#FEF3C7' },
  warningText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#78350F' },
  reason: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.primaryLight },
  reasonText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.primary },
});
