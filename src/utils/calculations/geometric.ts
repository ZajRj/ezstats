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
  
  const elements = [];
  const width = 300;
  const height = 150;
  
  const maxPmf = pmf(1); 

  const barWidth = Math.min((width / maxK) * 0.6, 20);
  const spacing = width / maxK;

  for (let k = 1; k <= maxK; k++) {
    const prob = pmf(k);
    const barHeight = (prob / maxPmf) * height * 0.9;
    
    const px = (k - 1) * spacing + spacing / 2 - barWidth / 2;
    const py = height - barHeight;

    let isHighlighted = false;
    if (isValid) {
      if (modeIdx === 0 && k === pX) isHighlighted = true;
      if (modeIdx === 1 && k <= pX) isHighlighted = true;
      if (modeIdx === 2 && k >= pX) isHighlighted = true;
    }

    elements.push({ k, px, py, barWidth, barHeight, isHighlighted, maxK, height });
  }

  return { chartData: elements, maxX: maxK };
}
