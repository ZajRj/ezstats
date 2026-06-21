import Text from '../../src/components/ui/Text';
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import BoxPlot from '../../src/components/ui/BoxPlot';
import { calculateDescriptiveStats } from '../../src/utils/calculations/descriptive';
import FrequencyTable from '../../src/components/ui/FrequencyTable';
import Histogram from '../../src/components/ui/Histogram';
import { generateContinuousFrequencyTable, generateDiscreteFrequencyTable } from '../../src/utils/calculations/frequency';
import { Ionicons } from '@expo/vector-icons';
import BottomSheetModal from '../../src/components/ui/BottomSheetModal';

export default function DescriptiveStatistics() {
  const [dataStr, setDataStr] = useState('');
  const [isPopulation, setIsPopulation] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const stats = useMemo(() => {
    return calculateDescriptiveStats(dataStr, isPopulation);
  }, [dataStr, isPopulation]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen options={{ 
        title: 'Descriptive Statistics',
        headerRight: () => (
          <TouchableOpacity onPress={() => setInfoVisible(true)} style={{ marginRight: 16 }}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, !isPopulation && styles.toggleBtnActive]} 
            onPress={() => setIsPopulation(false)}
          >
            <Text style={[styles.toggleBtnText, !isPopulation && styles.toggleBtnTextActive]}>Sample</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, isPopulation && styles.toggleBtnActive]} 
            onPress={() => setIsPopulation(true)}
          >
            <Text style={[styles.toggleBtnText, isPopulation && styles.toggleBtnTextActive]}>Population</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Raw Dataset</Text>
          <Text style={styles.inputHint}>Paste or type numbers separated by spaces or commas.</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={dataStr}
            onChangeText={setDataStr}
            placeholder="e.g. 12, 14, 18, 15, 22"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>

        {stats && (
          <View style={styles.resultsContainer}>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Count (n)</Text>
                <Text style={styles.gridValue}>{stats.n}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Mean (x̄)</Text>
                <Text style={styles.gridValue}>{stats.mean.toFixed(4)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Median</Text>
                <Text style={styles.gridValue}>{stats.median.toFixed(4)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Mode</Text>
                <Text style={styles.gridValue}>{stats.mode}</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>{isPopulation ? 'Pop. Var (σ²)' : 'Sample Var (s²)'}</Text>
                <Text style={styles.gridValue}>{stats.variance.toFixed(4)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>{isPopulation ? 'Pop. Std Dev (σ)' : 'Sample Std Dev (s)'}</Text>
                <Text style={styles.gridValue}>{stats.stdev.toFixed(4)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Range</Text>
                <Text style={styles.gridValue}>{stats.range.toFixed(4)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>IQR</Text>
                <Text style={styles.gridValue}>{stats.iqr.toFixed(4)}</Text>
              </View>
            </View>

            <BoxPlot min={stats.min} q1={stats.q1} median={stats.median} q3={stats.q3} max={stats.max} />
            
            {stats.rawData && stats.rawData.length > 0 && (
              <View style={[styles.card, { marginTop: 16 }]}>
                <Text style={styles.cardTitle}>Frequency Distribution</Text>
                {(() => {
                  const uniqueCount = new Set(stats.rawData).size;
                  const freqData = uniqueCount <= 10 
                    ? generateDiscreteFrequencyTable(stats.rawData) 
                    : generateContinuousFrequencyTable(stats.rawData);
                  
                  return (
                    <>
                      <Histogram data={freqData} />
                      <FrequencyTable data={freqData} />
                    </>
                  );
                })()}
              </View>
            )}
            
          </View>
        )}

      </ScrollView>

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="Population vs Sample">
        <Text style={styles.modalHeading}>Parameter vs Statistic</Text>
        <Text style={styles.modalText}>
          A <Text style={{fontWeight: 'bold'}}>Parameter</Text> is a numerical value describing an entire population (e.g., Population Mean μ, Population Variance σ²).{'\n\n'}
          A <Text style={{fontWeight: 'bold'}}>Statistic</Text> is a numerical value describing a sample drawn from the population (e.g., Sample Mean x̄, Sample Variance s²).
        </Text>
        <Text style={styles.modalHeading}>Variance Formula Difference</Text>
        <Text style={styles.modalText}>
          Sample Variance divides by (n - 1) to provide an unbiased estimator of the population variance, whereas Population Variance divides strictly by N.
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  toggleBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  toggleBtnTextActive: {
    color: colors.primary,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
  },
  resultsContainer: {
    gap: 16,
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
});
