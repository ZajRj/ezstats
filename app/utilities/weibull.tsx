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
import { calculateWeibullProb, generateWeibullSamples, getWeibullStats, generateWeibullChartPaths } from '../../src/utils/calculations/weibull';
import { generateContinuousFrequencyTable } from '../../src/utils/calculations/frequency';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { useHistoryStore } from '../../src/store/historyStore';
import { Ionicons } from '@expo/vector-icons';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';

const MODES = ['P(X ≤ x)', 'P(X ≥ x)'];

export default function WeibullDistribution() {
  const [scaleStr, setScaleStr] = useState('1');
  const [shapeStr, setShapeStr] = useState('1.5');
  const [xVal, setXVal] = useState('1');
  const [modeIdx, setModeIdx] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  React.useEffect(() => {
    import('../../src/db/database').then(({ recordActivity }) => {
      recordActivity('Weibull Calculator', 'TOOL', '/utilities/weibull');
    });
  }, []);

  const [sampleSizeStr, setSampleSizeStr] = useState('100');
  const [freqData, setFreqData] = useState<FreqDataRow[] | null>(null);
  const [simData, setSimData] = useState<any[] | null>(null);

  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);

  const scale = parseFloat(scaleStr);
  const shape = parseFloat(shapeStr);
  const x = parseFloat(xVal);

  const isValid = !isNaN(scale) && scale > 0 && !isNaN(shape) && shape > 0 && !isNaN(x) && x >= 0;

  const result = useMemo(() => {
    if (!isValid) return null;
    return calculateWeibullProb(x, scale, shape, modeIdx);
  }, [scale, shape, x, modeIdx, isValid]);

  const handleSave = () => {
    if (!isValid || result === null) return;
    addHistoryItem({
      type: 'Weibull',
      parameters: { 'λ': scale, 'k': shape, x },
      mode: MODES[modeIdx],
      result,
    });
    Alert.alert('Saved!', 'Calculation added to History.');
  };

  const runSimulation = () => {
    if (!isValid) return;
    const N = parseInt(sampleSizeStr, 10);
    if (isNaN(N) || N <= 0) return;

    const { samples, tableData } = generateWeibullSamples(scale, shape, N);
    const tableDataFreq = generateContinuousFrequencyTable(samples);
    setFreqData(tableDataFreq);
    setSimData(tableData);
  };

  const { curvePath, shadedPath, maxX } = useMemo(() => {
    return generateWeibullChartPaths(scale, shape, x, modeIdx, isValid);
  }, [scale, shape, x, modeIdx, isValid]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen options={{ 
        title: "Weibull",
        headerRight: () => (
          <TouchableOpacity onPress={() => setInfoVisible(true)} style={{ marginRight: 16 }}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.card}>
          <Input 
            label="Scale (λ)" 
            value={scaleStr} 
            onChangeText={setScaleStr} 
            error={!isNaN(scale) && scale <= 0 ? "Scale must be > 0" : undefined}
          />
          <Input 
            label="Shape (k)" 
            value={shapeStr} 
            onChangeText={setShapeStr} 
            error={!isNaN(shape) && shape <= 0 ? "Shape must be > 0" : undefined}
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
          <StatBox stats={getWeibullStats(scale, shape)} />
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
              <Table>
                <TableHead>
                  <TableCell isHeader width={60}>I</TableCell>
                  <TableCell isHeader width={100}>R_i U(0,1)</TableCell>
                  <TableCell isHeader width={220}>X_i = λ * (-ln(1 - R_i))^(1/k)</TableCell>
                </TableHead>
                {simData.map((row) => (
                  <TableRow key={row.i}>
                    <TableCell width={60}>{row.i}</TableCell>
                    <TableCell width={100}>{row.u.toFixed(4)}</TableCell>
                    <TableCell width={220}>{row.x.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </Table>
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

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="Weibull Distribution">
        <Text style={styles.modalHeading}>Formula (PDF)</Text>
        <InteractiveFormula 
          formulaLatex={formulas.weibull.latex}
          tokensMetadata={formulas.weibull.tokens}
        />
        
        <Text style={styles.modalHeading}>Description</Text>
        <Text style={styles.modalText}>
          The Weibull distribution is a continuous probability distribution heavily used in reliability engineering, survival analysis, and extreme value theory.
        </Text>
        
        <Text style={styles.modalHeading}>Key Properties</Text>
        <Text style={styles.modalListItem}>• Continuous distribution defined for x ≥ 0</Text>
        <Text style={styles.modalListItem}>• Shape (k) alters the behavior (k=1 is exponential, k \u003C 1 is high infant mortality)</Text>
        <Text style={styles.modalListItem}>• No closed form Moment Generating Function</Text>
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
