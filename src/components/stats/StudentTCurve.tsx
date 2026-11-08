import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Rect, G } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fix, fmt } from '../../stats/core/rounding';

interface StudentTCurveProps {
  df: number;
  alpha: number;
  t0: number;
  tCrit: number;
}

export default function StudentTCurve({ df, alpha, t0, tCrit }: StudentTCurveProps) {
  const width = Math.min(350, Dimensions.get('window').width - 48);
  const height = 150;
  const paddingH = 30;
  const paddingV = 25;
  const plotW = width - paddingH * 2;
  const plotH = height - paddingV * 2;
  const baselineY = height - paddingV;

  // Rango de visualización en el eje T
  const maxT = Math.max(3.8, Math.abs(tCrit) + 1.2, Math.min(6, Math.abs(t0) + 0.8));
  const minT = -maxT;

  const toX = (t: number) => paddingH + ((t - minT) / (maxT - minT)) * plotW;
  const tPdf = (t: number) => Math.pow(1 + (t * t) / df, -(df + 1) / 2);

  // Normalizar altura
  const maxPdf = tPdf(0);
  const toY = (t: number) => baselineY - (tPdf(t) / maxPdf) * plotH;

  // Generar puntos de la curva
  const steps = 70;
  const curvePoints: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = minT + (i / steps) * (maxT - minT);
    curvePoints.push([toX(t), toY(t)]);
  }
  const curveD = curvePoints.reduce((acc, [x, y], idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`, '');

  // Área sombreada cola izquierda: [-maxT, -tCrit]
  const leftTailPoints: [number, number][] = [];
  for (let i = 0; i <= 25; i++) {
    const t = minT + (i / 25) * (-tCrit - minT);
    leftTailPoints.push([toX(t), toY(t)]);
  }
  const leftTailD =
    leftTailPoints.length > 0
      ? `M ${toX(minT)} ${baselineY} L ` +
        leftTailPoints.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') +
        ` L ${toX(-tCrit)} ${baselineY} Z`
      : '';

  // Área sombreada cola derecha: [tCrit, maxT]
  const rightTailPoints: [number, number][] = [];
  for (let i = 0; i <= 25; i++) {
    const t = tCrit + (i / 25) * (maxT - tCrit);
    rightTailPoints.push([toX(t), toY(t)]);
  }
  const rightTailD =
    rightTailPoints.length > 0
      ? `M ${toX(tCrit)} ${baselineY} L ` +
        rightTailPoints.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') +
        ` L ${toX(maxT)} ${baselineY} Z`
      : '';

  const isReject = Math.abs(t0) >= tCrit;
  const clampedT0 = Math.max(minT, Math.min(maxT, t0));
  const t0X = toX(clampedT0);
  const t0Y = toY(clampedT0);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Eje horizontal (Línea base) */}
        <Line x1={paddingH} y1={baselineY} x2={width - paddingH} y2={baselineY} stroke="#94A3B8" strokeWidth={1.5} />

        {/* Sombras de las colas de rechazo (Rojo) */}
        {leftTailD ? <Path d={leftTailD} fill="#FCA5A5" opacity={0.65} /> : null}
        {rightTailD ? <Path d={rightTailD} fill="#FCA5A5" opacity={0.65} /> : null}

        {/* Curva t-Student */}
        <Path d={curveD} fill="none" stroke={colors.primary} strokeWidth={2.5} />

        {/* Línea central en 0 */}
        <Line x1={toX(0)} y1={baselineY} x2={toX(0)} y2={baselineY - 6} stroke="#64748B" strokeWidth={1} />
        <SvgText x={toX(0)} y={baselineY + 14} fontSize={10} fill="#64748B" textAnchor="middle">
          0
        </SvgText>

        {/* Líneas críticas -tCrit y +tCrit */}
        <Line
          x1={toX(-tCrit)}
          y1={baselineY}
          x2={toX(-tCrit)}
          y2={toY(-tCrit)}
          stroke="#DC2626"
          strokeWidth={1.5}
          strokeDasharray="3,3"
        />
        <SvgText x={toX(-tCrit)} y={baselineY + 14} fontSize={9} fill="#DC2626" textAnchor="middle" fontWeight="bold">
          -{fix(tCrit, 2)}
        </SvgText>

        <Line
          x1={toX(tCrit)}
          y1={baselineY}
          x2={toX(tCrit)}
          y2={toY(tCrit)}
          stroke="#DC2626"
          strokeWidth={1.5}
          strokeDasharray="3,3"
        />
        <SvgText x={toX(tCrit)} y={baselineY + 14} fontSize={9} fill="#DC2626" textAnchor="middle" fontWeight="bold">
          +{fix(tCrit, 2)}
        </SvgText>

        {/* Etiquetas de α/2 en las colas */}
        <SvgText x={toX(minT + 0.4)} y={toY(-tCrit) + 12} fontSize={9} fill="#B91C1C" textAnchor="start">
          α/2 = {(alpha / 2).toFixed(3)}
        </SvgText>
        <SvgText x={toX(maxT - 0.4)} y={toY(tCrit) + 12} fontSize={9} fill="#B91C1C" textAnchor="end">
          α/2 = {(alpha / 2).toFixed(3)}
        </SvgText>

        {/* Región de no rechazo en el centro */}
        <SvgText x={toX(0)} y={toY(0) + 20} fontSize={10} fill="#059669" textAnchor="middle" fontWeight="600">
          Zona de Aceptación (1 − α)
        </SvgText>

        {/* Marcador del estadístico t₀ calculado */}
        <Line
          x1={t0X}
          y1={baselineY}
          x2={t0X}
          y2={Math.min(baselineY - 15, t0Y - 8)}
          stroke={isReject ? '#DC2626' : '#2563EB'}
          strokeWidth={2}
        />
        <Circle cx={t0X} cy={t0Y} r={4.5} fill={isReject ? '#DC2626' : '#2563EB'} stroke="#FFFFFF" strokeWidth={1.5} />

        {/* Etiqueta flotante de t₀ */}
        <G>
          <Rect
            x={Math.max(8, Math.min(width - 90, t0X - 42))}
            y={Math.max(4, t0Y - 24)}
            width={84}
            height={18}
            rx={4}
            fill={isReject ? '#DC2626' : '#2563EB'}
          />
          <SvgText
            x={Math.max(8, Math.min(width - 90, t0X - 42)) + 42}
            y={Math.max(4, t0Y - 24) + 12}
            fontSize={9.5}
            fontWeight="bold"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            t₀ = {fix(t0, 3)}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
