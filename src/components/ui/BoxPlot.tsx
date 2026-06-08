import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface BoxPlotProps {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export default function BoxPlot({ min, q1, median, q3, max }: BoxPlotProps) {
  const width = 300;
  const height = 120;
  
  // Padding for labels
  const paddingH = 30;
  const plotWidth = width - paddingH * 2;
  const range = max - min;
  
  // Guard against divide by zero if max === min
  const safeRange = range === 0 ? 1 : range;
  
  const scale = (val: number) => paddingH + ((val - min) / safeRange) * plotWidth;

  const yCenter = 60;
  const boxHeight = 40;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Box Plot</Text>
      <View style={styles.svgContainer}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Main axis */}
          <Line x1={scale(min)} y1={yCenter} x2={scale(max)} y2={yCenter} stroke={colors.border} strokeWidth="2" />
          
          {/* Whiskers */}
          <Line x1={scale(min)} y1={yCenter - 10} x2={scale(min)} y2={yCenter + 10} stroke={colors.textSecondary} strokeWidth="2" />
          <Line x1={scale(max)} y1={yCenter - 10} x2={scale(max)} y2={yCenter + 10} stroke={colors.textSecondary} strokeWidth="2" />
          
          {/* Box */}
          <Rect 
            x={scale(q1)} 
            y={yCenter - boxHeight / 2} 
            width={scale(q3) - scale(q1)} 
            height={boxHeight} 
            fill={colors.primaryLight} 
            stroke={colors.primary} 
            strokeWidth="2" 
          />
          
          {/* Median line */}
          <Line 
            x1={scale(median)} 
            y1={yCenter - boxHeight / 2} 
            x2={scale(median)} 
            y2={yCenter + boxHeight / 2} 
            stroke={colors.primary} 
            strokeWidth="2" 
          />

          {/* Labels */}
          <SvgText x={scale(min)} y={yCenter + 35} fontSize="10" fill={colors.textSecondary} textAnchor="middle">{min.toFixed(2)}</SvgText>
          <SvgText x={scale(max)} y={yCenter + 35} fontSize="10" fill={colors.textSecondary} textAnchor="middle">{max.toFixed(2)}</SvgText>
          <SvgText x={scale(q1)} y={yCenter - 30} fontSize="10" fill={colors.primary} textAnchor="middle">{q1.toFixed(2)}</SvgText>
          <SvgText x={scale(median)} y={yCenter - 30} fontSize="10" fill={colors.primary} textAnchor="middle" fontWeight="bold">{median.toFixed(2)}</SvgText>
          <SvgText x={scale(q3)} y={yCenter - 30} fontSize="10" fill={colors.primary} textAnchor="middle">{q3.toFixed(2)}</SvgText>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  svgContainer: {
    alignItems: 'center',
  },
});
