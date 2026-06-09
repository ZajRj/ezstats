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
import { calculateExponentialProb, generateExponentialSamples, getExponentialStats, generateExponentialChartPaths } from '../../src/utils/calculations/exponential';
import { generateContinuousFrequencyTable } from '../../src/utils/calculations/frequency';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { useHistoryStore } from '../../src/store/historyStore';
import { Ionicons } from '@expo/vector-icons';

const MODES = ['P(X ≤ x)', 'P(X ≥ x)'];

export default function ExponentialDistribution() {
  const [lambdaStr, setLambdaStr] = useState('1');
  const [xVal, setXVal] = useState('1');
  const [modeIdx, setModeIdx] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  React.useEffect(() => {
    import('../../src/db/database').then(({ recordActivity }) => {
      recordActivity('Exponential Calculator', 'TOOL', '/utilities/exponential');
    });
  }, []);

  const [sampleSizeStr, setSampleSizeStr] = useState('100');
  const [freqData, setFreqData] = useState<FreqDataRow[] | null>(null);
  const [simData, setSimData] = useState<any[] | null>(null);

  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);

  const lambda = parseFloat(lambdaStr);
  const x = parseFloat(xVal);

  const isValid = !isNaN(lambda) && lambda > 0 && !isNaN(x) && x >= 0;

  const result = useMemo(() => {
    if (!isValid) return null;
    return calculateExponentialProb(x, lambda, modeIdx);
  }, [lambda, x, modeIdx, isValid]);

  const handleSave = () => {
    if (!isValid || result === null) return;
    addHistoryItem({
      type: 'Exponential',
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

    const { samples, tableData } = generateExponentialSamples(lambda, N);
    const tbl = generateContinuousFrequencyTable(samples);
    setFreqData(tbl);
    setSimData(tableData);
  };

  const { curvePath, shadedPath, maxX } = useMemo(() => {
    return generateExponentialChartPaths(lambda, x, modeIdx, isValid);
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
            label="Rate Parameter (λ)" 
            value={lambdaStr} 
            onChangeText={setLambdaStr} 
            error={!isNaN(lambda) && lambda <= 0 ? "Rate must be > 0" : undefined}
          />
          <Input 
            label="Value (x)" 
            value={xVal} 
            onChangeText={setXVal} 
            error={!isNaN(x) && x < 0 ? "Value must be ≥ 0" : undefined}
          />

          <SegmentedControl 
            options={MODES} 
            selectedIndex={modeIdx} 
            onChange={setModeIdx} 
          />
        </View>

        {isValid && (
          <StatBox stats={getExponentialStats(lambda)} />
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
              
              <Line x1="0" y1="145" x2="0" y2="154" stroke={colors.textSecondary} strokeWidth="1" />
              <SvgText x="0" y="166" fontSize="10" fill={colors.textSecondary} textAnchor="start">0</SvgText>
              
              <Line x1="300" y1="145" x2="300" y2="154" stroke={colors.textSecondary} strokeWidth="1" />
              <SvgText x="300" y="166" fontSize="10" fill={colors.textSecondary} textAnchor="end">{maxX.toFixed(2)}</SvgText>
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
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ backgroundColor: '#111827', borderRadius: 8, padding: 8 }}>
                <View>
                  <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#374151', paddingBottom: 8, marginBottom: 8 }}>
                    <Text style={{ width: 40, color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>I</Text>
                    <Text style={{ width: 100, color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>R_i U(0,1)</Text>
                    <Text style={{ width: 150, color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>X_i = -(1/λ) * ln(1 - R_i)</Text>
                  </View>
                  {simData.map((row) => (
                    <View key={row.i} style={{ flexDirection: 'row', paddingVertical: 4 }}>
                      <Text style={{ width: 40, color: '#60A5FA', fontSize: 12, textAlign: 'center' }}>{row.i}</Text>
                      <Text style={{ width: 100, color: '#FBBF24', fontSize: 12, textAlign: 'center' }}>{row.u.toFixed(4)}</Text>
                      <Text style={{ width: 150, color: '#34D399', fontSize: 12, textAlign: 'center', fontWeight: 'bold' }}>{row.x.toFixed(4)}</Text>
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

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="Exponential Distribution">
        <Text style={styles.modalHeading}>Formula (PDF)</Text>
        <InteractiveFormula 
          formulaLatex={formulas.exponential.latex}
          tokensMetadata={formulas.exponential.tokens}
        />
        
        <Text style={styles.modalHeading}>Description</Text>
        <Text style={styles.modalText}>
          The exponential distribution is the probability distribution of the time between events in a Poisson point process. It describes processes where events occur continuously and independently at a constant average rate.
        </Text>
        
        <Text style={styles.modalHeading}>Key Properties</Text>
        <Text style={styles.modalListItem}>• Continuous probability distribution</Text>
        <Text style={styles.modalListItem}>• Memoryless property (the past has no bearing on its future behavior)</Text>
        <Text style={styles.modalListItem}>• Mean (E[X]) = 1 / λ</Text>
        <Text style={styles.modalListItem}>• Variance (Var(X)) = 1 / λ²</Text>
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
