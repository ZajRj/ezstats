import React from 'react';
import { Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme/colors';

export function calculateGeometricProb(x: number, p: number, modeIdx: number): number {
  const pmf = (k: number) => Math.pow(1 - p, k - 1) * p;
  const cdf = (k: number) => 1 - Math.pow(1 - p, k);
  
  if (modeIdx === 0) return pmf(x);
  if (modeIdx === 1) return cdf(x);
  if (modeIdx === 2) return 1 - cdf(x - 1);
  return 0;
}

export function generateGeometricSamples(p: number, N: number): number[] {
  const samples: number[] = [];
  for (let i = 0; i < N; i++) {
    let trials = 1;
    while (Math.random() >= p) {
      trials++;
    }
    samples.push(trials);
  }
  return samples;
}

export function getGeometricStats(p: number) {
  return [
    { label: 'E[X]', value: +(1 / p).toFixed(4) },
    { label: 'Var(X)', value: +((1 - p) / (p * p)).toFixed(4) }
  ];
}

export function generateGeometricChartElements(p: number, x: number, modeIdx: number, isValid: boolean) {
  const pP = isValid ? p : 0.5;
  const pX = isValid ? x : 3;
  
  let maxK = Math.max(pX + 2, Math.ceil(Math.log(0.01) / Math.log(1 - pP)));
  if (maxK > 30) maxK = 30;
  if (maxK < 5) maxK = 5;

  const pmf = (k: number) => Math.pow(1 - pP, k - 1) * pP;
  
  const points = [];
  
  for (let k = 1; k <= maxK; k++) {
    const prob = pmf(k);

    let isHighlighted = false;
    if (isValid) {
      if (modeIdx === 0 && k === pX) isHighlighted = true;
      if (modeIdx === 1 && k <= pX) isHighlighted = true;
      if (modeIdx === 2 && k >= pX) isHighlighted = true;
    }

    points.push({ val: k, prob, isHighlighted });
  }

  return { points, displayK: maxK };
}
