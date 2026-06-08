import { jStat } from 'jstat';

export function calculateExponentialProb(x: number, lambda: number, modeIdx: number): number {
  let prob = jStat.exponential.cdf(x, lambda);
  if (modeIdx === 1) { // P(X >= x)
    prob = 1 - prob;
  }
  return prob;
}

export function generateExponentialSamples(lambda: number, N: number): number[] {
  const samples: number[] = [];
  for (let i = 0; i < N; i++) {
    samples.push(jStat.exponential.sample(lambda));
  }
  return samples;
}

export function getExponentialStats(lambda: number) {
  return [
    { label: 'E[X]', value: +(1 / lambda).toFixed(4) },
    { label: 'Var(X)', value: +(1 / (lambda * lambda)).toFixed(4) }
  ];
}

export function generateExponentialChartPaths(lambda: number, x: number, modeIdx: number, isValid: boolean) {
  const pLambda = isValid ? lambda : 1;
  const pX = isValid ? x : 0;
  
  const width = 300;
  const height = 150;
  const minZ = 0;
  const maxZ = Math.max(3 / pLambda, pX + 1 / pLambda);
  
  const boundedZx = Math.max(minZ, Math.min(maxZ, pX));

  const points: {x: number, y: number}[] = [];
  const steps = 100;
  const maxPdf = jStat.exponential.pdf(0, pLambda); 
  
  for (let i = 0; i <= steps; i++) {
    const z = minZ + (i / steps) * (maxZ - minZ);
    const pdf = jStat.exponential.pdf(z, pLambda);
    
    const px = ((z - minZ) / (maxZ - minZ)) * width;
    const py = height - (pdf / maxPdf) * height * 0.9;
    points.push({ x: px, y: py });
  }

  const pathString = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  let shadedPoints = [];
  if (isValid) {
    if (modeIdx === 0) { 
      shadedPoints = points.filter((_, i) => {
        const z = minZ + (i / steps) * (maxZ - minZ);
        return z <= boundedZx;
      });
    } else { 
      shadedPoints = points.filter((_, i) => {
        const z = minZ + (i / steps) * (maxZ - minZ);
        return z >= boundedZx;
      });
    }
  }

  let shadedPathStr = '';
  if (shadedPoints.length > 0) {
    const first = shadedPoints[0];
    const last = shadedPoints[shadedPoints.length - 1];
    shadedPathStr = `M ${first.x} ${height} ` + 
      shadedPoints.map(p => `L ${p.x} ${p.y}`).join(' ') + 
      ` L ${last.x} ${height} Z`;
  }

  return { curvePath: pathString, shadedPath: shadedPathStr, maxX: maxZ };
}
