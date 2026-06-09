import Text from '../../src/components/ui/Text';
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
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
import { calculateBinomialProb, generateBinomialSamples, getBinomialStats, generateBinomialChartPoints } from '../../src/utils/calculations/binomial';
import { generateDiscreteFrequencyTable } from '../../src/utils/calculations/frequency';
import { useHistoryStore } from '../../src/store/historyStore';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';

const MODES = ['P(X = x)', 'P(X ≤ x)', 'P(X ≥ x)'];

export default function BinomialDistribution() {
  const [trials, setTrials] = useState('10');
  const [probSuccess, setProbSuccess] = useState('0.5');
  const [xVal, setXVal] = useState('5');
  const [modeIdx, setModeIdx] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  React.useEffect(() => {
    import('../../src/db/database').then(({ recordActivity }) => {
      recordActivity('Binomial Calculator', 'TOOL', '/utilities/binomial');
    });
  }, []);

  const [sampleSizeStr, setSampleSizeStr] = useState('100');
  const [freqData, setFreqData] = useState<FreqDataRow[] | null>(null);
  const [simData, setSimData] = useState<any[] | null>(null);

  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);

  const n = parseInt(trials, 10);
  const p = parseFloat(probSuccess);
  const x = parseInt(xVal, 10);

  const isValid = !isNaN(n) && n > 0 && !isNaN(p) && p >= 0 && p <= 1 && !isNaN(x) && x >= 0 && x <= n;

  const result = useMemo(() => {
    if (!isValid) return null;
    return calculateBinomialProb(x, n, p, modeIdx);
  }, [n, p, x, modeIdx, isValid]);

  const handleSave = () => {
    if (!isValid || result === null) return;
    addHistoryItem({
      type: 'Binomial',
      parameters: { n, p, x },
      mode: MODES[modeIdx],
      result,
    });
    Alert.alert('Saved!', 'Calculation added to History.');
  };

  const runSimulation = () => {
    if (!isValid) return;
    const N = parseInt(sampleSizeStr, 10);
    if (isNaN(N) || N <= 0) return;
    
    const { samples, tableData } = generateBinomialSamples(n, p, N);
    const tableDataFreq = generateDiscreteFrequencyTable(samples);
      
    setFreqData(tableDataFreq);
    setSimData(tableData);
  };

  const chart = useMemo(() => {
    const { points, displayN } = generateBinomialChartPoints(n, p, x, modeIdx, isValid);

    const labels = points.map(pt => pt.val.toString());
    const filteredLabels = labels.map((l, i) => (points.length <= 10 || i % Math.ceil(points.length/5) === 0 || i === displayN) ? l : '');

    const data = {
      labels: filteredLabels,
      datasets: [
        {
          data: points.map(pt => pt.pdf),
          colors: points.map(pt => 
            pt.isHighlighted 
              ? (opacity = 1) => colors.primary 
              : (opacity = 1) => colors.progressBg
          )
        }
      ]
    };

    return (
      <BarChart
        data={data}
        width={300}
        height={170}
        yAxisLabel=""
        yAxisSuffix=""
        withCustomBarColorFromData={true}
        flatColor={true}
        fromZero={true}
        withInnerLines={false}
        showBarTops={false}
        chartConfig={{
          backgroundColor: colors.card,
          backgroundGradientFrom: colors.card,
          backgroundGradientTo: colors.card,
          decimalPlaces: 2,
          color: (opacity = 1) => colors.textSecondary,
          labelColor: (opacity = 1) => colors.textSecondary,
          barPercentage: 0.6,
        }}
        style={{
          paddingRight: 0,
          marginLeft: -20,
        }}
      />
    );
  }, [n, p, x, modeIdx, isValid]);

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
            label="Number of Trials (n)" 
            value={trials} 
            onChangeText={setTrials} 
            error={!isNaN(n) && n <= 0 ? "Must be > 0" : undefined}
          />
          <Input 
            label="Probability of Success (p)" 
            value={probSuccess} 
            onChangeText={setProbSuccess} 
            error={!isNaN(p) && (p < 0 || p > 1) ? "Must be between 0 and 1" : undefined}
          />
          <Input 
            label="Number of Successes (x)" 
            value={xVal} 
            onChangeText={setXVal} 
            error={!isNaN(x) && (x < 0 || x > n) ? `Must be between 0 and ${n || 'n'}` : undefined}
          />

          <SegmentedControl 
            options={MODES} 
            selectedIndex={modeIdx} 
            onChange={setModeIdx} 
          />
        </View>

        {isValid && (
          <StatBox stats={getBinomialStats(n, p)} />
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
          {simData && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8, color: colors.textSecondary }}>SIMULATION TABLE {parseInt(sampleSizeStr, 10) > 50 ? '(First 50)' : ''}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ backgroundColor: '#111827', borderRadius: 8, padding: 8 }}>
                <View>
                  <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#374151', paddingBottom: 8, marginBottom: 8 }}>
                    <Text style={{ width: 40, color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>I</Text>
                    <Text style={{ width: 140, color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>U(0,1) Sequence</Text>
                    <Text style={{ width: 120, color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>X_i (Successes)</Text>
                  </View>
                  {simData.map((row) => (
                    <View key={row.i} style={{ flexDirection: 'row', paddingVertical: 4 }}>
                      <Text style={{ width: 40, color: '#60A5FA', fontSize: 12, textAlign: 'center' }}>{row.i}</Text>
                      <Text style={{ width: 140, color: '#FBBF24', fontSize: 12, textAlign: 'center' }}>{row.u_sequence.map((u: number) => u.toFixed(2)).join(', ')}{row.u_sequence.length === 5 ? '...' : ''}</Text>
                      <Text style={{ width: 120, color: '#34D399', fontSize: 12, textAlign: 'center', fontWeight: 'bold' }}>{row.x}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {freqData && (
            <View style={{ marginTop: 16 }}>
              <FrequencyTable data={freqData} />
              <Histogram data={freqData} />
            </View>
          )}
        </View>

      </ScrollView>

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="Binomial Distribution">
        <Text style={styles.modalHeading}>Formula (PMF)</Text>
        <InteractiveFormula 
          formulaLatex={formulas.binomial.latex}
          tokensMetadata={formulas.binomial.tokens}
        />
        
        <Text style={styles.modalHeading}>Description</Text>
        <Text style={styles.modalText}>
          The binomial distribution represents the probability of a specific number of successes in a fixed number of independent yes/no experiments, each with the same probability of success.
        </Text>
        
        <Text style={styles.modalHeading}>Key Properties</Text>
        <Text style={styles.modalListItem}>• Discrete probability distribution</Text>
        <Text style={styles.modalListItem}>• Fixed number of trials (n)</Text>
        <Text style={styles.modalListItem}>• Independent trials</Text>
        <Text style={styles.modalListItem}>• Mean (E[X]) = np</Text>
        <Text style={styles.modalListItem}>• Variance (Var(X)) = np(1-p)</Text>
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
