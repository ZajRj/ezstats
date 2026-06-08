import { jStat } from 'jstat';

export function calculateBinomialProb(x: number, n: number, p: number, modeIdx: number): number {
  if (modeIdx === 0) {
    return jStat.binomial.pdf(x, n, p);
  } else if (modeIdx === 1) {
    return jStat.binomial.cdf(x, n, p);
  } else {
    return 1 - jStat.binomial.cdf(x - 1, n, p);
  }
}

export function generateBinomialSamples(n: number, p: number, N: number): number[] {
  const samples: number[] = [];
  for (let i = 0; i < N; i++) {
    let successes = 0;
    for (let j = 0; j < n; j++) {
      if (Math.random() < p) successes++;
    }
    samples.push(successes);
  }
  return samples;
}

export function getBinomialStats(n: number, p: number) {
  return [
    { label: 'E[X]', value: +(n * p).toFixed(4) },
    { label: 'Var(X)', value: +(n * p * (1 - p)).toFixed(4) }
  ];
}

export function generateBinomialChartPoints(n: number, p: number, x: number, modeIdx: number, isValid: boolean) {
  const pN = isValid ? n : 10;
  const pP = isValid ? p : 0.5;
  const pX = isValid ? x : -1;
  
  const width = 300;
  const height = 150;
  const maxBars = 30; 

  const displayN = Math.min(pN, maxBars);
  const barWidth = (width / (displayN + 1)) * 0.8;
  const gap = (width / (displayN + 1)) * 0.2;

  const points = [];
  let maxPdf = 0;
  
  for (let i = 0; i <= displayN; i++) {
    const pdf = jStat.binomial.pdf(i, pN, pP);
    if (pdf > maxPdf) maxPdf = pdf;
    
    let isHighlighted = false;
    if (isValid) {
      if (modeIdx === 0 && i === pX) isHighlighted = true;
      if (modeIdx === 1 && i <= pX) isHighlighted = true;
      if (modeIdx === 2 && i >= pX) isHighlighted = true;
    }
    
    points.push({ val: i, pdf, isHighlighted });
  }

  if (maxPdf === 0) maxPdf = 1;

  return { points, maxPdf, barWidth, gap, displayN };
}
