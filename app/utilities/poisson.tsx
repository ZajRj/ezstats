import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
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
import { calculatePoissonProb, generatePoissonSamples, getPoissonStats, generatePoissonChartPoints } from '../../src/utils/calculations/poisson';
import { generateDiscreteFrequencyTable } from '../../src/utils/calculations/frequency';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useHistoryStore } from '../../src/store/historyStore';
import { Ionicons } from '@expo/vector-icons';

const MODES = ['P(X = x)', 'P(X ≤ x)', 'P(X ≥ x)'];

export default function PoissonDistribution() {
  const [lambdaStr, setLambdaStr] = useState('5');
  const [xVal, setXVal] = useState('3');
  const [modeIdx, setModeIdx] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  const [sampleSizeStr, setSampleSizeStr] = useState('100');
  const [freqData, setFreqData] = useState<FreqDataRow[] | null>(null);

  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);

  const lambda = parseFloat(lambdaStr);
  const x = parseInt(xVal, 10);

  const isValid = !isNaN(lambda) && lambda > 0 && !isNaN(x) && x >= 0;

  const result = useMemo(() => {
    if (!isValid) return null;
    return calculatePoissonProb(x, lambda, modeIdx);
  }, [lambda, x, modeIdx, isValid]);

  const handleSave = () => {
    if (!isValid || result === null) return;
    addHistoryItem({
      type: 'Poisson',
      parameters: { 'λ': lambda, x },
      mode: MODES[modeIdx],
      result,
    });
    Alert.alert('Saved!', 'Calculation added to History.');
  };

  const runSimulation = () => {
    if (!isValid) return;
    const N = parseInt(sampleSizeStr, 10);
    if (isNaN(N) || N <= 0) return;
    
    const samples = generatePoissonSamples(lambda, N);
    const tableData = generateDiscreteFrequencyTable(samples);
      
    setFreqData(tableData);
  };

  const chart = useMemo(() => {
    const { points, maxPdf, barWidth, gap, displayN } = generatePoissonChartPoints(lambda, x, modeIdx, isValid);

    return (
      <Svg width="300" height="170" viewBox="0 0 300 170">
        {points.map((pt, i) => {
          const barHeight = (pt.pdf / maxPdf) * (140 - 10);
          const px = i * (barWidth + gap) + gap;
          const py = 140 - barHeight;

          return (
            <Rect 
              key={i}
              x={px} 
              y={py} 
              width={barWidth} 
              height={barHeight} 
              fill={pt.isHighlighted ? colors.primary : colors.progressBg}
              rx={2}
            />
          );
        })}
        <Line x1="0" y1="139" x2="300" y2="139" stroke={colors.border} strokeWidth="2" />
        
        <SvgText x={gap + barWidth/2} y="156" fontSize="10" fill={colors.textSecondary} textAnchor="middle">0</SvgText>
        <SvgText x={300/2} y="156" fontSize="10" fill={colors.textSecondary} textAnchor="middle">{Math.round(displayN / 2)}</SvgText>
        <SvgText x={300 - gap - barWidth/2} y="156" fontSize="10" fill={colors.textSecondary} textAnchor="middle">{displayN}</SvgText>
      </Svg>
    );
  }, [lambda, x, modeIdx, isValid]);

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
            label="Average Rate (λ)" 
            value={lambdaStr} 
            onChangeText={setLambdaStr} 
            error={!isNaN(lambda) && lambda <= 0 ? "Must be > 0" : undefined}
          />
          <Input 
            label="Number of Occurrences (x)" 
            value={xVal} 
            onChangeText={setXVal} 
            error={!isNaN(x) && x < 0 ? "Must be >= 0" : undefined}
          />

          <SegmentedControl 
            options={MODES} 
            selectedIndex={modeIdx} 
            onChange={setModeIdx} 
          />
        </View>

        {isValid && (
          <StatBox stats={getPoissonStats(lambda)} />
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
            {chart}
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

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="Poisson Distribution">
        <Text style={styles.modalHeading}>Formula (PMF)</Text>
        <InteractiveFormula 
          formulaLatex={formulas.poisson.latex}
          tokensMetadata={formulas.poisson.tokens}
        />
        
        <Text style={styles.modalHeading}>Description</Text>
        <Text style={styles.modalText}>
          Expresses the probability of a given number of events occurring in a fixed interval of time or space if these events occur with a known constant mean rate and independently of the time since the last event.
        </Text>
        
        <Text style={styles.modalHeading}>Key Properties</Text>
        <Text style={styles.modalListItem}>• Discrete probability distribution</Text>
        <Text style={styles.modalListItem}>• Mean (E[X]) = λ</Text>
        <Text style={styles.modalListItem}>• Variance (Var(X)) = λ</Text>
        <Text style={styles.modalListItem}>• Often used for rare events (e.g. typos on a page, calls to a call center).</Text>
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
