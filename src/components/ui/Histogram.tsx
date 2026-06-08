import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors } from '../../theme/colors';
import { FreqDataRow } from './FrequencyTable';

interface HistogramProps {
  data: FreqDataRow[];
}

const screenWidth = Dimensions.get("window").width;

export default function Histogram({ data }: HistogramProps) {
  if (!data || data.length === 0) return null;

  const minWidthPerBar = 50;
  // Increase computed width logic so labels fit
  const computedWidth = Math.max(screenWidth - 64, data.length * minWidthPerBar);
  
  const labels = data.map(row => {
    let lbl = row.midpoint;
    if (lbl.length > 5 && data.length > 8) {
      return parseFloat(lbl).toFixed(1);
    }
    return lbl;
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        data: data.map(row => row.absFreq)
      }
    ]
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Empirical Histogram</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <BarChart
          data={chartData}
          width={computedWidth}
          height={240}
          yAxisLabel=""
          yAxisSuffix=""
          fromZero
          showValuesOnTopOfBars
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // primary color approx
            labelColor: (opacity = 1) => colors.textSecondary,
            style: {
              borderRadius: 16
            },
            propsForLabels: {
              fontSize: 10,
            }
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 10,
  },
});
