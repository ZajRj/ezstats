import Text from '../../src/components/ui/Text';
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import BoxPlot from '../../src/components/ui/BoxPlot';
import { calculateDescriptiveStats } from '../../src/utils/calculations/descriptive';

export default function DescriptiveStatistics() {
  const [dataStr, setDataStr] = useState('');

  const stats = useMemo(() => {
    return calculateDescriptiveStats(dataStr);
  }, [dataStr]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen options={{ title: 'Descriptive Statistics' }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        
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
                <Text style={styles.gridLabel}>Sample Var (s²)</Text>
                <Text style={styles.gridValue}>{stats.variance.toFixed(4)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Sample Std Dev (s)</Text>
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
