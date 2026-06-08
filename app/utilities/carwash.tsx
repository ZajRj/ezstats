import Text from '../../src/components/ui/Text';
import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import Input from '../../src/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { Stage, DistributionType, runCarWashSimulation, calculateMetrics } from '../../src/utils/calculations/simulation';
import { generateContinuousFrequencyTable } from '../../src/utils/calculations/frequency';
import FrequencyTable, { FreqDataRow } from '../../src/components/ui/FrequencyTable';
import Histogram from '../../src/components/ui/Histogram';

const screenWidth = Dimensions.get("window").width;

export default function CarWashSimulation() {
  const [kAutos, setKAutos] = useState('10');
  const [nHoras, setNHoras] = useState('8');
  
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', name: 'Limpieza', type: 'Normal', params: { mean: 10, stdDev: 2 } },
    { id: '2', name: 'Lavado', type: 'Exponential', params: { mean: 12 } },
    { id: '3', name: 'Secado', type: 'Poisson', params: { lambda: 10 } }
  ]);

  const [results, setResults] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [freqData, setFreqData] = useState<FreqDataRow[] | null>(null);

  const addStage = () => {
    const newId = Date.now().toString();
    setStages([...stages, {
      id: newId,
      name: `Etapa ${stages.length + 1}`,
      type: 'Normal',
      params: { mean: 10, stdDev: 2 }
    }]);
  };

  const removeStage = (id: string) => {
    if (stages.length <= 1) return;
    setStages(stages.filter(s => s.id !== id));
  };

  const updateStage = (id: string, updates: Partial<Stage>) => {
    setStages(stages.map(s => {
      if (s.id === id) {
        // Handle type change defaults
        if (updates.type && updates.type !== s.type) {
          if (updates.type === 'Normal') updates.params = { mean: 10, stdDev: 2 };
          if (updates.type === 'Exponential') updates.params = { mean: 12 };
          if (updates.type === 'Poisson') updates.params = { lambda: 10 };
        }
        return { ...s, ...updates };
      }
      return s;
    }));
  };

  const updateStageParam = (id: string, param: string, value: string) => {
    const num = parseFloat(value);
    setStages(stages.map(s => {
      if (s.id === id) {
        return { ...s, params: { ...s.params, [param]: isNaN(num) ? 0 : num } };
      }
      return s;
    }));
  };

  const runSimulation = () => {
    const k = parseInt(kAutos);
    const n = parseFloat(nHoras);
    if (isNaN(k) || k < 1 || k > 500) {
      Alert.alert('Error', 'K debe estar entre 1 y 500');
      return;
    }
    if (isNaN(n) || n <= 0) {
      Alert.alert('Error', 'N horas debe ser mayor a 0');
      return;
    }

    const simResults = runCarWashSimulation(k, stages);
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
    runSimulation();
    import('../../src/db/database').then(({ recordActivity }) => {
      recordActivity('Car Wash Simulation', 'TOOL', '/utilities/carwash');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCSV = () => {
    if (results.length === 0) return;
    
    const stageNames = stages.map(s => s.name);
    const header = ['Auto', ...stageNames, 'Tiempo Total (min)'].join(',');
    
    const rows = results.map(r => {
      const times = stages.map(s => r.stageTimes[s.id].toFixed(2));
      return [r.id, ...times, r.totalProcessingTime.toFixed(2), r.exitTime.toFixed(2)].join(',');
    });
    
    const csvStr = [header, ...rows].join('\n');
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'simulacion_autolavado.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Exportar CSV', 'La exportación nativa requiere expo-file-system. Copia este contenido:\n\n' + csvStr.substring(0, 500) + '...');
    }
  };

  const chartData = useMemo(() => {
    if (results.length === 0) return null;
    // For bar chart, limit to 50 cars max so it's readable
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
      <Stack.Screen options={{ title: 'Simulación Autolavado' }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parámetros Generales</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Número de Autos (K)" value={kAutos} onChangeText={setKAutos} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Horas de Operación (N)" value={nHoras} onChangeText={setNHoras} keyboardType="numeric" />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.stageHeader}>
            <Text style={styles.cardTitle}>Etapas del Proceso</Text>
            <TouchableOpacity style={styles.addBtn} onPress={addStage}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.addBtnText}>Agregar Etapa</Text>
            </TouchableOpacity>
          </View>

          {stages.map((stage, index) => (
            <View key={stage.id} style={styles.stageCard}>
              <View style={styles.stageTitleRow}>
                <Text style={styles.stageIndex}>Etapa {index + 1}</Text>
                <TouchableOpacity 
                  style={[styles.removeBtn, stages.length <= 1 && { opacity: 0.5 }]} 
                  onPress={() => removeStage(stage.id)}
                  disabled={stages.length <= 1}
                >
                  <Ionicons name="close" size={16} color={colors.error} />
                  <Text style={styles.removeBtnText}>Quitar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Input label="Nombre" value={stage.name} onChangeText={(v) => updateStage(stage.id, { name: v })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Distribución</Text>
                  {/* Simplistic custom picker using TouchableOpacities for web compat without external libs */}
                  <View style={styles.pickerRow}>
                    {['Normal', 'Exponential', 'Poisson'].map(type => (
                      <TouchableOpacity 
                        key={type} 
                        style={[styles.pickerOpt, stage.type === type && styles.pickerOptActive]}
                        onPress={() => updateStage(stage.id, { type: type as DistributionType })}
                      >
                        <Text style={[styles.pickerOptText, stage.type === type && styles.pickerOptTextActive]}>
                          {type.substring(0,4)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                {stage.type === 'Normal' && (
                  <>
                    <View style={{ flex: 1 }}>
                      <Input label="Media (μ)" value={String(stage.params.mean || '')} onChangeText={(v) => updateStageParam(stage.id, 'mean', v)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label="Desviación (σ)" value={String(stage.params.stdDev || '')} onChangeText={(v) => updateStageParam(stage.id, 'stdDev', v)} />
                    </View>
                  </>
                )}
                {stage.type === 'Exponential' && (
                  <View style={{ flex: 1 }}>
                    <Input label="Media (1/λ)" value={String(stage.params.mean || '')} onChangeText={(v) => updateStageParam(stage.id, 'mean', v)} />
                  </View>
                )}
                {stage.type === 'Poisson' && (
                  <View style={{ flex: 1 }}>
                    <Input label="Lambda (λ)" value={String(stage.params.lambda || '')} onChangeText={(v) => updateStageParam(stage.id, 'lambda', v)} />
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.simBtn} onPress={runSimulation}>
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.simBtnText}>Simular</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={exportCSV}>
            <Ionicons name="download" size={20} color={colors.primary} />
            <Text style={styles.exportBtnText}>Exportar CSV</Text>
          </TouchableOpacity>
        </View>

        {metrics && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Métricas (Tiempo Total)</Text>
            
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorLabel}>Autos atendidos en {nHoras} horas</Text>
              <Text style={styles.indicatorValue}>{metrics.attendedInTime} / {kAutos}</Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Promedio</Text>
                <Text style={styles.gridValue}>{metrics.mean.toFixed(2)}m</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Desv. Estándar</Text>
                <Text style={styles.gridValue}>{metrics.stdDev.toFixed(2)}m</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Mínimo</Text>
                <Text style={styles.gridValue}>{metrics.min.toFixed(2)}m</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Máximo</Text>
                <Text style={styles.gridValue}>{metrics.max.toFixed(2)}m</Text>
              </View>
            </View>
          </View>
        )}

        {results.length > 0 && chartData && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tiempo Total por Auto {results.length > 50 ? '(Primeros 50)' : ''}</Text>
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
            <Text style={styles.sectionTitle}>Distribución de Frecuencias</Text>
            <Histogram data={freqData} />
            <View style={{marginTop: 16}}>
              <FrequencyTable data={freqData} />
            </View>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tabla de Resultados</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: 60 }]}>Auto</Text>
                  {stages.map(s => (
                    <Text key={s.id} style={[styles.tableCell, styles.tableHeaderCell]}>{s.name}</Text>
                  ))}
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { fontWeight: 'bold' }]}>Procesamiento</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { fontWeight: 'bold', width: 80 }]}>Salida Sist.</Text>
                </View>
                {results.slice(0, 100).map((r, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 60 }]}>{r.id}</Text>
                    {stages.map(s => (
                      <Text key={s.id} style={styles.tableCell}>{r.stageTimes[s.id].toFixed(2)}</Text>
                    ))}
                    <Text style={[styles.tableCell, { fontWeight: 'bold', color: colors.primary }]}>{r.totalProcessingTime.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, { fontWeight: 'bold', width: 80 }]}>{r.exitTime.toFixed(2)}</Text>
                  </View>
                ))}
                {results.length > 100 && (
                  <Text style={styles.limitText}>Mostrando los primeros 100 resultados. Exporta CSV para ver todos.</Text>
                )}
              </View>
            </ScrollView>
          </View>
        )}

      </ScrollView>
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
    marginBottom: 16,
  },
  pickerOpt: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
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
  }
});
