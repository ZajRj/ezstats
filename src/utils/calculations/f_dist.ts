import { jStat } from 'jstat';

export function calculateFProb(x: number, df1: number, df2: number, modeIdx: number): number {
  let prob = jStat.centralF.cdf(x, df1, df2);
  if (modeIdx === 1) { // P(X >= x)
    prob = 1 - prob;
  }
  return prob;
}

export interface FSimulationRow {
  i: number;
  u: number;
  x: number;
}

export function generateFSamples(df1: number, df2: number, N: number): { samples: number[], tableData: FSimulationRow[] } {
  const samples: number[] = [];
  const tableData: FSimulationRow[] = [];
  for (let i = 0; i < N; i++) {
    const u = Math.random();
    const x = jStat.centralF.inv(u, df1, df2);
    samples.push(x);
    if (i < 50) {
      tableData.push({ i: i + 1, u, x });
    }
  }
  return { samples, tableData };
}

export function getFStats(df1: number, df2: number) {
  let mean = 'Undefined';
  let variance = 'Undefined';
  
  if (df2 > 2) {
    mean = (df2 / (df2 - 2)).toFixed(4);
  }
  if (df2 > 4) {
    const num = 2 * df2 * df2 * (df1 + df2 - 2);
    const den = df1 * (df2 - 2) * (df2 - 2) * (df2 - 4);
    variance = (num / den).toFixed(4);
  }
  
  return [
    { label: 'E[X]', value: mean },
    { label: 'Var(X)', value: variance }
  ];
}

export function generateFChartPaths(df1: number, df2: number, x: number, modeIdx: number, isValid: boolean) {
  const pDf1 = isValid ? df1 : 5;
  const pDf2 = isValid ? df2 : 5;
  const pX = isValid ? x : 0;
  
  const width = 300;
  const height = 150;
  const minZ = 0;
  const maxZ = Math.max(5, pX + 2); // F distribution has long right tail
  
  const boundedZx = Math.max(minZ, Math.min(maxZ, pX));

  const points: {x: number, y: number}[] = [];
  const steps = 200;
  
  let maxPdf = 0;
  for (let i = 0; i <= steps; i++) {
    const z = minZ + (i / steps) * (maxZ - minZ);
    const pdf = jStat.centralF.pdf(z === 0 ? 0.01 : z, pDf1, pDf2);
    if (isFinite(pdf) && pdf > maxPdf) maxPdf = pdf;
  }
  if (maxPdf === 0 || !isFinite(maxPdf)) maxPdf = 1;
  if (maxPdf > 10) maxPdf = 1;
  
  for (let i = 0; i <= steps; i++) {
    const z = minZ + (i / steps) * (maxZ - minZ);
    let pdf = jStat.centralF.pdf(z === 0 ? 0.01 : z, pDf1, pDf2);
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

  return { curvePath: pathString, shadedPath: shadedPathStr };
}
