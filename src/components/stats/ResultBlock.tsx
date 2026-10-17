import React from 'react';
import { View, StyleSheet } from 'react-native';
import ResultCard from './ResultCard';
import Procedure from './Procedure';
import StatsChart from './StatsChart';
import { SectionTitle } from './Controls';
import type { TestResult } from '../../stats/types';

/** Result card, collapsible procedure, chart and any follow-up tests. */
export default function ResultBlock({ result, title }: { result: TestResult; title?: string }) {
  return (
    <View style={styles.block}>
      <ResultCard result={result} title={title} />
      <Procedure result={result} />
      {result.chart ? <StatsChart spec={result.chart} /> : null}
      {result.followUp?.map((f) => (
        <View key={f.testId} style={styles.block}>
          <SectionTitle>Prueba posterior</SectionTitle>
          <ResultCard result={f} />
          <Procedure result={f} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 12 },
});
