import React, { useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../../src/components/ui/Text';
import SegmentedControl from '../../src/components/ui/SegmentedControl';
import BottomSheetModal from '../../src/components/ui/BottomSheetModal';
import DataInput from '../../src/components/stats/DataInput';
import ResultBlock from '../../src/components/stats/ResultBlock';
import {
  draft, useGroups, parseGroups, parseOne, resolveAlpha, valuesToText,
  SettingsPanel, TextField, PrimaryButton, GhostButton, ErrorBox, SectionTitle, type GroupDraft,
} from '../../src/components/stats/Controls';
import { colors } from '../../src/theme/colors';
import { getTest, runWithModeCheck, type InputKind, type ParamValues, type TestDef } from '../../src/stats/registry';
import { StatsInputError, StatsNumericError, type TestResult } from '../../src/stats/types';
import { useStatsPrefs } from '../../src/store/statsPrefsStore';

function initialDrafts(input: InputKind): GroupDraft[] {
  if (input === 'single') return [draft('Muestra')];
  if (input === 'sequence') return [draft('Secuencia')];
  if (input === 'two') return [draft('Muestra 1'), draft('Muestra 2')];
  return [draft('Grupo 1'), draft('Grupo 2'), draft('Grupo 3')];
}

function InfoSheet({ def, visible, onClose }: { def: TestDef; visible: boolean; onClose: () => void }) {
  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={def.name}>
      {([
        ['¿Qué evalúa?', def.info.what],
        ['Supuestos', def.info.assumptions],
        ['¿Cuándo usarla?', def.info.when],
        ['Fórmula principal', def.info.formula],
        ['Requisitos', def.requirements],
      ] as const).map(([h, body]) => (
        <View key={h} style={styles.infoBlock}>
          <Text style={styles.infoHeading}>{h}</Text>
          <Text style={styles.infoBody}>{body}</Text>
        </View>
      ))}
    </BottomSheetModal>
  );
}

export default function StatsTestScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const def = getTest(String(testId));
  if (!def) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Stack.Screen options={{ title: 'Prueba' }} />
        <ErrorBox message="No se encontró esa prueba." />
      </View>
    );
  }
  return <TestScreen def={def} />;
}

