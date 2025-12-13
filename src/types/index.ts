/**
 * Core types for YourEar hearing assessment
 */

export interface HearingThreshold {
  frequency: number;
  leftEar: number | null;
  rightEar: number | null;
}

export interface HearingProfile {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  thresholds: HearingThreshold[];
}

export const TEST_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000] as const;

export interface TestState {
  currentFrequency: number;
  currentEar: 'left' | 'right';
  currentLevel: number;
  isPlaying: boolean;
  responses: Map<string, number>;
  phase: 'idle' | 'testing' | 'complete';
}

export interface TestConfig {
  frequencies: readonly number[];
  startLevel: number;
  minLevel: number;
  maxLevel: number;
  stepUp: number;
  stepDown: number;
  toneDuration: number;
  responseDuration: number;
}

export const DEFAULT_TEST_CONFIG: TestConfig = {
  frequencies: TEST_FREQUENCIES,
  startLevel: 40,
  minLevel: -10,
  maxLevel: 90,
  stepUp: 5,
  stepDown: 10,
  toneDuration: 1500,
  responseDuration: 3000,
};

export type HearingLossGrade = 
  | 'normal' 
  | 'slight' 
  | 'mild' 
  | 'moderate' 
  | 'moderately-severe' 
  | 'severe' 
  | 'profound';

export function classifyHearingLoss(thresholdDb: number): HearingLossGrade {
  if (thresholdDb <= 20) return 'normal';
  if (thresholdDb <= 25) return 'slight';
  if (thresholdDb <= 40) return 'mild';
  if (thresholdDb <= 55) return 'moderate';
  if (thresholdDb <= 70) return 'moderately-severe';
  if (thresholdDb <= 90) return 'severe';
  return 'profound';
}
