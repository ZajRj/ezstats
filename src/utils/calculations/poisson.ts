import { jStat } from 'jstat';

export function calculatePoissonProb(x: number, lambda: number, modeIdx: number): number {
  if (modeIdx === 0) {
    return jStat.poisson.pdf(x, lambda);
  } else if (modeIdx === 1) {
    return jStat.poisson.cdf(x, lambda);
  } else {
    return 1 - jStat.poisson.cdf(x - 1, lambda);
  }
}

export function generatePoissonSamples(lambda: number, N: number): number[] {
  const samples: number[] = [];
  for (let i = 0; i < N; i++) {
    samples.push(jStat.poisson.sample(lambda));
  }
  return samples;
}

export function getPoissonStats(lambda: number) {
  return [
    { label: 'E[X]', value: +lambda.toFixed(4) },
    { label: 'Var(X)', value: +lambda.toFixed(4) },
    { label: 'FGM M(t)', value: 'e^[λ(e^t - 1)]' }
  ];
}

export function generatePoissonChartPoints(lambda: number, x: number, modeIdx: number, isValid: boolean) {
  const pLambda = isValid ? lambda : 5;
  const pX = isValid ? x : -1;
  
  const width = 300;
  const height = 150;
  const maxPlot = Math.max(10, Math.ceil(pLambda + 3 * Math.sqrt(pLambda)));
  const displayN = Math.min(maxPlot, 30); 

  const barWidth = (width / (displayN + 1)) * 0.8;
  const gap = (width / (displayN + 1)) * 0.2;

  const points = [];
  let maxPdf = 0;
  
  for (let i = 0; i <= displayN; i++) {
    const pdf = jStat.poisson.pdf(i, pLambda);
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
