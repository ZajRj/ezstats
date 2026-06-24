import Text from '../../src/components/ui/Text';
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import Input from '../../src/components/ui/Input';
import SegmentedControl from '../../src/components/ui/SegmentedControl';
import StatBox from '../../src/components/ui/StatBox';
import BottomSheetModal from '../../src/components/ui/BottomSheetModal';
import FrequencyTable, { FreqDataRow } from '../../src/components/ui/FrequencyTable';
import Histogram from '../../src/components/ui/Histogram';
import InteractiveFormula from '../../src/components/ui/InteractiveFormula';
import formulas from '../../src/data/formulas.json';
import { calculateFProb, generateFSamples, getFStats, generateFChartPaths, FSimulationRow } from '../../src/utils/calculations/f_dist';
import { generateContinuousFrequencyTable } from '../../src/utils/calculations/frequency';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { useHistoryStore } from '../../src/store/historyStore';
import { Ionicons } from '@expo/vector-icons';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';

const MODES = ['P(X ≤ x)', 'P(X ≥ x)'];

export default function FDistribution() {
  const [df1Str, setDf1Str] = useState('5');
  const [df2Str, setDf2Str] = useState('10');
  const [xStr, setXStr] = useState('2.5');
  const [modeIdx, setModeIdx] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  React.useEffect(() => {
    import('../../src/db/database').then(({ recordActivity }) => {
      recordActivity('F-Distribution Calculator', 'TOOL', '/utilities/f_distribution');
    });
  }, []);

  const [sampleSizeStr, setSampleSizeStr] = useState('100');
  const [freqData, setFreqData] = useState<FreqDataRow[] | null>(null);
  const [simData, setSimData] = useState<FSimulationRow[] | null>(null);

  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);

  const df1 = parseFloat(df1Str);
  const df2 = parseFloat(df2Str);
  const x = parseFloat(xStr);

  const isValid = !isNaN(df1) && df1 > 0 && !isNaN(df2) && df2 > 0 && !isNaN(x) && x >= 0;

  const prob = useMemo(() => {
    if (!isValid) return null;
    return calculateFProb(x, df1, df2, modeIdx);
  }, [df1, df2, x, modeIdx, isValid]);

  const handleSave = () => {
    if (!isValid || prob === null) return;
    addHistoryItem({
      type: "F-Distribution",
      parameters: { 'd₁': df1, 'd₂': df2, 'x': x },
      mode: MODES[modeIdx],
      result: prob,
    });
    Alert.alert('Saved!', 'Calculation added to History.');
  };

  const { curvePath, shadedPath, minZ, maxZ } = useMemo(() => {
    return generateFChartPaths(df1, df2, x, modeIdx, isValid);
  }, [df1, df2, x, modeIdx, isValid]);

  const runSimulation = () => {
    if (isNaN(df1) || df1 <= 0 || isNaN(df2) || df2 <= 0) return;
    const N = parseInt(sampleSizeStr, 10);
    if (isNaN(N) || N <= 0) return;

    const { samples, tableData } = generateFSamples(df1, df2, Math.min(N, 10000));
    setSimData(tableData);
    setFreqData(generateContinuousFrequencyTable(samples));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
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
          <Input 
            label="Num df (d₁)" 
            value={df1Str} 
            onChangeText={setDf1Str} 
            error={!isNaN(df1) && df1 <= 0 ? "Degrees of freedom must be > 0" : undefined}
          />
          <Input 
            label="Den df (d₂)" 
            value={df2Str} 
            onChangeText={setDf2Str} 
            error={!isNaN(df2) && df2 <= 0 ? "Degrees of freedom must be > 0" : undefined}
          />
          <Input label="Value (x)" value={xStr} onChangeText={setXStr} />

          <SegmentedControl 
            options={MODES} 
            selectedIndex={modeIdx} 
            onChange={setModeIdx} 
          />
        </View>

        {isValid && (
          <StatBox stats={getFStats(df1, df2)} />
        )}

        <View style={styles.resultContainer}>
          {isValid && prob !== null ? (
            <>
              <Text style={styles.resultLabel}>Probability</Text>
              <Text style={styles.resultValue}>{(prob * 100).toFixed(4)}%</Text>
              <Text style={styles.resultRaw}>{prob.toFixed(6)}</Text>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Enter valid parameters</Text>
            </View>
          )}

          <View style={styles.chartContainer}>
            <Svg width="300" height="170" viewBox="0 0 300 170">
              <Path d={shadedPath} fill={isValid ? colors.primaryLight : 'transparent'} opacity={0.6} />
              <Path d={curvePath} stroke={isValid ? colors.primary : '#D1D5DB'} strokeWidth="2" fill="none" />
              <Line x1="0" y1="149" x2="300" y2="149" stroke={colors.border} strokeWidth="2" />
              
              <Line x1="0" y1="145" x2="0" y2="154" stroke={colors.textSecondary} strokeWidth="1" />
              <SvgText x="0" y="166" fontSize="10" fill={colors.textSecondary} textAnchor="start">{minZ}</SvgText>
              
              <Line x1="150" y1="145" x2="150" y2="154" stroke={colors.textSecondary} strokeWidth="1" />
              <SvgText x="150" y="166" fontSize="10" fill={colors.textSecondary} textAnchor="middle">{+((minZ + maxZ) / 2).toFixed(2)}</SvgText>

              <Line x1="300" y1="145" x2="300" y2="154" stroke={colors.textSecondary} strokeWidth="1" />
              <SvgText x="300" y="166" fontSize="10" fill={colors.textSecondary} textAnchor="end">{maxZ.toFixed(2)}</SvgText>
            </Svg>
          </View>

          {isValid && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="bookmark-outline" size={18} color={colors.primary} />
              <Text style={styles.saveBtnText}>Save to History</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.simContainer}>
          <Text style={styles.simTitle}>Simulation & Sampling</Text>
          <Text style={styles.simDesc}>Generate N random numbers matching this distribution to build a frequency table.</Text>
          <View style={styles.simRow}>
            <View style={{ flex: 1 }}>
              <Input label="Sample Size (N)" value={sampleSizeStr} onChangeText={setSampleSizeStr} />
            </View>
            <TouchableOpacity style={styles.simBtn} onPress={runSimulation}>
              <Ionicons name="play" size={16} color="#FFF" />
              <Text style={styles.simBtnText}>Run</Text>
            </TouchableOpacity>
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

          {freqData && freqData.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8, color: colors.textSecondary }}>FREQUENCY DISTRIBUTION</Text>
              <Histogram data={freqData} />
              <FrequencyTable data={freqData} isDiscrete={false} />
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
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 20 },
  resultContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  resultRaw: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  chartContainer: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  saveBtnText: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalHeading: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
  modalText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  simContainer: {
    marginTop: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  simTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  simDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  simBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
