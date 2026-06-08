import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
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
import { calculateNormalProb, generateNormalSamples, getNormalStats, getZScore, generateNormalChartPaths } from '../../src/utils/calculations/normal';
import { generateContinuousFrequencyTable } from '../../src/utils/calculations/frequency';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { useHistoryStore } from '../../src/store/historyStore';
import { Ionicons } from '@expo/vector-icons';

const MODES = ['P(X ≤ x)', 'P(X ≥ x)'];

export default function NormalDistribution() {
  const [mean, setMean] = useState('0');
  const [stdDev, setStdDev] = useState('1');
  const [xVal, setXVal] = useState('0');
  const [modeIdx, setModeIdx] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  React.useEffect(() => {
    import('../../src/db/database').then(({ recordActivity }) => {
      recordActivity('Normal Calculator', 'TOOL', '/utilities/normal');
    });
  }, []);

  const [sampleSizeStr, setSampleSizeStr] = useState('100');
  const [freqData, setFreqData] = useState<FreqDataRow[] | null>(null);

  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);

  const parsedMean = parseFloat(mean);
  const parsedStdDev = parseFloat(stdDev);
  const parsedX = parseFloat(xVal);

  const isValid = !isNaN(parsedMean) && !isNaN(parsedStdDev) && parsedStdDev > 0 && !isNaN(parsedX);

  const result = useMemo(() => {
    if (!isValid) return null;
    return calculateNormalProb(parsedX, parsedMean, parsedStdDev, modeIdx);
  }, [parsedMean, parsedStdDev, parsedX, modeIdx, isValid]);

  const handleSave = () => {
    if (!isValid || result === null) return;
    addHistoryItem({
      type: 'Normal',
      parameters: { 'μ': parsedMean, 'σ': parsedStdDev, 'x': parsedX },
      mode: MODES[modeIdx],
      result,
    });
    Alert.alert('Saved!', 'Calculation added to History.');
  };

  const runSimulation = () => {
    if (!isValid) return;
    const N = parseInt(sampleSizeStr, 10);
    if (isNaN(N) || N <= 0) return;

    const samples = generateNormalSamples(parsedMean, parsedStdDev, N);
    const tableData = generateContinuousFrequencyTable(samples);

    setFreqData(tableData);
  };

  const { curvePath, shadedPath, plotMean, plotStdDev } = useMemo(() => {
    return generateNormalChartPaths(parsedMean, parsedStdDev, parsedX, modeIdx, isValid);
  }, [parsedMean, parsedStdDev, parsedX, modeIdx, isValid]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen options={{ 
        headerRight: () => (
          <TouchableOpacity onPress={() => setInfoVisible(true)} style={{ marginRight: 16 }}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Parameters</Text>
            <TouchableOpacity style={styles.stdBtn} onPress={() => { setMean('0'); setStdDev('1'); }}>
              <Text style={styles.stdBtnText}>Use N(0,1)</Text>
            </TouchableOpacity>
          </View>
          <Input label="Mean (μ)" value={mean} onChangeText={setMean} />
          <Input 
            label="Standard Deviation (σ)" 
            value={stdDev} 
            onChangeText={setStdDev} 
            error={!isNaN(parsedStdDev) && parsedStdDev <= 0 ? "Standard deviation must be > 0" : undefined}
          />
          <Input label="Value (x or z)" value={xVal} onChangeText={setXVal} />

          <SegmentedControl 
            options={MODES} 
            selectedIndex={modeIdx} 
            onChange={setModeIdx} 
          />
        </View>

        {isValid && (
          <StatBox stats={getNormalStats(parsedMean, parsedStdDev)} />
        )}

        {isValid && (
          <View style={styles.zScoreBox}>
            <Text style={styles.zScoreTitle}>Z-Score Calculation</Text>
            <Text style={styles.zScoreFormula}>Z = (x - μ) / σ</Text>
            <Text style={styles.zScoreMath}>Z = ({parsedX} - {parsedMean}) / {parsedStdDev}</Text>
            <Text style={styles.zScoreResult}>Z = {getZScore(parsedX, parsedMean, parsedStdDev).toFixed(4)}</Text>
          </View>
        )}

        <View style={styles.resultContainer}>
          {isValid && result !== null ? (
            <>
              <Text style={styles.resultLabel}>Probability</Text>
              <Text style={styles.resultValue}>{(result * 100).toFixed(4)}%</Text>
              <Text style={styles.resultRaw}>{result.toFixed(6)}</Text>
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
              
              <Line x1="150" y1="145" x2="150" y2="154" stroke={colors.textSecondary} strokeWidth="1" />
              <SvgText x="150" y="166" fontSize="10" fill={colors.textSecondary} textAnchor="middle">{plotMean}</SvgText>
              
              <Line x1="75" y1="145" x2="75" y2="154" stroke={colors.textSecondary} strokeWidth="1" />
              <SvgText x="75" y="166" fontSize="10" fill={colors.textSecondary} textAnchor="middle">{+(plotMean - 2*plotStdDev).toFixed(2)}</SvgText>
              
              <Line x1="225" y1="145" x2="225" y2="154" stroke={colors.textSecondary} strokeWidth="1" />
              <SvgText x="225" y="166" fontSize="10" fill={colors.textSecondary} textAnchor="middle">{+(plotMean + 2*plotStdDev).toFixed(2)}</SvgText>
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
          {freqData && (
            <>
              <FrequencyTable data={freqData} />
              <Histogram data={freqData} />
            </>
          )}
        </View>

      </ScrollView>

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="Normal Distribution">
        <Text style={styles.modalHeading}>Formula (PDF)</Text>
        <InteractiveFormula 
          formulaLatex={formulas.normal.latex}
          tokensMetadata={formulas.normal.tokens}
        />
        
        <Text style={styles.modalHeading}>Description</Text>
        <Text style={styles.modalText}>
          The normal (or Gaussian) distribution is a continuous probability distribution that is symmetrical around its mean. It shows that data near the mean are more frequent in occurrence than data far from the mean.
        </Text>
        
        <Text style={styles.modalHeading}>Key Properties</Text>
        <Text style={styles.modalListItem}>• Continuous probability distribution</Text>
        <Text style={styles.modalListItem}>• Symmetrical bell-shaped curve</Text>
        <Text style={styles.modalListItem}>• Mean = Median = Mode</Text>
        <Text style={styles.modalListItem}>• Empirical Rule: ~68% of data falls within 1σ, ~95% within 2σ, and ~99.7% within 3σ.</Text>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  stdBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stdBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
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
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
  },
  resultRaw: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 170,
  },
  emptyState: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    gap: 8,
  },
  saveBtnText: {
    color: colors.primary,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  formulaBox: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  formulaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalListItem: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginLeft: 8,
  },
  zScoreBox: {
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  zScoreTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  zScoreFormula: {
    fontSize: 14,
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  zScoreMath: {
    fontSize: 14,
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  zScoreResult: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
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
