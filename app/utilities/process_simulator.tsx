import Text from '../../src/components/ui/Text';
import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import Input from '../../src/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { Stage, DistributionType, runProcessSimulation, calculateMetrics, generatePoisson } from '../../src/utils/calculations/simulation';
import { generateContinuousFrequencyTable } from '../../src/utils/calculations/frequency';
import FrequencyTable, { FreqDataRow } from '../../src/components/ui/FrequencyTable';
import Histogram from '../../src/components/ui/Histogram';
import BottomSheetModal from '../../src/components/ui/BottomSheetModal';

const screenWidth = Dimensions.get("window").width;

export default function ProcessSimulation() {
  const [kItems, setKItems] = useState('10');
  const [nHoras, setNHoras] = useState('8');
  const [usePoissonArrivals, setUsePoissonArrivals] = useState(false);
  const [poissonLambda, setPoissonLambda] = useState('10');
  const [actualK, setActualK] = useState<number | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', name: 'Stage 1', type: 'Normal', params: { mean: 10, stdDev: 2 } },
    { id: '2', name: 'Stage 2', type: 'Exponential', params: { mean: 12 } },
    { id: '3', name: 'Stage 3', type: 'Uniform', params: { min: 5, max: 15 } }
  ]);

  const [results, setResults] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [freqData, setFreqData] = useState<FreqDataRow[] | null>(null);

  const clearResults = () => {
    setResults([]);
    setMetrics(null);
    setFreqData(null);
    setActualK(null);
  };

  const addStage = () => {
    clearResults();
    const newId = Date.now().toString();
    setStages([...stages, {
      id: newId,
      name: `Stage ${stages.length + 1}`,
      type: 'Normal',
      params: { mean: 10, stdDev: 2 }
    }]);
  };

  const removeStage = (id: string) => {
    if (stages.length <= 1) return;
    clearResults();
    setStages(stages.filter(s => s.id !== id));
  };

  const updateStage = (id: string, updates: Partial<Stage>) => {
    clearResults();
    setStages(stages.map(s => {
      if (s.id === id) {
        if (updates.type && updates.type !== s.type) {
          if (updates.type === 'Normal') updates.params = { mean: 10, stdDev: 2 };
          if (updates.type === 'Exponential') updates.params = { mean: 12 };
          if (updates.type === 'Poisson') updates.params = { lambda: 10 };
          if (updates.type === 'Uniform') updates.params = { min: 5, max: 15 };
          if (updates.type === 'Constant') updates.params = { value: 10 };
          if (updates.type === 'Log-Normal') updates.params = { mu: 2, sigma: 0.5 };
        }
        return { ...s, ...updates };
      }
      return s;
    }));
  };

  const updateStageParam = (id: string, param: string, value: string) => {
    clearResults();
    const num = parseFloat(value);
    setStages(stages.map(s => {
      if (s.id === id) {
        return { ...s, params: { ...s.params, [param]: isNaN(num) ? 0 : num } };
      }
      return s;
    }));
  };

  const runSimulation = () => {
    let k = parseInt(kItems);
    if (usePoissonArrivals) {
      const lambda = parseFloat(poissonLambda);
      k = generatePoisson(lambda);
      setActualK(k);
    } else {
      setActualK(null);
      if (isNaN(k) || k < 1 || k > 500) {
        Alert.alert('Error', 'K must be between 1 and 500');
        return;
      }
    }
    
    const n = parseFloat(nHoras);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Error', 'N hours must be greater than 0');
      return;
    }

    const simResults = runProcessSimulation(k, stages);
    setResults(simResults);
    
    const mets = calculateMetrics(simResults, n);
    setMetrics(mets);

    const totalTimes = simResults.map(r => r.totalProcessingTime);
    if (totalTimes.length > 1) {
      const tableData = generateContinuousFrequencyTable(totalTimes);
      setFreqData(tableData);
    } else {
      setFreqData(null);
    }
  };

  useEffect(() => {
    import('../../src/db/database').then(({ recordActivity }) => {
      recordActivity('Process Simulator', 'TOOL', '/utilities/process_simulator');
    });
  }, []);

  const exportCSV = () => {
    if (results.length === 0) return;
    
    const stageNames = stages.map(s => s.name);
    const header = ['Item', ...stageNames, 'Total Time (min)'].join(',');
    
    const rows = results.map(r => {
      const times = stages.map(s => (r.stageTimes[s.id] ?? 0).toFixed(2));
      return [r.id, ...times, r.totalProcessingTime.toFixed(2), r.exitTime.toFixed(2)].join(',');
    });
    
    const csvStr = [header, ...rows].join('\n');
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'process_simulation.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Export CSV', 'Native export requires expo-file-system. Copy this:\n\n' + csvStr.substring(0, 500) + '...');
    }
  };

  const chartData = useMemo(() => {
    if (results.length === 0) return null;
    const displayResults = results.slice(0, 50);
    return {
      labels: displayResults.map(r => r.id.toString()),
      datasets: [
        {
          data: displayResults.map(r => r.totalProcessingTime)
        }
      ]
    };
  }, [results]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen options={{ 
        title: 'Process Simulator',
        headerRight: () => (
          <TouchableOpacity onPress={() => setInfoVisible(true)} style={{ marginRight: 16 }}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Global Parameters</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.toggleBtn, usePoissonArrivals && styles.toggleBtnActive]}
              onPress={() => { setUsePoissonArrivals(!usePoissonArrivals); clearResults(); }}
            >
              <Text style={[styles.toggleBtnText, usePoissonArrivals && styles.toggleBtnTextActive]}>
                {usePoissonArrivals ? 'Poisson Arrivals Enabled' : 'Use Poisson Arrivals'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            {!usePoissonArrivals ? (
              <View style={{ flex: 1 }}>
                <Input label="Number of Items (K)" value={kItems} onChangeText={(v) => { setKItems(v); clearResults(); }} keyboardType="numeric" />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Input label="Arrival Rate (λ)" value={poissonLambda} onChangeText={(v) => { setPoissonLambda(v); clearResults(); }} keyboardType="numeric" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Input label="Available Hours (N)" value={nHoras} onChangeText={(v) => { setNHoras(v); clearResults(); }} keyboardType="numeric" />
            </View>
          </View>
        </View>

        {actualK !== null && (
          <View style={[styles.card, { backgroundColor: colors.primaryLight, alignItems: 'center' }]}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Items generated via Poisson: {actualK}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.stageHeader}>
            <Text style={styles.cardTitle}>Process Stages</Text>
            <TouchableOpacity style={styles.addBtn} onPress={addStage}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.addBtnText}>Add Stage</Text>
            </TouchableOpacity>
          </View>

          {stages.map((stage, index) => (
            <View key={stage.id} style={styles.stageCard}>
              <View style={styles.stageTitleRow}>
                <Text style={styles.stageIndex}>Stage {index + 1}</Text>
                <TouchableOpacity 
                  style={[styles.removeBtn, stages.length <= 1 && { opacity: 0.5 }]} 
                  onPress={() => removeStage(stage.id)}
                  disabled={stages.length <= 1}
                >
                  <Ionicons name="close" size={16} color={colors.error} />
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Input label="Name" value={stage.name} onChangeText={(v) => updateStage(stage.id, { name: v })} />
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Distribution</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={styles.pickerRow}>
                      {['Normal', 'Exponential', 'Poisson', 'Uniform', 'Constant', 'Log-Normal'].map(type => (
                        <TouchableOpacity 
                          key={type} 
                          style={[styles.pickerOpt, stage.type === type && styles.pickerOptActive]}
                          onPress={() => updateStage(stage.id, { type: type as DistributionType })}
                        >
                          <Text style={[styles.pickerOptText, stage.type === type && styles.pickerOptTextActive]}>
                            {type === 'Exponential' ? 'Exp' : type === 'Log-Normal' ? 'LogNorm' : type.substring(0,6)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View style={styles.row}>
                {stage.type === 'Normal' && (
                  <>
                    <View style={{ flex: 1 }}>
                      <Input label="Mean (μ)" value={String(stage.params.mean || '')} onChangeText={(v) => updateStageParam(stage.id, 'mean', v)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label="Std Dev (σ)" value={String(stage.params.stdDev || '')} onChangeText={(v) => updateStageParam(stage.id, 'stdDev', v)} />
                    </View>
                  </>
                )}
                {stage.type === 'Exponential' && (
                  <View style={{ flex: 1 }}>
                    <Input label="Mean (1/λ)" value={String(stage.params.mean || '')} onChangeText={(v) => updateStageParam(stage.id, 'mean', v)} />
                  </View>
                )}
                {stage.type === 'Poisson' && (
                  <View style={{ flex: 1 }}>
                    <Input label="Lambda (λ)" value={String(stage.params.lambda || '')} onChangeText={(v) => updateStageParam(stage.id, 'lambda', v)} />
                  </View>
                )}
                {stage.type === 'Uniform' && (
                  <>
                    <View style={{ flex: 1 }}>
                      <Input label="Min" value={String(stage.params.min || '')} onChangeText={(v) => updateStageParam(stage.id, 'min', v)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label="Max" value={String(stage.params.max || '')} onChangeText={(v) => updateStageParam(stage.id, 'max', v)} />
                    </View>
                  </>
                )}
                {stage.type === 'Constant' && (
                  <View style={{ flex: 1 }}>
                    <Input label="Value" value={String(stage.params.value || '')} onChangeText={(v) => updateStageParam(stage.id, 'value', v)} />
                  </View>
                )}
                {stage.type === 'Log-Normal' && (
                  <>
                    <View style={{ flex: 1 }}>
                      <Input label="Mu (μ)" value={String(stage.params.mu || '')} onChangeText={(v) => updateStageParam(stage.id, 'mu', v)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label="Sigma (σ)" value={String(stage.params.sigma || '')} onChangeText={(v) => updateStageParam(stage.id, 'sigma', v)} />
                    </View>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.simBtn} onPress={runSimulation}>
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.simBtnText}>Simulate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, results.length === 0 && { opacity: 0.5 }]} onPress={exportCSV} disabled={results.length === 0}>
            <Ionicons name="download" size={20} color={colors.primary} />
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {metrics && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Metrics (Total Time)</Text>
            
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorLabel}>Items processed in {nHoras} hours</Text>
              <Text style={styles.indicatorValue}>{metrics.attendedInTime} / {actualK ?? kItems}</Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Average</Text>
                <Text style={styles.gridValue}>{metrics.mean.toFixed(2)}m</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Std Dev</Text>
                <Text style={styles.gridValue}>{metrics.stdDev.toFixed(2)}m</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Minimum</Text>
                <Text style={styles.gridValue}>{metrics.min.toFixed(2)}m</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Maximum</Text>
                <Text style={styles.gridValue}>{metrics.max.toFixed(2)}m</Text>
              </View>
            </View>
          </View>
        )}

        {results.length > 0 && chartData && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Total Time per Item {results.length > 50 ? '(First 50)' : ''}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={chartData}
                width={Math.max(screenWidth - 64, chartData.labels.length * 40)}
                height={220}
                yAxisLabel=""
                yAxisSuffix="m"
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 1,
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.textSecondary,
                  barPercentage: 0.5,
                }}
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            </ScrollView>
          </View>
        )}

        {freqData && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Frequency Distribution</Text>
            <Histogram data={freqData} />
            <View style={{marginTop: 16}}>
              <FrequencyTable data={freqData} />
            </View>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Results Table</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: 60 }]}>Item</Text>
                  {stages.map(s => (
                    <Text key={s.id} style={[styles.tableCell, styles.tableHeaderCell]}>{s.name}</Text>
                  ))}
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { fontWeight: 'bold' }]}>Total Processing</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { fontWeight: 'bold', width: 80 }]}>System Exit</Text>
                </View>
                {results.slice(0, 100).map((r, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 60 }]}>{r.id}</Text>
                    {stages.map(s => (
                      <Text key={s.id} style={styles.tableCell}>{(r.stageTimes[s.id] ?? 0).toFixed(2)}</Text>
                    ))}
                    <Text style={[styles.tableCell, { fontWeight: 'bold', color: colors.primary }]}>{r.totalProcessingTime.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, { fontWeight: 'bold', width: 80 }]}>{r.exitTime.toFixed(2)}</Text>
                  </View>
                ))}
                {results.length > 100 && (
                  <Text style={styles.limitText}>Showing first 100 results. Export CSV to view all.</Text>
                )}
              </View>
            </ScrollView>
          </View>
        )}

      </ScrollView>

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="Random Number Generation">
        <Text style={styles.modalHeading}>Methods Used</Text>
        
        <Text style={styles.modalSubheading}>Normal & Log-Normal</Text>
        <Text style={styles.modalText}>
          Uses the Box-Muller transform to generate standard normally distributed random numbers from uniformly distributed random numbers, which are then scaled by the mean and standard deviation.
        </Text>
        
        <Text style={styles.modalSubheading}>Exponential</Text>
        <Text style={styles.modalText}>
          Uses Inverse Transform Sampling. A uniform random number U is generated, and the formula x = -(1/λ) * ln(1 - U) is applied.
        </Text>

        <Text style={styles.modalSubheading}>Poisson</Text>
        <Text style={styles.modalText}>
          Uses Knuth's algorithm. It multiplies uniform random numbers together until their product is less than e^(-λ). The number of multiplications needed minus one is the generated sample.
        </Text>

        <Text style={styles.modalSubheading}>Uniform</Text>
        <Text style={styles.modalText}>
          Uses standard linear scaling: x = U * (max - min) + min, where U is a random number between 0 and 1.
        </Text>
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
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: colors.primary,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stageCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  stageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageIndex: {
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeBtnText: {
    color: colors.error,
    fontSize: 12,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pickerRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerOpt: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  pickerOptActive: {
    backgroundColor: colors.primaryLight,
  },
  pickerOptText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pickerOptTextActive: {
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  simBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  exportBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    gap: 16,
  },
  indicatorCard: {
    backgroundColor: colors.primaryLight,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  indicatorLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  indicatorValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  gridLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    width: 100,
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  limitText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  modalSubheading: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 4,
  },
  modalText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  }
});
