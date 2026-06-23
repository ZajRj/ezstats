import Text from '../../src/components/ui/Text';
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { jStat } from 'jstat';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';
import SegmentedControl from '../../src/components/ui/SegmentedControl';

export default function ZTable() {
  const [showNegative, setShowNegative] = useState(false);
  const [lookupZ, setLookupZ] = useState('');
  const [modeIdx, setModeIdx] = useState(0);

  const MODES = ['P(Z ≤ z)', 'P(Z ≥ z)'];

  const zRows = Array.from({ length: 40 }, (_, i) => i / 10); // 0.0 to 3.9
  const zCols = Array.from({ length: 10 }, (_, i) => i / 100);

  const tableData = useMemo(() => {
    return zRows.map(row => {
      return zCols.map(col => {
        const z = showNegative ? -(row + col) : (row + col);
        let p = jStat.normal.cdf(z, 0, 1);
        if (modeIdx === 1) p = 1 - p;
        return p.toFixed(4);
      });
    });
  }, [showNegative, modeIdx]);

  const lookupProb = useMemo(() => {
    const z = parseFloat(lookupZ);
    if (isNaN(z)) return null;
    let p = jStat.normal.cdf(z, 0, 1);
    if (modeIdx === 1) p = 1 - p;
    return p.toFixed(4);
  }, [lookupZ, modeIdx]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Z-Table" }} />
      <View style={styles.header}>
        <Text style={styles.title}>Standard Normal Probabilities</Text>
        <Text style={styles.subtitle}>Probabilities for standard normal distribution</Text>
        
        <View style={{ marginTop: 16 }}>
          <SegmentedControl options={MODES} selectedIndex={modeIdx} onChange={setModeIdx} />
        </View>

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

        <View style={styles.lookupContainer}>
          <Text style={styles.lookupTitle}>Quick Lookup</Text>
          <View style={styles.lookupRow}>
            <TextInput 
              style={styles.input} 
              placeholder="Enter Z-Score (e.g. 1.96)" 
              value={lookupZ}
              onChangeText={setLookupZ}
              keyboardType="numeric"
            />
            <View style={styles.lookupResult}>
              <Text style={styles.lookupResultLabel}>{MODES[modeIdx]}</Text>
              <Text style={styles.lookupResultValue}>{lookupProb !== null ? lookupProb : '--'}</Text>
            </View>
          </View>
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
  lookupContainer: {
    marginTop: 20,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lookupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  lookupResult: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
  },
  lookupResultLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  lookupResultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
});
