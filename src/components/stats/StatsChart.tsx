import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Path, Circle, Rect, Text as SvgText, G } from 'react-native-svg';
import Text from '../ui/Text';
import { colors } from '../../theme/colors';
import type { ChartSpec } from '../../stats/types';
import { normal } from '../../stats/core/distributions';
import { fmt } from '../../stats/core/rounding';

const H = 220;
const PAD = { l: 40, r: 12, t: 14, b: 30 };
const ACCENT = '#C2410C'; // orange-700: second series, readable on white
const MUTED = '#94A3B8';

function scale(d0: number, d1: number, r0: number, r1: number) {
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

function ticks(min: number, max: number, count = 4) {
  return Array.from({ length: count + 1 }, (_, i) => min + ((max - min) * i) / count);
}

function Axes({ w, x, y, xMin, xMax, yMin, yMax, yFmt = fmt }: {
  w: number; x: (v: number) => number; y: (v: number) => number;
  xMin: number; xMax: number; yMin: number; yMax: number; yFmt?: (v: number) => string;
}) {
  return (
    <G>
      {ticks(yMin, yMax).map((t, i) => (
        <G key={`y${i}`}>
          <Line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} stroke={colors.border} strokeWidth={1} />
          <SvgText x={PAD.l - 6} y={y(t) + 4} fontSize={11} fill={colors.textSecondary} textAnchor="end">{yFmt(t)}</SvgText>
        </G>
      ))}
      {ticks(xMin, xMax).map((t, i) => (
        <SvgText key={`x${i}`} x={x(t)} y={H - 10} fontSize={11} fill={colors.textSecondary} textAnchor="middle">
          {fmt(t, 2)}
        </SvgText>
      ))}
    </G>
  );
}

