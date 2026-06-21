import Text from '../../src/components/ui/Text';
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { jStat } from 'jstat';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';

export default function ZTable() {
  const [showNegative, setShowNegative] = useState(false);

  const zRows = Array.from({ length: 40 }, (_, i) => i / 10); // 0.0 to 3.9
  const zCols = Array.from({ length: 10 }, (_, i) => i / 100);

  const tableData = useMemo(() => {
    return zRows.map(row => {
      return zCols.map(col => {
        const z = showNegative ? -(row + col) : (row + col);
        return jStat.normal.cdf(z, 0, 1).toFixed(4);
      });
    });
  }, [showNegative]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Z-Table" }} />
      <View style={styles.header}>
        <Text style={styles.title}>Standard Normal Probabilities</Text>
        <Text style={styles.subtitle}>Cumulative probabilities P(Z ≤ z)</Text>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, !showNegative && styles.toggleBtnActive]} 
            onPress={() => setShowNegative(false)}
          >
            <Text style={[styles.toggleBtnText, !showNegative && styles.toggleBtnTextActive]}>Positive Z (0.0 to 3.9)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, showNegative && styles.toggleBtnActive]} 
            onPress={() => setShowNegative(true)}
          >
            <Text style={[styles.toggleBtnText, showNegative && styles.toggleBtnTextActive]}>Negative Z (-0.0 to -3.9)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Table>
        <TableHead>
          <TableCell isHeader width={65}>Z</TableCell>
          {zCols.map((col, i) => (
            <TableCell key={i} isHeader width={65}>{col.toFixed(2)}</TableCell>
          ))}
        </TableHead>
        {zRows.map((row, rIdx) => (
          <TableRow key={rIdx}>
            <TableCell isHeader width={65}>{(showNegative ? -row : row).toFixed(1)}</TableCell>
            {tableData[rIdx].map((val, cIdx) => (
              <TableCell key={cIdx} width={65}>{val}</TableCell>
            ))}
          </TableRow>
        ))}
      </Table>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  toggleBtnTextActive: {
    color: colors.primary,
  },
});
