import Text from '../../src/components/ui/Text';
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { jStat } from 'jstat';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';
import SegmentedControl from '../../src/components/ui/SegmentedControl';

export default function TTable() {
  const [lookupDf, setLookupDf] = useState('');
  const [lookupAlpha, setLookupAlpha] = useState('');
  const [modeIdx, setModeIdx] = useState(0);

  const MODES = ['Right-Tail P(T ≥ t) = α', 'Left-Tail P(T ≤ t) = α'];

  const dfs = Array.from({ length: 50 }, (_, i) => i + 1);
  const alphas = [0.25, 0.10, 0.05, 0.025, 0.01, 0.005, 0.001];

  const tableData = useMemo(() => {
    return dfs.map(df => {
      return alphas.map(alpha => {
        const p = modeIdx === 0 ? 1 - alpha : alpha;
        return jStat.studentt.inv(p, df).toFixed(3);
      });
    });
  }, [dfs, alphas, modeIdx]);

  const lookupT = useMemo(() => {
    const df = parseInt(lookupDf, 10);
    const alpha = parseFloat(lookupAlpha);
    if (isNaN(df) || isNaN(alpha) || df <= 0 || alpha <= 0 || alpha >= 1) return null;
    const p = modeIdx === 0 ? 1 - alpha : alpha;
    return jStat.studentt.inv(p, df).toFixed(3);
  }, [lookupDf, lookupAlpha, modeIdx]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "T-Table" }} />
      <View style={styles.header}>
        <Text style={styles.title}>Student's t-Table</Text>
        <Text style={styles.subtitle}>Critical values for selected probabilities</Text>
        
        <View style={{ marginTop: 16 }}>
          <SegmentedControl options={MODES} selectedIndex={modeIdx} onChange={setModeIdx} />
        </View>

        <View style={styles.lookupContainer}>
          <Text style={styles.lookupTitle}>Quick Lookup</Text>
          <View style={styles.lookupRow}>
            <TextInput style={styles.input} placeholder="df" value={lookupDf} onChangeText={setLookupDf} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="α (e.g. 0.05)" value={lookupAlpha} onChangeText={setLookupAlpha} keyboardType="numeric" />
            <View style={styles.lookupResult}>
              <Text style={styles.lookupResultLabel}>Critical Value</Text>
              <Text style={styles.lookupResultValue}>{lookupT !== null ? lookupT : '--'}</Text>
            </View>
          </View>
        </View>
      </View>

      <Table>
        <TableHead>
          <TableCell isHeader width={70}>df \ α</TableCell>
          {alphas.map((alpha, i) => (
            <TableCell key={i} isHeader width={70}>{alpha.toString()}</TableCell>
          ))}
        </TableHead>
        {dfs.map((df, rIdx) => (
          <TableRow key={rIdx}>
            <TableCell isHeader width={70}>{df}</TableCell>
            {tableData[rIdx].map((val, cIdx) => (
              <TableCell key={cIdx} width={70}>{val}</TableCell>
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
  lookupContainer: { marginTop: 20, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  lookupTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  lookupRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text },
  lookupResult: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 100 },
  lookupResultLabel: { fontSize: 11, fontWeight: 'bold', color: colors.primary, marginBottom: 2 },
  lookupResultValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
});
