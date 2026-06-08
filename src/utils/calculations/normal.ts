import { jStat } from 'jstat';

export function calculateNormalProb(x: number, mean: number, stdDev: number, modeIdx: number): number {
  let prob = jStat.normal.cdf(x, mean, stdDev);
  if (modeIdx === 1) { // P(X >= x)
    prob = 1 - prob;
  }
  return prob;
}

export function generateNormalSamples(mean: number, stdDev: number, N: number): number[] {
  const samples: number[] = [];
  for (let i = 0; i < N; i++) {
    samples.push(jStat.normal.sample(mean, stdDev));
  }
  return samples;
}

export function getNormalStats(mean: number, stdDev: number) {
  return [
    { label: 'E[X]', value: mean },
    { label: 'Var(X)', value: +(stdDev * stdDev).toFixed(4) }
  ];
}

export function getZScore(x: number, mean: number, stdDev: number): number {
  return (x - mean) / stdDev;
}

export function generateNormalChartPaths(mean: number, stdDev: number, x: number, modeIdx: number, isValid: boolean) {
  const pMean = isValid ? mean : 0;
  const pStd = isValid ? stdDev : 1;
  const pX = isValid ? x : 0;
  
  const width = 300;
  const height = 150;
  const minZ = -4;
  const maxZ = 4;
  
  const zX = (pX - pMean) / pStd;
  const boundedZx = Math.max(minZ, Math.min(maxZ, zX));

  const points: {x: number, y: number}[] = [];
  const steps = 100;
  
  for (let i = 0; i <= steps; i++) {
    const z = minZ + (i / steps) * (maxZ - minZ);
    const pdf = jStat.normal.pdf(z, 0, 1);
    
    const px = ((z - minZ) / (maxZ - minZ)) * width;
    const py = height - (pdf / 0.45) * height;
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

  return { curvePath: pathString, shadedPath: shadedPathStr, plotMean: pMean, plotStdDev: pStd };
}
