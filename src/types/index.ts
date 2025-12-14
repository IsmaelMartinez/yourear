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
  age?: number;
  createdAt: Date;
  updatedAt: Date;
  thresholds: HearingThreshold[];
}

// Standard audiometric frequencies (octave intervals)
export const TEST_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000] as const;

// Extended frequencies including inter-octave (half-octave) frequencies
export const EXTENDED_FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] as const;

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

// Quick test: 3 key frequencies, faster timing (~2 minutes)
export const QUICK_TEST_FREQUENCIES = [1000, 4000, 8000] as const;

export const QUICK_TEST_CONFIG: TestConfig = {
  ...DEFAULT_TEST_CONFIG,
  frequencies: QUICK_TEST_FREQUENCIES,
  toneDuration: 1000,     // Shorter tones (vs 1500ms in full test)
  responseDuration: 2500, // Faster response window (vs 3000ms)
};

// Detailed test: All frequencies including inter-octave (~15 minutes)
export const DETAILED_TEST_CONFIG: TestConfig = {
  ...DEFAULT_TEST_CONFIG,
  frequencies: EXTENDED_FREQUENCIES,
};

/**
 * Format a frequency value for display
 * @param hz - Frequency in Hertz
 * @param style - 'short' for "4k", 'full' for "4000", 'spoken' for "4 kilohertz"
 */
export function formatFrequency(hz: number, style: 'short' | 'full' | 'spoken' = 'short'): string {
  switch (style) {
    case 'spoken':
      return hz >= 1000 ? `${hz / 1000} kilohertz` : `${hz} hertz`;
    case 'full':
      return String(hz);
    case 'short':
    default:
      return hz >= 1000 ? `${hz / 1000}k` : String(hz);
  }
}

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

/**
 * Age-based expected hearing thresholds
 * Based on ISO 7029 standard for otologically normal persons
 * Values are in dB HL
 * 
 * - p10: 10th percentile (better than 90% of population)
 * - median: 50th percentile (typical for age)
 * - p90: 90th percentile (worse than 90% of population)
 */
export function getExpectedThresholds(age: number): Record<number, { p10: number; median: number; p90: number }> {
  // Simplified model based on ISO 7029 for males
  const ageOffset = Math.max(0, age - 20);
  
  // p10 is symmetrically better than median (roughly same offset as p90 is worse)
  // Minimum p10 is -5 dB (excellent hearing)
  const calcP10 = (medianCoef: number, p90Offset: number) => {
    const median = Math.round(ageOffset * medianCoef);
    const p90 = Math.round(ageOffset * (medianCoef + p90Offset) + p90Offset * 10);
    const range = p90 - median;
    return Math.max(-5, median - Math.round(range * 0.5));
  };
  
  return {
    125:  { p10: calcP10(0.05, 0.1), median: Math.round(ageOffset * 0.05), p90: Math.round(ageOffset * 0.15 + 8) },
    250:  { p10: calcP10(0.1, 0.1), median: Math.round(ageOffset * 0.1), p90: Math.round(ageOffset * 0.2 + 10) },
    500:  { p10: calcP10(0.15, 0.1), median: Math.round(ageOffset * 0.15), p90: Math.round(ageOffset * 0.25 + 10) },
    750:  { p10: calcP10(0.17, 0.13), median: Math.round(ageOffset * 0.17), p90: Math.round(ageOffset * 0.30 + 10) },
    1000: { p10: calcP10(0.2, 0.15), median: Math.round(ageOffset * 0.2), p90: Math.round(ageOffset * 0.35 + 10) },
    1500: { p10: calcP10(0.27, 0.18), median: Math.round(ageOffset * 0.27), p90: Math.round(ageOffset * 0.45 + 10) },
    2000: { p10: calcP10(0.35, 0.2), median: Math.round(ageOffset * 0.35), p90: Math.round(ageOffset * 0.55 + 10) },
    3000: { p10: calcP10(0.5, 0.3), median: Math.round(ageOffset * 0.5), p90: Math.round(ageOffset * 0.8 + 12) },
    4000: { p10: calcP10(0.7, 0.4), median: Math.round(ageOffset * 0.7), p90: Math.round(ageOffset * 1.1 + 15) },
    6000: { p10: calcP10(0.85, 0.45), median: Math.round(ageOffset * 0.85), p90: Math.round(ageOffset * 1.3 + 18) },
    8000: { p10: calcP10(1.0, 0.5), median: Math.round(ageOffset * 1.0), p90: Math.round(ageOffset * 1.5 + 20) },
  };
}
