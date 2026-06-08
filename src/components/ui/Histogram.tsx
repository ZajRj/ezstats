import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { FreqDataRow } from './FrequencyTable';

interface HistogramProps {
  data: FreqDataRow[];
}

export default function Histogram({ data }: HistogramProps) {
  if (!data || data.length === 0) return null;

  const maxFreq = Math.max(...data.map(d => d.absFreq));
  
  const minWidthPerBar = 40;
  const computedWidth = Math.max(330, data.length * minWidthPerBar);
  const height = 240;
  const chartHeight = 180;
  const chartTopMargin = 20;
  
  const barWidth = (computedWidth / data.length) * 0.85;
  const gap = (computedWidth / data.length) * 0.15;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Empirical Histogram</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Svg width={computedWidth} height={height} viewBox={`0 0 ${computedWidth} ${height}`}>
          {data.map((row, i) => {
            const barHeight = maxFreq === 0 ? 0 : (row.absFreq / maxFreq) * chartHeight;
            const px = i * (barWidth + gap) + gap/2;
            const py = chartTopMargin + chartHeight - barHeight;
            
            // Format midpoint text (trim if too long)
            let lbl = row.midpoint;
            if (lbl.length > 5 && data.length > 8) {
              lbl = parseFloat(lbl).toFixed(1);
            }

            return (
              <React.Fragment key={i}>
                <Rect 
                  x={px} 
                  y={py} 
                  width={barWidth} 
                  height={barHeight} 
                  fill={colors.primary}
                  opacity={0.85}
                  rx={2}
                />
                {row.absFreq > 0 && (
                  <SvgText 
                    x={px + barWidth/2} 
                    y={py - 5} 
                    fontSize="10" 
                    fill={colors.textSecondary} 
                    textAnchor="middle"
                  >
                    {row.absFreq}
                  </SvgText>
                )}
                <SvgText 
                  x={px + barWidth/2} 
                  y={chartTopMargin + chartHeight + 15} 
                  fontSize="9" 
                  fill={colors.textSecondary} 
                  textAnchor="middle"
                >
                  {lbl}
                </SvgText>
              </React.Fragment>
            );
          })}
          <Line x1="0" y1={chartTopMargin + chartHeight} x2={computedWidth} y2={chartTopMargin + chartHeight} stroke={colors.border} strokeWidth="2" />
        </Svg>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 10,
  },
});
