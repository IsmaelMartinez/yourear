/**
 * Represents a single hearing threshold measurement
 */
export interface HearingThreshold {
  frequency: number; // Hz
  leftEar: number | null; // dB HL (hearing level), null if not tested
  rightEar: number | null;
}

/**
 * Complete hearing profile for a user
 */
export interface HearingProfile {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  thresholds: HearingThreshold[];
  notes?: string;
}

/**
 * Standard audiometric test frequencies (Hz)
 */
export const TEST_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000] as const;
export type TestFrequency = (typeof TEST_FREQUENCIES)[number];

/**
 * Extended frequencies for more detailed testing
 */
export const EXTENDED_FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] as const;

/**
 * Which ear is being tested
 */
export type Ear = 'left' | 'right';

/**
 * Current state of the hearing test
 */
export interface TestState {
  currentFrequency: number;
  currentEar: Ear;
  currentLevel: number; // dB
  isPlaying: boolean;
  responses: Map<string, number>; // key: `${ear}-${freq}`, value: threshold dB
  phase: 'idle' | 'calibrating' | 'testing' | 'complete';
}

/**
 * Test configuration options
 */
export interface TestConfig {
  frequencies: readonly number[];
  startLevel: number; // Initial dB level
  minLevel: number; // Quietest level to test
  maxLevel: number; // Loudest level to test
  stepUp: number; // dB increase when not heard
  stepDown: number; // dB decrease when heard
  toneDuration: number; // ms
  responseDuration: number; // ms to wait for response
}

/**
 * Default test configuration following simplified Hughson-Westlake
 */
export const DEFAULT_TEST_CONFIG: TestConfig = {
  frequencies: TEST_FREQUENCIES,
  startLevel: 40, // Start at moderate level
  minLevel: -10, // Audiometric zero can vary
  maxLevel: 90, // Safety limit
  stepUp: 5, // Standard 5 dB steps
  stepDown: 10,
  toneDuration: 1500, // 1.5 seconds
  responseDuration: 3000, // 3 seconds to respond
};

/**
 * Hearing loss classification based on WHO standards
 */
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
