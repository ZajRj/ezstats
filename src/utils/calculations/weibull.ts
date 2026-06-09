import { jStat } from 'jstat';

export function calculateWeibullProb(x: number, scale: number, shape: number, modeIdx: number): number {
  let prob = jStat.weibull.cdf(x, scale, shape);
  if (modeIdx === 1) { // P(X >= x)
    prob = 1 - prob;
  }
  return prob;
}

export interface WeibullSimulationRow {
  i: number;
  u: number;
  x: number;
}

export function generateWeibullSamples(lambda: number, k: number, N: number): { samples: number[], tableData: WeibullSimulationRow[] } {
  const samples: number[] = [];
  const tableData: WeibullSimulationRow[] = [];
  for (let i = 0; i < N; i++) {
    const u = Math.random();
    const x = lambda * Math.pow(-Math.log(1 - u), 1 / k);
    samples.push(x);
    if (i < 50) {
      tableData.push({ i: i + 1, u, x });
    }
  }
  return { samples, tableData };
}

export function getWeibullStats(scale: number, shape: number) {
  // Mean = λ * Γ(1 + 1/k)
  const mean = scale * jStat.gammafn(1 + 1 / shape);
  
  // Var = λ² * [Γ(1 + 2/k) - (Γ(1 + 1/k))²]
  const variance = Math.pow(scale, 2) * (jStat.gammafn(1 + 2 / shape) - Math.pow(jStat.gammafn(1 + 1 / shape), 2));

  return [
    { label: 'E[X]', value: +mean.toFixed(4) },
    { label: 'Var(X)', value: +variance.toFixed(4) },
    { label: 'FGM M(t)', value: 'No closed form' }
  ];
}

export function generateWeibullChartPaths(scale: number, shape: number, x: number, modeIdx: number, isValid: boolean) {
  const pScale = isValid ? scale : 1;
  const pShape = isValid ? shape : 1.5;
  const pX = isValid ? x : 0;
  
  const width = 300;
  const height = 150;
  const minZ = 0;
  
  const mean = pScale * jStat.gammafn(1 + 1 / pShape);
  const variance = Math.pow(pScale, 2) * (jStat.gammafn(1 + 2 / pShape) - Math.pow(jStat.gammafn(1 + 1 / pShape), 2));
  const stdDev = Math.sqrt(variance);
  
  const maxZ = Math.max(mean + 4 * stdDev, pX + stdDev);
  
  const boundedZx = Math.max(minZ, Math.min(maxZ, pX));

  const points: {x: number, y: number}[] = [];
  const steps = 200;
  
  // Find peak for scaling
  const peakX = pShape > 1 ? pScale * Math.pow((pShape - 1) / pShape, 1 / pShape) : 0.1;
  let maxPdf = jStat.weibull.pdf(peakX, pScale, pShape);
  if (maxPdf > 10 || !isFinite(maxPdf)) maxPdf = 1;
  
  for (let i = 0; i <= steps; i++) {
    const z = minZ + (i / steps) * (maxZ - minZ);
    let pdf = jStat.weibull.pdf(z === 0 ? 0.01 : z, pScale, pShape);
    if (!isFinite(pdf) || pdf > maxPdf * 2) pdf = maxPdf * 2;
    
    const px = ((z - minZ) / (maxZ - minZ)) * width;
    const py = height - (pdf / maxPdf) * height * 0.9;
    points.push({ x: px, y: py });
  }

  const pathString = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  let shadedPoints: {x: number, y: number}[] = [];
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
