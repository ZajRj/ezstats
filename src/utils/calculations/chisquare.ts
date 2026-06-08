import { jStat } from 'jstat';

export function calculateChiSquareProb(x: number, dof: number, modeIdx: number): number {
  let prob = jStat.chisquare.cdf(x, dof);
  if (modeIdx === 1) { // P(X >= x)
    prob = 1 - prob;
  }
  return prob;
}

export function generateChiSquareSamples(dof: number, N: number): number[] {
  const samples: number[] = [];
  for (let i = 0; i < N; i++) {
    samples.push(jStat.chisquare.sample(dof));
  }
  return samples;
}

export function getChiSquareStats(dof: number) {
  return [
    { label: 'E[X]', value: dof },
    { label: 'Var(X)', value: 2 * dof },
    { label: 'FGM M(t)', value: '(1 - 2t)^(-k/2)' }
  ];
}

export function generateChiSquareChartPaths(dof: number, x: number, modeIdx: number, isValid: boolean) {
  const pDof = isValid ? dof : 5;
  const pX = isValid ? x : 0;
  
  const width = 300;
  const height = 150;
  const minZ = 0;
  // Mean is k, stdDev is sqrt(2k). Plot up to mean + 4 stdDevs
  const maxZ = Math.max(pDof + 4 * Math.sqrt(2 * pDof), pX + Math.sqrt(2 * pDof));
  
  const boundedZx = Math.max(minZ, Math.min(maxZ, pX));

  const points: {x: number, y: number}[] = [];
  const steps = 200;
  
  // Find max PDF for scaling. Peak is at max(k-2, 0)
  const peakX = Math.max(pDof - 2, 0.1); // Avoid 0 if k <= 2 due to infinity limit
  let maxPdf = jStat.chisquare.pdf(peakX, pDof);
  // Cap maxPdf if it tends to infinity (when dof <= 2, x -> 0)
  if (maxPdf > 10 || !isFinite(maxPdf)) maxPdf = 1;
  
  for (let i = 0; i <= steps; i++) {
    const z = minZ + (i / steps) * (maxZ - minZ);
    // Add small epsilon to z to avoid infinity at x=0 for dof <= 2
    let pdf = jStat.chisquare.pdf(z === 0 ? 0.01 : z, pDof);
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