function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((it) => (
        <View key={it.label} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: it.dashed ? 'transparent' : it.color, borderColor: it.color, borderStyle: it.dashed ? 'dashed' : 'solid' }]} />
          <Text style={styles.legendText}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StatsChart({ spec }: { spec: ChartSpec }) {
  const [w, setW] = useState(0);
  const inner = w > 0;
  let body: React.ReactNode = null;
  let legend: { color: string; label: string; dashed?: boolean }[] = [];
  let title = '';

  if (inner && spec.kind === 'ecdf') {
    title = 'Acumulada empírica vs. normal';
    const xs = spec.points.map((p) => p.x);
    const xMin = Math.min(xs[0], spec.mean - 3 * spec.sd);
    const xMax = Math.max(xs[xs.length - 1], spec.mean + 3 * spec.sd);
    const x = scale(xMin, xMax, PAD.l, w - PAD.r);
    const y = scale(0, 1, H - PAD.b, PAD.t);
    const curve = Array.from({ length: 81 }, (_, i) => {
      const v = xMin + ((xMax - xMin) * i) / 80;
      return `${i === 0 ? 'M' : 'L'}${x(v).toFixed(1)},${y(normal.cdf(v, spec.mean, spec.sd)).toFixed(1)}`;
    }).join(' ');
    let steps = `M${x(xMin).toFixed(1)},${y(0).toFixed(1)}`;
    for (const p of spec.points) steps += ` H${x(p.x).toFixed(1)} V${y(p.F).toFixed(1)}`;
    steps += ` H${x(xMax).toFixed(1)}`;
    const dx = x(spec.dAt.x);
    body = (
      <>
        <Axes w={w} x={x} y={y} xMin={xMin} xMax={xMax} yMin={0} yMax={1} yFmt={(v) => fmt(v, 2)} />
        <Path d={curve} stroke={ACCENT} strokeWidth={2} fill="none" />
        <Path d={steps} stroke={colors.primary} strokeWidth={2} fill="none" />
        <Line x1={dx} x2={dx} y1={y(spec.dAt.from)} y2={y(spec.dAt.to)} stroke={colors.danger} strokeWidth={3} />
        <SvgText x={dx + 6} y={(y(spec.dAt.from) + y(spec.dAt.to)) / 2 + 4} fontSize={13} fontWeight="bold" fill={colors.danger}>D</SvgText>
      </>
    );
    legend = [
      { color: colors.primary, label: 'Fₙ(x) empírica' },
      { color: ACCENT, label: 'Φ normal' },
      { color: colors.danger, label: 'D (máxima distancia)' },
    ];
  }

  if (inner && (spec.kind === 'runs' || spec.kind === 'updown')) {
    title = spec.kind === 'runs' ? 'Secuencia respecto a la mediana' : 'Subidas y bajadas';
    const v = spec.values;
    const yMin = Math.min(...v);
    const yMax = Math.max(...v);
    const x = scale(0, Math.max(1, v.length - 1), PAD.l + 6, w - PAD.r - 6);
    const y = scale(yMin - (yMax - yMin) * 0.1, yMax + (yMax - yMin) * 0.1, H - PAD.b, PAD.t);
    const line = v.map((val, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(' ');
    const colorOf = (s: number) => (s === 1 ? colors.primary : s === -1 ? ACCENT : MUTED);
    body = (
      <>
        <Axes w={w} x={(t) => x(t - 1)} y={y} xMin={1} xMax={v.length} yMin={yMin} yMax={yMax} />
        {spec.kind === 'runs' && (
          <Line x1={PAD.l} x2={w - PAD.r} y1={y(spec.median)} y2={y(spec.median)} stroke={colors.textSecondary} strokeDasharray="6 4" strokeWidth={1.5} />
        )}
        <Path d={line} stroke={MUTED} strokeWidth={1.5} fill="none" />
        {v.map((val, i) => (
          <Circle key={i} cx={x(i)} cy={y(val)} r={5} fill={colorOf(spec.signs[i])} stroke={colors.card} strokeWidth={1.5} />
        ))}
      </>
    );
    legend =
      spec.kind === 'runs'
        ? [
            { color: colors.primary, label: '+ sobre la mediana' },
            { color: ACCENT, label: '− bajo la mediana' },
            { color: MUTED, label: 'igual (excluido)' },
            { color: colors.textSecondary, label: `mediana = ${fmt(spec.median)}`, dashed: true },
          ]
        : [
            { color: colors.primary, label: '↑ sube' },
            { color: ACCENT, label: '↓ baja' },
            { color: MUTED, label: 'inicio / empate' },
          ];
  }

  if (inner && spec.kind === 'acf') {
    title = 'Autocorrelaciones ρ̂ₖ';
    const lim = Math.max(spec.bound * 1.3, ...spec.rho.map(Math.abs), 0.2);
    const y = scale(-lim, lim, H - PAD.b, PAD.t);
    const n = spec.lags.length;
    const bw = Math.max(6, ((w - PAD.l - PAD.r) / n) * 0.5);
    const x = (i: number) => PAD.l + ((w - PAD.l - PAD.r) * (i + 0.5)) / n;
    body = (
      <>
        <Axes w={w} x={(t) => x(t - 1)} y={y} xMin={1} xMax={n} yMin={-lim} yMax={lim} yFmt={(v) => fmt(v, 2)} />
        {[spec.bound, -spec.bound].map((b) => (
          <Line key={b} x1={PAD.l} x2={w - PAD.r} y1={y(b)} y2={y(b)} stroke={colors.danger} strokeDasharray="6 4" strokeWidth={1.5} />
        ))}
        {spec.rho.map((r, i) => (
          <Rect key={i} x={x(i) - bw / 2} width={bw} y={Math.min(y(r), y(0))} height={Math.abs(y(r) - y(0))} fill={Math.abs(r) > spec.bound ? colors.danger : colors.primary} rx={2} />
        ))}
      </>
    );
    legend = [
      { color: colors.primary, label: 'ρ̂ₖ dentro de ±1.96/√n' },
      { color: colors.danger, label: 'fuera de los límites', dashed: false },
    ];
  }

  if (inner && spec.kind === 'means') {
    title = 'Medias por grupo (± 1 desviación estándar)';
    const lo = Math.min(...spec.means.map((m, i) => m - spec.sds[i]));
    const hi = Math.max(...spec.means.map((m, i) => m + spec.sds[i]));
    const pad = (hi - lo) * 0.15 || 1;
    const y = scale(lo - pad, hi + pad, H - PAD.b, PAD.t);
    const n = spec.means.length;
    const x = (i: number) => PAD.l + ((w - PAD.l - PAD.r) * (i + 0.5)) / n;
    body = (
      <>
        {ticks(lo - pad, hi + pad).map((t, i) => (
          <G key={i}>
            <Line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} stroke={colors.border} />
            <SvgText x={PAD.l - 6} y={y(t) + 4} fontSize={11} fill={colors.textSecondary} textAnchor="end">{fmt(t, 1)}</SvgText>
          </G>
        ))}
        <Line x1={PAD.l} x2={w - PAD.r} y1={y(spec.grandMean)} y2={y(spec.grandMean)} stroke={ACCENT} strokeDasharray="6 4" strokeWidth={1.5} />
        {spec.means.map((m, i) => (
          <G key={i}>
            <Line x1={x(i)} x2={x(i)} y1={y(m - spec.sds[i])} y2={y(m + spec.sds[i])} stroke={colors.primary} strokeWidth={2} />
            <Line x1={x(i) - 8} x2={x(i) + 8} y1={y(m - spec.sds[i])} y2={y(m - spec.sds[i])} stroke={colors.primary} strokeWidth={2} />
            <Line x1={x(i) - 8} x2={x(i) + 8} y1={y(m + spec.sds[i])} y2={y(m + spec.sds[i])} stroke={colors.primary} strokeWidth={2} />
            <Circle cx={x(i)} cy={y(m)} r={6} fill={colors.primary} />
            <SvgText x={x(i)} y={H - 10} fontSize={12} fill={colors.text} textAnchor="middle">{spec.labels[i].slice(0, 12)}</SvgText>
          </G>
        ))}
      </>
    );
    legend = [
      { color: colors.primary, label: 'x̄ⱼ ± sⱼ' },
      { color: ACCENT, label: `media general = ${fmt(spec.grandMean)}`, dashed: true },
    ];
  }

  return (
    <View style={styles.card} onLayout={(e) => setW(e.nativeEvent.layout.width - 24)}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Svg width={Math.max(w, 1)} height={H}>{body}</Svg>
      <Legend items={legend} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 4, borderRadius: 2, borderWidth: 1.5 },
  legendText: { fontSize: 12, color: colors.textSecondary },
});
