import Text from '../../src/components/ui/Text';
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import BottomSheetModal from '../../src/components/ui/BottomSheetModal';
import Histogram from '../../src/components/ui/Histogram';
import { generateContinuousFrequencyTable } from '../../src/utils/calculations/frequency';
import { runSamplingSimulation, PopulationType } from '../../src/utils/calculations/sampling';
import StatBox from '../../src/components/ui/StatBox';

export default function SamplingDistribution() {
  const [popType, setPopType] = useState<PopulationType>('uniform');
  const [sampleSizeStr, setSampleSizeStr] = useState('30');
  const [numSamplesStr, setNumSamplesStr] = useState('1000');
  const [infoVisible, setInfoVisible] = useState(false);

  const n = parseInt(sampleSizeStr, 10) || 30;
  const M = parseInt(numSamplesStr, 10) || 1000;

  const result = useMemo(() => {
    if (n > 0 && M > 0 && n <= 500 && M <= 10000) {
      return runSamplingSimulation(popType, n, M);
    }
    return null;
  }, [popType, n, M]);

  const freqData = useMemo(() => {
    if (result && result.sampleMeans.length > 0) {
      return generateContinuousFrequencyTable(result.sampleMeans);
    }
    return [];
  }, [result]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ 
        title: 'Central Limit Theorem',
        headerRight: () => (
          <TouchableOpacity onPress={() => setInfoVisible(true)} style={{ marginRight: 16 }}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Population Distribution</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleBtn, popType === 'uniform' && styles.toggleBtnActive]} onPress={() => setPopType('uniform')}>
              <Text style={[styles.toggleBtnText, popType === 'uniform' && styles.toggleBtnTextActive]}>Uniform</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, popType === 'normal' && styles.toggleBtnActive]} onPress={() => setPopType('normal')}>
              <Text style={[styles.toggleBtnText, popType === 'normal' && styles.toggleBtnTextActive]}>Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, popType === 'exponential' && styles.toggleBtnActive]} onPress={() => setPopType('exponential')}>
              <Text style={[styles.toggleBtnText, popType === 'exponential' && styles.toggleBtnTextActive]}>Exponential</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Sample Size (n)</Text>
              <TextInput style={styles.input} value={sampleSizeStr} onChangeText={setSampleSizeStr} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Number of Samples (M)</Text>
              <TextInput style={styles.input} value={numSamplesStr} onChangeText={setNumSamplesStr} keyboardType="number-pad" />
            </View>
          </View>
        </View>

        {result && (
          <View style={styles.resultsContainer}>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Population Mean (μ)</Text>
                <Text style={styles.gridValue}>{result.populationMean.toFixed(4)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Average of Sample Means (μ_x̄)</Text>
                <Text style={styles.gridValue}>{result.actualSampleMeanAverage.toFixed(4)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Theoretical Variance (σ²/n)</Text>
                <Text style={styles.gridValue}>{result.theoreticalSampleVariance.toFixed(4)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Actual Means Variance (s²_x̄)</Text>
                <Text style={styles.gridValue}>{result.actualSampleMeanVariance.toFixed(4)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Distribution of Sample Means</Text>
              <Text style={styles.inputHint}>Notice how the distribution approaches a Normal shape as sample size (n) increases, regardless of the population distribution.</Text>
              {freqData.length > 0 && <Histogram data={freqData} />}
            </View>
          </View>
        )}
      </ScrollView>

      <BottomSheetModal visible={infoVisible} onClose={() => setInfoVisible(false)} title="Central Limit Theorem">
        <Text style={styles.modalHeading}>What is this?</Text>
        <Text style={styles.modalText}>
          This simulator demonstrates the Central Limit Theorem. We take a population with a specific distribution (Uniform, Normal, or Exponential).
        </Text>
        <Text style={styles.modalHeading}>The Process</Text>
        <Text style={styles.modalText}>
          We draw <Text style={{fontWeight: 'bold'}}>M</Text> different samples, each containing <Text style={{fontWeight: 'bold'}}>n</Text> items from the population. We calculate the mean for each of these samples.
        </Text>
        <Text style={styles.modalHeading}>The Result</Text>
        <Text style={styles.modalText}>
          The histogram plots all M sample means. As n increases, this distribution of sample means approaches a Normal Distribution, its average approaches the population mean μ, and its variance becomes σ²/n.
        </Text>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 100, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
  inputHint: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 8, padding: 4, borderWidth: 1, borderColor: colors.border },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  toggleBtnTextActive: { color: colors.primary },
  resultsContainer: { gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { flex: 1, minWidth: '45%', backgroundColor: colors.card, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  gridLabel: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  gridValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  modalHeading: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
  modalText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
