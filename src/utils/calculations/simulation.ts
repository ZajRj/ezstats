export type DistributionType = 'Normal' | 'Exponential' | 'Poisson';

export interface Stage {
  id: string;
  name: string;
  type: DistributionType;
  params: {
    mean?: number;
    stdDev?: number;
    lambda?: number; // Used for Poisson and as rate for Exponential in some contexts, but here Exponential uses mean = 1/lambda
  };
}

// Random generators
export function generateNormal(mean: number, stdDev: number): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const result = z0 * stdDev + mean;
  return result > 0 ? result : 0; // Prevent negative times
}

export function generateExponential(mean: number): number {
  const lambda = 1 / mean;
  let u = Math.random();
  while (u === 1 || u === 0) u = Math.random();
  return -(1 / lambda) * Math.log(1 - u);
}

export function generatePoisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export function generateRandomTime(stage: Stage): number {
  switch (stage.type) {
    case 'Normal':
      return generateNormal(stage.params.mean || 10, stage.params.stdDev || 2);
    case 'Exponential':
      return generateExponential(stage.params.mean || 12);
    case 'Poisson':
      return generatePoisson(stage.params.lambda || 10);
    default:
      return 0;
  }
}

export interface CarResult {
  id: number;
  stageTimes: Record<string, number>;
  totalProcessingTime: number;
  exitTime: number; // Time the car leaves the final stage
}

export function runCarWashSimulation(k: number, stages: Stage[]): CarResult[] {
  const results: CarResult[] = [];
  
  // exitTimes[i][j] = exit time of car i (0-indexed) at stage j (0-indexed)
  const exitTimes: number[][] = Array.from({ length: k }, () => Array(stages.length).fill(0));

  for (let i = 0; i < k; i++) {
    const stageTimes: Record<string, number> = {};
    let totalProcessingTime = 0;
    
    for (let j = 0; j < stages.length; j++) {
      const stage = stages[j];
      const time = generateRandomTime(stage);
      stageTimes[stage.id] = time;
      totalProcessingTime += time;
      
      const prevCarExitThisStage = i > 0 ? exitTimes[i - 1][j] : 0;
      const thisCarExitPrevStage = j > 0 ? exitTimes[i][j - 1] : 0;
      
      // Car can enter this stage only when it has finished the previous stage 
      // AND the previous car has left this stage.
      const startTime = Math.max(prevCarExitThisStage, thisCarExitPrevStage);
      exitTimes[i][j] = startTime + time;
    }

    results.push({
      id: i + 1,
      stageTimes,
      totalProcessingTime,
      exitTime: exitTimes[i][stages.length - 1]
    });
  }
  return results;
}

export function calculateMetrics(results: CarResult[], nHours: number) {
  if (results.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0, attendedInTime: 0 };
  
  const totalTimes = results.map(r => r.totalProcessingTime); // Metricas sobre tiempo de procesamiento (sin esperas)
  const n = totalTimes.length;
  
  const sum = totalTimes.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  const squaredDiffs = totalTimes.map(t => Math.pow(t - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const min = Math.min(...totalTimes);
  const max = Math.max(...totalTimes);
  
  const availableMinutes = nHours * 60;
  
  // Autos que terminan su paso completo antes del tiempo disponible
  const attendedInTime = results.filter(r => r.exitTime <= availableMinutes).length;

  return { mean, stdDev, min, max, attendedInTime };
}
