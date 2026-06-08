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
import { calculateGeometricProb, generateGeometricSamples, getGeometricStats, generateGeometricChartElements } from '../../src/utils/calculations/geometric';
import { generateDiscreteFrequencyTable } from '../../src/utils/calculations/frequency';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useHistoryStore } from '../../src/store/historyStore';
import { Ionicons } from '@expo/vector-icons';

const MODES = ['P(X = x)', 'P(X ≤ x)', 'P(X ≥ x)'];

export default function GeometricDistribution() {
  const [pStr, setPStr] = useState('0.5');
  const [xVal, setXVal] = useState('3');
  const [modeIdx, setModeIdx] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  const [sampleSizeStr, setSampleSizeStr] = useState('100');
  const [freqData, setFreqData] = useState<FreqDataRow[] | null>(null);

  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);

  const p = parseFloat(pStr);
  const x = parseInt(xVal, 10);

  const isValid = !isNaN(p) && p > 0 && p <= 1 && !isNaN(x) && x >= 1;

  const result = useMemo(() => {
    if (!isValid) return null;
    return calculateGeometricProb(x, p, modeIdx);
  }, [p, x, modeIdx, isValid]);

  const handleSave = () => {
    if (!isValid || result === null) return;
    addHistoryItem({
      type: 'Geometric',
      parameters: { p, x },
      mode: MODES[modeIdx],
      result,
    });
    Alert.alert('Saved!', 'Calculation added to History.');
  };

  const runSimulation = () => {
    if (!isValid) return;
    const N = parseInt(sampleSizeStr, 10);
    if (isNaN(N) || N <= 0) return;

    const samples = generateGeometricSamples(p, N);
    const tableData = generateDiscreteFrequencyTable(samples);

    setFreqData(tableData);
  };

  const { chartElements, maxX } = useMemo(() => {
    const { chartData, maxX: maxK } = generateGeometricChartElements(p, x, modeIdx, isValid);
    
    const elements = chartData.map((data) => (
      <React.Fragment key={data.k}>
        <Rect 
          x={data.px} 
          y={data.py} 
          width={data.barWidth} 
          height={data.barHeight} 
          fill={data.isHighlighted ? colors.primary : colors.primaryLight}
          opacity={data.isHighlighted ? 1 : 0.4}
          rx={2}
        />
        {data.k % Math.ceil(data.maxK/10) === 0 && (
          <SvgText x={data.px + data.barWidth/2} y={data.height + 15} fontSize="9" fill={colors.textSecondary} textAnchor="middle">
            {data.k}
          </SvgText>
        )}
      </React.Fragment>
    ));

    return { chartElements: elements, maxX: maxK };
  }, [p, x, modeIdx, isValid]);

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
          <Input 
            label="Probability of Success (p)" 
            value={pStr} 
            onChangeText={setPStr} 
            error={!isNaN(p) && (p <= 0 || p > 1) ? "Must be between (0, 1]" : undefined}
          />
          <Input 
            label="Target Trial (x)" 
            value={xVal} 
            onChangeText={setXVal} 
            error={!isNaN(x) && x < 1 ? "Must be ≥ 1" : undefined}
          />

          <SegmentedControl 
            options={MODES} 
            selectedIndex={modeIdx} 
            onChange={setModeIdx} 
          />
        </View>

        {isValid && (
          <StatBox stats={getGeometricStats(p)} />
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
              {chartElements}
              <Line x1="0" y1="149" x2="300" y2="149" stroke={colors.border} strokeWidth="2" />
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

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="Geometric Distribution">
        <Text style={styles.modalHeading}>Formula (PMF)</Text>
        <InteractiveFormula 
          formulaLatex={formulas.geometric.latex}
          tokensMetadata={formulas.geometric.tokens}
        />
        
        <Text style={styles.modalHeading}>Description</Text>
        <Text style={styles.modalText}>
          The geometric distribution represents the number of trials needed to get the first success in a sequence of independent Bernoulli trials.
        </Text>
        
        <Text style={styles.modalHeading}>Key Properties</Text>
        <Text style={styles.modalListItem}>• Discrete probability distribution</Text>
        <Text style={styles.modalListItem}>• X ∈ {'{1, 2, 3, ...}'}</Text>
        <Text style={styles.modalListItem}>• Memoryless property</Text>
        <Text style={styles.modalListItem}>• Mean (E[X]) = 1 / p</Text>
        <Text style={styles.modalListItem}>• Variance (Var(X)) = (1 - p) / p²</Text>
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
