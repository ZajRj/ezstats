import { jStat } from 'jstat';

export function calculateUniformProb(x: number, a: number, b: number, modeIdx: number): number {
  let prob = jStat.uniform.cdf(x, a, b);
  if (modeIdx === 1) { // P(X >= x)
    prob = 1 - prob;
  }
  return prob;
}

export interface UniformSimulationRow {
  i: number;
  u: number;
  x: number;
}

export function generateUniformSamples(a: number, b: number, N: number): { samples: number[], tableData: UniformSimulationRow[] } {
  const samples: number[] = [];
  const tableData: UniformSimulationRow[] = [];
  for (let i = 0; i < N; i++) {
    const u = Math.random();
    const x = a + u * (b - a);
    samples.push(x);
    if (i < 50) {
      tableData.push({ i: i + 1, u, x });
    }
  }
  return { samples, tableData };
}

export function getUniformStats(a: number, b: number) {
  return [
    { label: 'E[X]', value: +((a + b) / 2).toFixed(4) },
    { label: 'Var(X)', value: +(Math.pow(b - a, 2) / 12).toFixed(4) },
    { label: 'FGM M(t)', value: '(e^(tb) - e^(ta)) / t(b-a)' }
  ];
}

export function generateUniformChartPaths(a: number, b: number, x: number, modeIdx: number, isValid: boolean) {
  const pA = isValid ? a : 0;
  const pB = isValid ? b : 10;
  const pX = isValid ? x : 5;
  
  const width = 300;
  const height = 150;
  
  // Add 20% padding to visual domain
  const range = pB - pA;
  const vMin = pA - range * 0.2;
  const vMax = pB + range * 0.2;
  
  const boundedX = Math.max(pA, Math.min(pB, pX));

  const points: {x: number, y: number}[] = [];
  const steps = 200;
  const pA_x = ((pA - vMin) / (vMax - vMin)) * width;
  const pB_x = ((pB - vMin) / (vMax - vMin)) * width;
  
  const lineY = height * 0.2;

  points.push({ x: 0, y: height });
  points.push({ x: pA_x, y: height });
  points.push({ x: pA_x, y: lineY });
  points.push({ x: pB_x, y: lineY });
  points.push({ x: pB_x, y: height });
  points.push({ x: width, y: height });

  const pathString = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  let shadedPathStr = '';
  if (isValid) {
    const pX_x = ((boundedX - vMin) / (vMax - vMin)) * width;
    if (modeIdx === 0) { 
      shadedPathStr = `M ${pA_x} ${height} L ${pA_x} ${lineY} L ${pX_x} ${lineY} L ${pX_x} ${height} Z`;
    } else { 
      shadedPathStr = `M ${pX_x} ${height} L ${pX_x} ${lineY} L ${pB_x} ${lineY} L ${pB_x} ${height} Z`;
    }
  }

  return { curvePath: pathString, shadedPath: shadedPathStr, viewMin: vMin, viewMax: vMax };
}
