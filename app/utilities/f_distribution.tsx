import Text from '../../src/components/ui/Text';
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import BottomSheetModal from '../../src/components/ui/BottomSheetModal';
import FrequencyTable, { FreqDataRow } from '../../src/components/ui/FrequencyTable';
import Histogram from '../../src/components/ui/Histogram';
import InteractiveFormula from '../../src/components/ui/InteractiveFormula';
import formulas from '../../src/data/formulas.json';
import { calculateFProb, generateFSamples, getFStats, generateFChartPaths } from '../../src/utils/calculations/f_dist';
import { generateContinuousFrequencyTable } from '../../src/utils/calculations/frequency';
import Svg, { Path, Line } from 'react-native-svg';
import StatBox from '../../src/components/ui/StatBox';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';

export default function FDistribution() {
  const [df1Str, setDf1Str] = useState('5');
  const [df2Str, setDf2Str] = useState('10');
  const [xStr, setXStr] = useState('2.5');
  const [sampleSizeStr, setSampleSizeStr] = useState('100');
  const [mode, setMode] = useState<'leq' | 'geq'>('leq');
  const [infoVisible, setInfoVisible] = useState(false);

  const df1 = parseFloat(df1Str);
  const df2 = parseFloat(df2Str);
  const x = parseFloat(xStr);
  const sampleSize = parseInt(sampleSizeStr, 10);

  const isValid = !isNaN(df1) && df1 > 0 && !isNaN(df2) && df2 > 0 && !isNaN(x) && x >= 0;

  const prob = useMemo(() => {
    if (!isValid) return null;
    return calculateFProb(x, df1, df2, mode === 'leq' ? 0 : 1);
  }, [df1, df2, x, mode, isValid]);

  const stats = useMemo(() => {
    if (isNaN(df1) || df1 <= 0 || isNaN(df2) || df2 <= 0) return null;
    return getFStats(df1, df2);
  }, [df1, df2]);

  const { curvePath, shadedPath } = useMemo(() => {
    return generateFChartPaths(df1, df2, x, mode === 'leq' ? 0 : 1, isValid);
  }, [df1, df2, x, mode, isValid]);

  const { simData, freqData } = useMemo(() => {
    if (isNaN(df1) || df1 <= 0 || isNaN(df2) || df2 <= 0 || isNaN(sampleSize) || sampleSize <= 0) return { simData: null, freqData: [] };
    const { samples, tableData } = generateFSamples(df1, df2, Math.min(sampleSize, 10000));
    return {
      simData: tableData,
      freqData: generateContinuousFrequencyTable(samples)
    };
  }, [df1, df2, sampleSize]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <Stack.Screen options={{ 
        title: "F-Distribution",
        headerRight: () => (
          <TouchableOpacity onPress={() => setInfoVisible(true)} style={{ marginRight: 16 }}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parameters</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Num df (d₁)</Text>
              <TextInput style={styles.input} value={df1Str} onChangeText={setDf1Str} keyboardType="numeric" placeholder="e.g. 5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Den df (d₂)</Text>
              <TextInput style={styles.input} value={df2Str} onChangeText={setDf2Str} keyboardType="numeric" placeholder="e.g. 10" />
            </View>
          </View>
        </View>

        {stats && (
          <View style={styles.statsGrid}>
            {stats.map((s, i) => <StatBox key={i} label={s.label} value={s.value} />)}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Probability Calculator</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Value (x)</Text>
            <TextInput style={styles.input} value={xStr} onChangeText={setXStr} keyboardType="numeric" placeholder="e.g. 2.5" />
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleBtn, mode === 'leq' && styles.toggleBtnActive]} onPress={() => setMode('leq')}>
              <Text style={[styles.toggleBtnText, mode === 'leq' && styles.toggleBtnTextActive]}>P(X ≤ x)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, mode === 'geq' && styles.toggleBtnActive]} onPress={() => setMode('geq')}>
              <Text style={[styles.toggleBtnText, mode === 'geq' && styles.toggleBtnTextActive]}>P(X ≥ x)</Text>
            </TouchableOpacity>
          </View>

          {prob !== null && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Probability</Text>
              <Text style={styles.resultValue}>{(prob * 100).toFixed(4)}%</Text>
              <Text style={styles.resultSub}>{prob.toFixed(6)}</Text>
            </View>
          )}

          <View style={styles.chartContainer}>
            <Svg width="100%" height="150" viewBox="0 0 300 150">
              <Line x1="0" y1="150" x2="300" y2="150" stroke={colors.border} strokeWidth="2" />
              <Line x1="0" y1="0" x2="0" y2="150" stroke={colors.border} strokeWidth="1" strokeDasharray="4 4" />
              {isValid && <Path d={shadedPath} fill={colors.primary} fillOpacity={0.2} />}
              <Path d={curvePath} fill="none" stroke={colors.primary} strokeWidth="2" />
            </Svg>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Simulation</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sample Size (N)</Text>
            <TextInput style={styles.input} value={sampleSizeStr} onChangeText={setSampleSizeStr} keyboardType="number-pad" placeholder="e.g. 100" />
          </View>

          {simData && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8, color: colors.textSecondary }}>SIMULATION TABLE {parseInt(sampleSizeStr, 10) > 50 ? '(First 50)' : ''}</Text>
              <Table>
                <TableHead>
                  <TableCell isHeader width={60}>I</TableCell>
                  <TableCell isHeader width={100}>U(0,1)</TableCell>
                  <TableCell isHeader width={150}>X_i</TableCell>
                </TableHead>
                {simData.map((row) => (
                  <TableRow key={row.i}>
                    <TableCell width={60}>{row.i}</TableCell>
                    <TableCell width={100}>{row.u.toFixed(4)}</TableCell>
                    <TableCell width={150}>{row.x.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </View>
          )}

          {freqData.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8, color: colors.textSecondary }}>FREQUENCY DISTRIBUTION</Text>
              <Histogram data={freqData} />
              <FrequencyTable data={freqData} />
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="F-Distribution">
        <Text style={styles.modalHeading}>Formula (PDF)</Text>
        <InteractiveFormula formulaLatex={formulas.f_dist.latex} tokensMetadata={formulas.f_dist.tokens} />
        <Text style={styles.modalHeading}>Description</Text>
        <Text style={styles.modalText}>
          The F-distribution (or Fisher-Snedecor distribution) is primarily used in Analysis of Variance (ANOVA) and for F-tests of equality of variances. It describes the ratio of two scaled chi-square variables.
        </Text>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 100, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 16, color: colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleBtnText: { color: colors.textSecondary, fontWeight: '600' },
  toggleBtnTextActive: { color: colors.primary },
  resultContainer: { alignItems: 'center', padding: 24, backgroundColor: colors.primaryLight, borderRadius: 16, marginBottom: 24 },
  resultLabel: { fontSize: 14, color: colors.primary, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  resultValue: { fontSize: 48, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  resultSub: { fontSize: 16, color: colors.primary, opacity: 0.8 },
  chartContainer: { alignItems: 'center', marginTop: 16 },
  modalHeading: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
  modalText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
