import { Part, ProductionConfig } from '../types';

function normalDistribution(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  const passes = 3;
  
  for (let pass = 0; pass < passes; pass++) {
    // Lokale Durchmischung
    for (let i = shuffled.length - 1; i > 0; i--) {
      const maxOffset = Math.min(i + 1, 50);
      const j = i - Math.floor(Math.random() * maxOffset);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Globale Durchmischung
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }
  
  return shuffled;
}

export function generateParts(config: ProductionConfig): Part[] {
  let parts: Part[];
  if (config.distribution === 'normal') {
    const batchSize = 100;
    parts = [];
    for (let i = 0; i < config.totalParts; i += batchSize) {
      const currentBatch = Math.min(batchSize, config.totalParts - i);
      const batch = Array.from({ length: currentBatch }, () => ({
        weight: normalDistribution(config.normalMean, config.normalDeviation)
      }));
      parts.push(...shuffleArray(batch));
    }
  } else {
    const totalPercentage = config.manualGroups.reduce((sum, g) => sum + g.count, 0);
    parts = [];
    
    for (const group of config.manualGroups) {
      const count = Math.round((group.count / totalPercentage) * config.totalParts);
      const groupParts = Array.from({ length: count }, () => ({
        weight: group.weight + (Math.random() * 0.02 - 0.01)
      }));
      parts.push(...shuffleArray(groupParts));
    }
  }
  
  return shuffleArray(parts);
}

export function takeSample(parts: Part[], sampleSize: number): Part[] {
  return shuffleArray([...parts]).slice(0, sampleSize);
}

export function calibrate(sample: Part[], referenceParts: number) {
  const totalWeight = sample.reduce((sum, part) => sum + part.weight, 0);
  return {
    averageWeight: totalWeight / referenceParts,
    totalWeight: Math.round(totalWeight * 10) / 10,
    sampleSize: referenceParts
  };
}

export function weighSample(sample: Part[], calibration: { averageWeight: number }) {
  const STEP_SIZE = Math.min(10, Math.ceil(sample.length / 100)); // Dynamische Schrittgröße
  const measurementPoints = [];
  let accumulatedWeight = 0;
  let accumulatedParts = 0;
  
  for (let i = 0; i < sample.length; i += STEP_SIZE) {
    const stepSample = sample.slice(i, Math.min(i + STEP_SIZE, sample.length));
    const stepWeight = stepSample.reduce((sum, part) => sum + part.weight, 0);
    
    accumulatedWeight += stepWeight;
    accumulatedParts += stepSample.length;
    
    // Nur jeden 100. Messpunkt speichern bei großen Mengen
    if (sample.length <= 1000 || accumulatedParts % Math.ceil(sample.length / 100) === 0) {
      const displayWeight = Math.round(accumulatedWeight * 10) / 10;
      const estimatedParts = Math.round(displayWeight / calibration.averageWeight);
      
      measurementPoints.push({
        parts: accumulatedParts,
        estimatedParts: estimatedParts,
        error: estimatedParts - accumulatedParts
      });
    }
  }
  
  // Sicherstellen, dass der letzte Messpunkt immer enthalten ist
  const finalWeight = Math.round(accumulatedWeight * 10) / 10;
  const finalEstimatedParts = Math.round(finalWeight / calibration.averageWeight);
  
  if (measurementPoints[measurementPoints.length - 1]?.parts !== sample.length) {
    measurementPoints.push({
      parts: sample.length,
      estimatedParts: finalEstimatedParts,
      error: finalEstimatedParts - sample.length
    });
  }
  
  return {
    totalWeight: finalWeight,
    estimatedTotalParts: finalEstimatedParts,
    actualTotalParts: sample.length,
    error: finalEstimatedParts - sample.length,
    measurementPoints
  };
}
