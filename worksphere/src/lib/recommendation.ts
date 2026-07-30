import { WorkerProfile } from "@/src/types";

/**
 * AI Recommendation Engine for WorkSphere
 * Formula: Sw = αRw + β(1/Dw) + γCw
 * R: Average Rating
 * D: Distance
 * C: Job Completion Rate
 */

interface ScoringWeights {
  alpha: number; // Rating weight
  beta: number;  // Distance weight
  gamma: number; // Completion rate weight
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  alpha: 0.4,
  beta: 0.4,
  gamma: 0.2,
};

export function calculateWorkerScore(
  worker: WorkerProfile,
  distance: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  // Normalize rating (0-5 to 0-1)
  const normalizedRating = worker.rating / 5;
  
  // Normalize distance (inverse distance, 0-1)
  // We use a small epsilon to avoid division by zero
  const normalizedDistance = 1 / (distance + 0.1);
  
  // Completion rate is already 0-1
  const completionRate = worker.completionRate;
  
  // Weighted score
  let score = (weights.alpha * normalizedRating) + 
              (weights.beta * normalizedDistance) + 
              (weights.gamma * completionRate);
              
  // Fairness Factor: Logistic function adjustment
  // This ensures jobs are distributed fairly among the community
  // and not just the top-rated few.
  const fairnessFactor = 1 / (1 + Math.exp(-(worker.totalJobs / 100)));
  
  // We subtract a small portion of the score based on total jobs to give new workers a chance
  score = score * (1 - (fairnessFactor * 0.1));
  
  return score;
}

export function rankWorkers(
  workers: WorkerProfile[],
  userLocation: { latitude: number; longitude: number }
): (WorkerProfile & { score: number; distance: number })[] {
  return workers.map(worker => {
    // Simulated distance calculation (Haversine formula would be used in production)
    const distance = Math.random() * 10; // Mock distance 0-10km
    const score = calculateWorkerScore(worker, distance);
    
    return {
      ...worker,
      score,
      distance
    };
  }).sort((a, b) => b.score - a.score);
}
