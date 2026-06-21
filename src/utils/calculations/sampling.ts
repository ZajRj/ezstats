import { jStat } from 'jstat';

export type PopulationType = 'uniform' | 'normal' | 'exponential';

export interface SamplingResult {
  populationMean: number;
  populationVariance: number;
  theoreticalSampleVariance: number;
  
  actualSampleMeanAverage: number;
  actualSampleMeanVariance: number;
  
  sampleMeans: number[];
}

export function runSamplingSimulation(
  popType: PopulationType, 
  n: number, 
  M: number
): SamplingResult {
  const sampleMeans: number[] = [];
  
  let popMean = 0;
  let popVar = 0;

  for (let i = 0; i < M; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      let val = 0;
      if (popType === 'uniform') {
        val = jStat.uniform.sample(0, 10);
        popMean = 5; // (0+10)/2
        popVar = 100 / 12; // (10-0)^2 / 12
      } else if (popType === 'normal') {
        val = jStat.normal.sample(100, 15);
        popMean = 100;
        popVar = 225; // 15^2
      } else if (popType === 'exponential') {
        val = jStat.exponential.sample(1); // lambda = 1
        popMean = 1;
        popVar = 1;
      }
      sum += val;
    }
    sampleMeans.push(sum / n);
  }

  const actualSampleMeanAverage = jStat.mean(sampleMeans);
  const actualSampleMeanVariance = jStat.variance(sampleMeans, true); // Use sample variance of the means for comparison

  return {
    populationMean: popMean,
    populationVariance: popVar,
    theoreticalSampleVariance: popVar / n,
    actualSampleMeanAverage,
    actualSampleMeanVariance,
    sampleMeans
  };
}
