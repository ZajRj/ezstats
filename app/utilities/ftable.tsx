import Text from '../../src/components/ui/Text';
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { jStat } from 'jstat';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';

export default function FTable() {
  const [alpha, setAlpha] = useState(0.05);

  const df1s = Array.from({ length: 20 }, (_, i) => i + 1); // numerator df
  const df2s = Array.from({ length: 30 }, (_, i) => i + 1); // denominator df

  const tableData = useMemo(() => {
    return df2s.map(df2 => {
      return df1s.map(df1 => {
        return jStat.centralF.inv(1 - alpha, df1, df2).toFixed(2);
      });
    });
  }, [alpha]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "F-Table" }} />
      <View style={styles.header}>
        <Text style={styles.title}>F-Distribution Table</Text>
        <Text style={styles.subtitle}>Critical values for selected alpha (right-tail)</Text>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, alpha === 0.05 && styles.toggleBtnActive]} onPress={() => setAlpha(0.05)}>
            <Text style={[styles.toggleBtnText, alpha === 0.05 && styles.toggleBtnTextActive]}>α = 0.05</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, alpha === 0.01 && styles.toggleBtnActive]} onPress={() => setAlpha(0.01)}>
            <Text style={[styles.toggleBtnText, alpha === 0.01 && styles.toggleBtnTextActive]}>α = 0.01</Text>
          </TouchableOpacity>
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
});