function TestScreen({ def }: { def: TestDef }) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const resultY = useRef(0);
  const { decimal, setDecimal, mode, setMode } = useStatsPrefs();
  const { groups, setGroups, update, add, remove } = useGroups(initialDrafts(def.input));
  const [paramText, setParamText] = useState<Record<string, string>>(() =>
    Object.fromEntries(def.params.map((p) => [p.key, p.kind === 'choice' ? p.default : ''])),
  );
  const [alpha, setAlpha] = useState(0.05);
  const [customAlpha, setCustomAlpha] = useState('');
  const [variableName, setVariableName] = useState('');
  const [unit, setUnit] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);

  const invalidate = () => {
    setResult(null);
    setError(null);
  };

  const loadExample = () => {
    const ex = def.examples[exampleIdx % def.examples.length];
    setGroups(ex.groups.map((g) => draft(g.label, valuesToText(g.values, decimal))));
    const next: Record<string, string> = { ...paramText };
    for (const p of def.params) {
      const v = ex.params?.[p.key];
      if (v !== undefined) next[p.key] = typeof v === 'number' ? valuesToText([v], decimal) : String(v);
    }
    setParamText(next);
    setVariableName(ex.variableName ?? '');
    setUnit(ex.unit ?? '');
    setExampleIdx((i) => i + 1);
    invalidate();
  };

  const calculate = () => {
    setError(null);
    const parsed = parseGroups(groups, decimal);
    if ('error' in parsed) return fail(parsed.error);
    const a = resolveAlpha(alpha, customAlpha, mode, decimal);
    if (typeof a === 'string') return fail(a);
    const params: ParamValues = {};
    for (const p of def.params) {
      const raw = paramText[p.key] ?? '';
      if (p.kind === 'choice') params[p.key] = raw;
      else if (raw.trim() === '') {
        if (!p.optional) return fail(`Completa el campo “${p.label}”.`);
      } else {
        const v = parseOne(raw, decimal);
        if (isNaN(v)) return fail(`“${p.label}” debe ser un número.`);
        params[p.key] = v;
      }
    }
    try {
      const r = runWithModeCheck(def, parsed.groups, params, {
        alpha: a,
        mode,
        variableName: variableName.trim() || undefined,
        unit: unit.trim() || undefined,
      });
      setResult(r);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: resultY.current - 12, animated: true }));
    } catch (e) {
      if (e instanceof StatsInputError) return fail(e.message);
      if (e instanceof StatsNumericError) return fail(`No se pudo completar el cálculo numérico: ${e.message}`);
      throw e;
    }
  };

  const fail = (msg: string) => {
    setResult(null);
    setError(msg);
  };

  const groupHint = def.input === 'sequence' ? 'Escribe los datos en el orden en que se observaron; no se reordenan.' : undefined;
  const canRemove = def.input === 'groups' && groups.length > 2;
  const exampleLabel = useMemo(() => def.examples[exampleIdx % def.examples.length].label, [def, exampleIdx]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <Stack.Screen
        options={{
          title: def.name,
          headerRight: () => (
            <Pressable onPress={() => setInfoOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="¿Qué es esta prueba?">
              <Ionicons name="information-circle-outline" size={26} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable onPress={() => setInfoOpen(true)} style={styles.whenBox} accessibilityRole="button">
          <Text style={styles.whenText}>{def.when}</Text>
          <Text style={styles.whenLink}>¿Qué es esta prueba?</Text>
        </Pressable>

        <View style={styles.rowBetween}>
          <SectionTitle>Datos</SectionTitle>
          <GhostButton label={`Cargar ejemplo`} icon="flask-outline" onPress={loadExample} />
        </View>
        <Text style={styles.exampleNote}>Siguiente ejemplo: {exampleLabel}</Text>

        {groups.map((g) => (
          <DataInput
            key={g.key}
            label={g.label}
            text={g.text}
            decimal={decimal}
            unit={unit || undefined}
            hint={groupHint}
            onChangeText={(t) => { update(g.key, { text: t }); invalidate(); }}
            onChangeLabel={def.input === 'groups' || def.input === 'two' ? (l) => update(g.key, { label: l }) : undefined}
            onRemove={canRemove ? () => { remove(g.key); invalidate(); } : undefined}
          />
        ))}
        {def.input === 'groups' && (
          <GhostButton label="Agregar grupo" icon="add-circle-outline" onPress={() => { add(); invalidate(); }} />
        )}

        {def.params.length > 0 && <SectionTitle>Parámetros</SectionTitle>}
        {def.params.map((p) =>
          p.kind === 'choice' ? (
            <View key={p.key} style={styles.paramCard}>
              <Text style={styles.paramLabel}>{p.label}</Text>
              <SegmentedControl
                compact
                options={p.options.map((o) => o.label)}
                selectedIndex={Math.max(0, p.options.findIndex((o) => o.value === paramText[p.key]))}
                onChange={(i) => { setParamText((s) => ({ ...s, [p.key]: p.options[i].value })); invalidate(); }}
              />
            </View>
          ) : (
            <View key={p.key} style={styles.paramCard}>
              <TextField
                label={p.label + (p.optional ? ' (opcional)' : '')}
                value={paramText[p.key] ?? ''}
                placeholder={p.placeholder}
                onChangeText={(s) => { setParamText((v) => ({ ...v, [p.key]: s })); invalidate(); }}
              />
            </View>
          ),
        )}

        <SectionTitle>Opciones</SectionTitle>
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
        {(def.input === 'single' || def.input === 'sequence') && (
          <View style={styles.paramCard}>
            <View style={styles.twoCols}>
              <View style={styles.flex}>
                <TextField
                  label="Variable (opcional)"
                  value={variableName}
                  onChangeText={(s) => { setVariableName(s); invalidate(); }}
                  placeholder="ej. el contenido neto"
                  numeric={false}
                />
              </View>
              <View style={styles.unitCol}>
                <TextField label="Unidad" value={unit} onChangeText={setUnit} placeholder="g" numeric={false} />
              </View>
            </View>
            <Text style={styles.paramHint}>Se usa en la conclusión: “…el contenido neto no sigue una distribución normal.”</Text>
          </View>
        )}

        <PrimaryButton label="Calcular" icon="calculator" onPress={calculate} />
        {error ? <ErrorBox message={error} /> : null}

        <View onLayout={(e) => (resultY.current = e.nativeEvent.layout.y)}>
          {result ? <ResultBlock result={result} /> : null}
        </View>
      </ScrollView>
      <InfoSheet def={def} visible={infoOpen} onClose={() => setInfoOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', padding: 16 },
  content: { padding: 16, gap: 12 },
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  whenBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    gap: 4,
  },
  whenText: { fontSize: 15, lineHeight: 21, color: colors.primary },
  whenLink: { fontSize: 13, fontWeight: '600', color: colors.primary, textDecorationLine: 'underline' },
  exampleNote: { fontSize: 12, color: colors.textSecondary, marginTop: -6 },
  paramCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  paramLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  paramHint: { fontSize: 12, color: colors.textSecondary },
  twoCols: { flexDirection: 'row', gap: 10 },
  unitCol: { width: 90 },
  infoBlock: { marginBottom: 16 },
  infoHeading: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  infoBody: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});
