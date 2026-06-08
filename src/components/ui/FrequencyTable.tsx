import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';

export interface FreqDataRow {
  interval: string;
  midpoint: string;
  absFreq: number;
  cumAbsFreq: number;
  relFreq: number;
  cumRelFreq: number;
  f_x: number;
}

interface FrequencyTableProps {
  data: FreqDataRow[];
}

export default function FrequencyTable({ data }: FrequencyTableProps) {
  if (!data || data.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.container}>
      <View>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, { width: 120 }]}>CLASE / INTERVALO</Text>
          <Text style={[styles.headerCell, { width: 140, textAlign: 'center' }]}>MARCA DE CLASE (Xᵢ)</Text>
          <Text style={[styles.headerCell, { width: 140, textAlign: 'center' }]}>FRECUENCIA ABS. (fᵢ)</Text>
          <Text style={[styles.headerCell, { width: 160, textAlign: 'center' }]}>FRECUENCIA ACUM. (Fᵢ)</Text>
          <Text style={[styles.headerCell, { width: 150, textAlign: 'center' }]}>FRECUENCIA REL. (hᵢ)</Text>
          <Text style={[styles.headerCell, { width: 180, textAlign: 'center' }]}>FRECUENCIA REL. ACUM. (Hᵢ)</Text>
          <Text style={[styles.headerCell, { width: 140, textAlign: 'center' }]}>fᵢ * Xᵢ</Text>
        </View>
        
        {data.map((row, idx) => (
          <View key={`${row.interval}-${idx}`} style={[styles.row, idx % 2 === 1 && styles.rowAlt]}>
            <Text style={[styles.cell, { width: 120, fontWeight: '600' }]}>{row.interval}</Text>
            <Text style={[styles.cell, { width: 140, textAlign: 'center' }]}>{row.midpoint}</Text>
            <Text style={[styles.cell, { width: 140, textAlign: 'center' }]}>{row.absFreq}</Text>
            <Text style={[styles.cell, { width: 160, textAlign: 'center' }]}>{row.cumAbsFreq}</Text>
            <Text style={[styles.cell, { width: 150, textAlign: 'center' }]}>{row.relFreq.toFixed(4)}</Text>
            <Text style={[styles.cell, { width: 180, textAlign: 'center' }]}>{row.cumRelFreq.toFixed(4)}</Text>
            <Text style={[styles.cell, { width: 140, textAlign: 'center' }]}>{row.f_x.toFixed(4)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowAlt: {
    backgroundColor: '#FAFAFA',
  },
  cell: {
    fontSize: 13,
    color: colors.text,
  },
});
