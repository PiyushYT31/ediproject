import { WorkerProfile } from "@/src/types";
import { calculateDistance } from "./geofencing";

/**
 * AI Recommendation Engine for WorkSphere
 * Formula: Sw = αRw + β(1/Dw) + γCw
 * R: Average Rating
 * D: Distance (in km)
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
  const normalizedRating = (worker.rating || 0) / 5;
  
  // Normalize distance (inverse distance, 0-1)
  // We use a small epsilon to avoid division by zero
  const safeDistance = Math.max(0.1, distance);
  const normalizedDistance = Math.min(1, 1 / (1 + safeDistance / 5));
  
  // Completion rate is 0-1 (or percentage / 100)
  const rawCompletion = worker.completionRate ?? 1;
  const completionRate = rawCompletion > 1 ? rawCompletion / 100 : rawCompletion;
  
  // Weighted score
  let score = (weights.alpha * normalizedRating) + 
              (weights.beta * normalizedDistance) + 
              (weights.gamma * completionRate);
              
  // Fairness Factor: Logistic function adjustment
  // This ensures jobs are distributed fairly among the community
  // and not just the top-rated few.
  const fairnessFactor = 1 / (1 + Math.exp(-((worker.totalJobs || 0) / 100)));
  
  // We subtract a small portion of the score based on total jobs to give new workers a chance
  score = score * (1 - (fairnessFactor * 0.1));
  
  return Math.round(score * 100) / 100;
}

export function rankWorkers(
  workers: WorkerProfile[],
  userLocation: { latitude: number; longitude: number }
): (WorkerProfile & { score: number; distance: number })[] {
  return workers.map((worker, index) => {
    let distance = 2.5; // fallback default km
    if (
      worker.location &&
      typeof worker.location.latitude === 'number' &&
      typeof worker.location.longitude === 'number' &&
      (worker.location.latitude !== 0 || worker.location.longitude !== 0)
    ) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        worker.location.latitude,
        worker.location.longitude
      );
    } else {
      // Deterministic distance based on index so it doesn't jump on every render
      distance = 1.2 + ((index * 1.7) % 8);
    }

    const roundedDistance = Math.round(distance * 10) / 10;
    const score = calculateWorkerScore(worker, roundedDistance);
    
    return {
      ...worker,
      score,
      distance: roundedDistance
    };
  }).sort((a, b) => b.score - a.score);
}
