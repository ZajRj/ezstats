import Text from './Text';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { Table, TableHead, TableRow, TableCell } from './Table';

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
    <View style={styles.container}>
      <Table>
        <TableHead>
          <TableCell isHeader width={120}>CLASE / INTERVALO</TableCell>
          <TableCell isHeader width={140}>MARCA DE CLASE (Xᵢ)</TableCell>
          <TableCell isHeader width={140}>FRECUENCIA ABS. (fᵢ)</TableCell>
          <TableCell isHeader width={160}>FRECUENCIA ACUM. (Fᵢ)</TableCell>
          <TableCell isHeader width={150}>FRECUENCIA REL. (hᵢ)</TableCell>
          <TableCell isHeader width={180}>FRECUENCIA REL. ACUM. (Hᵢ)</TableCell>
          <TableCell isHeader width={140}>fᵢ * Xᵢ</TableCell>
        </TableHead>
        {data.map((row, idx) => (
          <TableRow key={`${row.interval}-${idx}`}>
            <TableCell width={120}>{row.interval}</TableCell>
            <TableCell width={140}>{row.midpoint}</TableCell>
            <TableCell width={140}>{row.absFreq}</TableCell>
            <TableCell width={160}>{row.cumAbsFreq}</TableCell>
            <TableCell width={150}>{row.relFreq.toFixed(4)}</TableCell>
            <TableCell width={180}>{row.cumRelFreq.toFixed(4)}</TableCell>
            <TableCell width={140}>{row.f_x.toFixed(4)}</TableCell>
          </TableRow>
        ))}
      </Table>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    maxHeight: 400,
  },
});
