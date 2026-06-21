import Text from '../../src/components/ui/Text';
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { jStat } from 'jstat';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';

export default function TTable() {
  const dfs = Array.from({ length: 50 }, (_, i) => i + 1);
  const alphas = [0.25, 0.10, 0.05, 0.025, 0.01, 0.005, 0.001];

  const tableData = useMemo(() => {
    return dfs.map(df => {
      return alphas.map(alpha => {
        return jStat.studentt.inv(1 - alpha, df).toFixed(3);
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "T-Table" }} />
      <View style={styles.header}>
        <Text style={styles.title}>Student's t-Table</Text>
        <Text style={styles.subtitle}>Critical values for right-tail probabilities (α)</Text>
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
});
