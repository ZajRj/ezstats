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
import VerifyValueCard from '../../src/components/stats/VerifyValueCard';
import BestEstimatorCard from '../../src/components/stats/BestEstimatorCard';
import DirectRegressionView from '../../src/components/stats/DirectRegressionView';
import { copyToClipboard } from '../../src/utils/clipboard';
import { downloadTextFile } from '../../src/utils/fileExport';
import { generateAIReport } from '../../src/stats/reportGenerator';
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
  if (input === 'regression') return [draft('Y'), draft('X₁')];
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
  const { groups, setGroups, update, toggleEnabled, add, remove } = useGroups(initialDrafts(def.input));
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
  const [procMode, setProcMode] = useState<'directo' | 'detallado'>('directo');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  const handleCopyReport = async () => {
    try {
      const resolvedA = typeof resolveAlpha(alpha, customAlpha, mode, decimal) === 'number'
        ? (resolveAlpha(alpha, customAlpha, mode, decimal) as number)
        : alpha;

      const reportText = generateAIReport({
        def,
        groups,
        decimal,
        alpha: resolvedA,
        mode: procMode,
        result,
        variableName: variableName.trim() || undefined,
        unit: unit.trim() || undefined,
      });

      await copyToClipboard(reportText);

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Error al copiar al portapapeles:', e);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const resolvedA = typeof resolveAlpha(alpha, customAlpha, mode, decimal) === 'number'
        ? (resolveAlpha(alpha, customAlpha, mode, decimal) as number)
        : alpha;

      const reportText = generateAIReport({
        def,
        groups,
        decimal,
        alpha: resolvedA,
        mode: procMode,
        result,
        variableName: variableName.trim() || undefined,
        unit: unit.trim() || undefined,
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `reporte_${def.id}_${dateStr}.txt`;
      await downloadTextFile(filename, reportText);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (e) {
      console.warn('Error al descargar reporte:', e);
    }
  };

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

  const handleApplyBestModel = (activeLabels: string[]) => {
    const nextGroups = groups.map((g, idx) => {
      if (idx === 0) return g;
      return { ...g, enabled: activeLabels.includes(g.label) };
    });
    setGroups(nextGroups);
    const parsed = parseGroups(nextGroups, decimal);
    if ('groups' in parsed) {
      const a = resolveAlpha(alpha, customAlpha, mode, decimal);
      if (typeof a === 'number') {
        try {
          const r = runWithModeCheck(def, parsed.groups, {}, {
            alpha: a,
            mode,
            variableName: variableName.trim() || undefined,
            unit: unit.trim() || undefined,
          });
          setResult(r);
        } catch {
          invalidate();
        }
      }
    } else {
      invalidate();
    }
    // Desplazar al usuario nuevamente al principio para observar los cambios realizados
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 60);
  };

  const isReg = def.input === 'regression';
  const groupHint = def.input === 'sequence'
    ? 'Escribe los datos en el orden en que se observaron; no se reordenan.'
    : undefined;
  const canRemove = (def.input === 'groups' || isReg) && groups.length > 2;
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={handleCopyReport}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Copiar reporte"
              >
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={24}
                  color={copied ? '#16A34A' : colors.primary}
                />
              </Pressable>
              <Pressable
                onPress={handleDownloadReport}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Descargar reporte como TXT"
              >
                <Ionicons
                  name={downloaded ? 'checkmark-circle' : 'download-outline'}
                  size={24}
                  color={downloaded ? '#16A34A' : colors.primary}
                />
              </Pressable>
              <Pressable onPress={() => setInfoOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="¿Qué es esta prueba?">
                <Ionicons name="information-circle-outline" size={26} color={colors.primary} />
              </Pressable>
            </View>
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
          <View style={styles.topActionsRow}>
            <GhostButton
              label={copied ? '¡Copiado!' : 'Copiar'}
              icon={copied ? 'checkmark-circle' : 'copy-outline'}
              onPress={handleCopyReport}
            />
            <GhostButton
              label={downloaded ? '¡Descargado!' : 'Descargar TXT'}
              icon={downloaded ? 'checkmark-circle' : 'download-outline'}
              onPress={handleDownloadReport}
            />
            <GhostButton label="Cargar ejemplo" icon="flask-outline" onPress={loadExample} />
          </View>
        </View>
        <Text style={styles.exampleNote}>Siguiente ejemplo: {exampleLabel}</Text>

        {groups.map((g, idx) => (
          <DataInput
            key={`input-group-${g.key ?? idx}-${idx}`}
            label={g.label}
            text={g.text}
            decimal={decimal}
            unit={unit || undefined}
            enabled={g.enabled !== false}
            onToggleEnabled={isReg && idx === 0 ? undefined : () => { toggleEnabled(g.key); invalidate(); }}
            hint={isReg ? (idx === 0 ? 'Variable dependiente. Mismo orden de filas en todas las variables.' : 'Regresora; una fila por observación.') : groupHint}
            onChangeText={(t) => { update(g.key, { text: t }); invalidate(); }}
            onChangeLabel={def.input === 'groups' || def.input === 'two' || isReg ? (l) => update(g.key, { label: l }) : undefined}
            onRemove={canRemove && !(isReg && idx === 0) ? () => { remove(g.key); invalidate(); } : undefined}
          />
        ))}
        {isReg && (
          <GhostButton label="Agregar regresora" icon="add-circle-outline" onPress={() => { add((c) => `X${'₀₁₂₃₄₅₆₇₈₉'[c] ?? c}`); invalidate(); }} />
        )}
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
          {result ? (
            <View style={{ gap: 14 }}>
              {isReg && (
                <View style={styles.procModeContainer}>
                  <Text style={styles.procModeLabel}>Tipo de procedimiento:</Text>
                  <SegmentedControl
                    compact
                    options={['⚡ Procedimiento Directo', '📐 Procedimiento Detallado (Matricial)']}
                    selectedIndex={procMode === 'directo' ? 0 : 1}
                    onChange={(i) => setProcMode(i === 0 ? 'directo' : 'detallado')}
                  />
                </View>
              )}

              {isReg && procMode === 'directo' ? (
                (() => {
                  const pActive = parseGroups(groups, decimal, false);
                  const pAll = parseGroups(groups, decimal, true);
                  const activeGroups = 'groups' in pActive ? pActive.groups : [];
                  const allGroups = 'groups' in pAll ? pAll.groups : [];
                  const resolvedA = typeof resolveAlpha(alpha, customAlpha, mode, decimal) === 'number'
                    ? (resolveAlpha(alpha, customAlpha, mode, decimal) as number)
                    : alpha;
                  return (
                    <DirectRegressionView
                      groups={activeGroups}
                      allGroups={allGroups}
                      alpha={resolvedA}
                      onApplyBestModel={handleApplyBestModel}
                    />
                  );
                })()
              ) : (
                <>
                  <ResultBlock result={result} />
                  {!isReg && (
                    <>
                      <VerifyValueCard
                        testId={def.id}
                        groups={(() => {
                          const p = parseGroups(groups, decimal);
                          return 'groups' in p ? p.groups : [];
                        })()}
                        decimal={decimal}
                        alpha={typeof resolveAlpha(alpha, customAlpha, mode, decimal) === 'number'
                          ? (resolveAlpha(alpha, customAlpha, mode, decimal) as number)
                          : alpha}
                      />
                      <BestEstimatorCard
                        testId={def.id}
                        groups={(() => {
                          const p = parseGroups(groups, decimal);
                          return 'groups' in p ? p.groups : [];
                        })()}
                      />
                    </>
                  )}
                </>
              )}
            </View>
          ) : null}
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
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
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
  procModeContainer: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  procModeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  infoBlock: { marginBottom: 16 },
  infoHeading: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  infoBody: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});
