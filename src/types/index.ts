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
 * Age-based expected hearing thresholds (median values)
 * Based on ISO 7029 standard for otologically normal persons
 * Values are in dB HL
 */
export function getExpectedThresholds(age: number): Record<number, { median: number; p90: number }> {
  // Simplified model based on ISO 7029 for males
  // p90 = 90th percentile (worse than 90% of population)
  const ageOffset = Math.max(0, age - 20);
  
  return {
    125:  { median: Math.round(ageOffset * 0.05), p90: Math.round(ageOffset * 0.15 + 8) },
    250:  { median: Math.round(ageOffset * 0.1), p90: Math.round(ageOffset * 0.2 + 10) },
    500:  { median: Math.round(ageOffset * 0.15), p90: Math.round(ageOffset * 0.25 + 10) },
    750:  { median: Math.round(ageOffset * 0.17), p90: Math.round(ageOffset * 0.30 + 10) },
    1000: { median: Math.round(ageOffset * 0.2), p90: Math.round(ageOffset * 0.35 + 10) },
    1500: { median: Math.round(ageOffset * 0.27), p90: Math.round(ageOffset * 0.45 + 10) },
    2000: { median: Math.round(ageOffset * 0.35), p90: Math.round(ageOffset * 0.55 + 10) },
    3000: { median: Math.round(ageOffset * 0.5), p90: Math.round(ageOffset * 0.8 + 12) },
    4000: { median: Math.round(ageOffset * 0.7), p90: Math.round(ageOffset * 1.1 + 15) },
    6000: { median: Math.round(ageOffset * 0.85), p90: Math.round(ageOffset * 1.3 + 18) },
    8000: { median: Math.round(ageOffset * 1.0), p90: Math.round(ageOffset * 1.5 + 20) },
  };
}
