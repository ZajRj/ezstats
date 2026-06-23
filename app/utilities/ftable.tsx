import Text from '../../src/components/ui/Text';
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { jStat } from 'jstat';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';
import SegmentedControl from '../../src/components/ui/SegmentedControl';

export default function FTable() {
  const [alpha, setAlpha] = useState(0.05);
  const [lookupDf1, setLookupDf1] = useState('');
  const [lookupDf2, setLookupDf2] = useState('');
  const [lookupAlpha, setLookupAlpha] = useState('');
  const [modeIdx, setModeIdx] = useState(0);

  const MODES = ['Right-Tail P(F ≥ f) = α', 'Left-Tail P(F ≤ f) = α'];

  const df1s = Array.from({ length: 20 }, (_, i) => i + 1); // numerator df
  const df2s = Array.from({ length: 30 }, (_, i) => i + 1); // denominator df

  const tableData = useMemo(() => {
    return df2s.map(df2 => {
      return df1s.map(df1 => {
        const p = modeIdx === 0 ? 1 - alpha : alpha;
        return jStat.centralF.inv(p, df1, df2).toFixed(2);
      });
    });
  }, [alpha, modeIdx]);

  const lookupF = useMemo(() => {
    const df1 = parseInt(lookupDf1, 10);
    const df2 = parseInt(lookupDf2, 10);
    const a = parseFloat(lookupAlpha);
    if (isNaN(df1) || isNaN(df2) || isNaN(a) || df1 <= 0 || df2 <= 0 || a <= 0 || a >= 1) return null;
    const p = modeIdx === 0 ? 1 - a : a;
    return jStat.centralF.inv(p, df1, df2).toFixed(3);
  }, [lookupDf1, lookupDf2, lookupAlpha, modeIdx]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "F-Table" }} />
      <View style={styles.header}>
        <Text style={styles.title}>F-Distribution Table</Text>
        <Text style={styles.subtitle}>Critical values for selected probabilities</Text>
        
        <View style={{ marginTop: 16 }}>
          <SegmentedControl options={MODES} selectedIndex={modeIdx} onChange={setModeIdx} />
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, alpha === 0.05 && styles.toggleBtnActive]} onPress={() => setAlpha(0.05)}>
            <Text style={[styles.toggleBtnText, alpha === 0.05 && styles.toggleBtnTextActive]}>α = 0.05</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, alpha === 0.01 && styles.toggleBtnActive]} onPress={() => setAlpha(0.01)}>
            <Text style={[styles.toggleBtnText, alpha === 0.01 && styles.toggleBtnTextActive]}>α = 0.01</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lookupContainer}>
          <Text style={styles.lookupTitle}>Quick Lookup</Text>
          <View style={styles.lookupRow}>
            <TextInput style={styles.input} placeholder="d₁" value={lookupDf1} onChangeText={setLookupDf1} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="d₂" value={lookupDf2} onChangeText={setLookupDf2} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="α" value={lookupAlpha} onChangeText={setLookupAlpha} keyboardType="numeric" />
            <View style={styles.lookupResult}>
              <Text style={styles.lookupResultLabel}>Critical Value</Text>
              <Text style={styles.lookupResultValue}>{lookupF !== null ? lookupF : '--'}</Text>
            </View>
          </View>
        </View>
      </View>

      <Table>
        <TableHead>
          <TableCell isHeader width={55}>d₂ \ d₁</TableCell>
          {df1s.map((d1, i) => (
            <TableCell key={i} isHeader width={55}>{d1}</TableCell>
          ))}
        </TableHead>
        {df2s.map((d2, rIdx) => (
          <TableRow key={rIdx}>
            <TableCell isHeader width={55}>{d2}</TableCell>
            {tableData[rIdx].map((val, cIdx) => (
              <TableCell key={cIdx} width={55}>{val}</TableCell>
            ))}
          </TableRow>
        ))}
      </Table>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  toggleContainer: { flexDirection: 'row', marginTop: 16, backgroundColor: colors.background, borderRadius: 8, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  toggleBtnTextActive: { color: colors.primary },
  lookupContainer: { marginTop: 20, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  lookupTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  lookupRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text },
  lookupResult: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 80 },
  lookupResultLabel: { fontSize: 11, fontWeight: 'bold', color: colors.primary, marginBottom: 2 },
  lookupResultValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
});
