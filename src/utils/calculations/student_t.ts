import { jStat } from 'jstat';

export function calculateStudentTProb(x: number, dof: number, modeIdx: number): number {
  let prob = jStat.studentt.cdf(x, dof);
  if (modeIdx === 1) { // P(X >= x)
    prob = 1 - prob;
  }
  return prob;
}

export interface StudentTSimulationRow {
  i: number;
  u: number;
  x: number;
}

export function generateStudentTSamples(dof: number, N: number): { samples: number[], tableData: StudentTSimulationRow[] } {
  const samples: number[] = [];
  const tableData: StudentTSimulationRow[] = [];
  for (let i = 0; i < N; i++) {
    const u = Math.random();
    const x = jStat.studentt.inv(u, dof);
    samples.push(x);
    if (i < 50) {
      tableData.push({ i: i + 1, u, x });
    }
  }
  return { samples, tableData };
}

export function getStudentTStats(dof: number) {
  return [
    { label: 'E[X]', value: dof > 1 ? 0 : 'Undefined' },
    { label: 'Var(X)', value: dof > 2 ? +(dof / (dof - 2)).toFixed(4) : (dof > 1 ? 'Infinity' : 'Undefined') }
  ];
}

export function generateStudentTChartPaths(dof: number, x: number, modeIdx: number, isValid: boolean) {
  const pDof = isValid ? dof : 5;
  const pX = isValid ? x : 0;
  
  const width = 300;
  const height = 150;
  const minZ = -4;
  const maxZ = 4;
  
  const boundedZx = Math.max(minZ, Math.min(maxZ, pX));

  const points: {x: number, y: number}[] = [];
  const steps = 200;
  
  const maxPdf = jStat.studentt.pdf(0, pDof);
  
  for (let i = 0; i <= steps; i++) {
    const z = minZ + (i / steps) * (maxZ - minZ);
    const pdf = jStat.studentt.pdf(z, pDof);
    
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
