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
const EXTENDED_FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] as const;

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
const QUICK_TEST_FREQUENCIES = [1000, 4000, 8000] as const;

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

export type TestMode = 'full' | 'quick' | 'detailed';

/** Each test mode's display metadata and config; `minutes` is the approximate duration */
export const TEST_MODES: Record<TestMode, { icon: string; label: string; config: TestConfig; minutes: number; note?: string }> = {
  full: { icon: '🎵', label: 'Full Test', config: DEFAULT_TEST_CONFIG, minutes: 8 },
  quick: { icon: '⚡', label: 'Quick Test', config: QUICK_TEST_CONFIG, minutes: 2 },
  detailed: { icon: '🔬', label: 'Detailed Test', config: DETAILED_TEST_CONFIG, minutes: 15, note: 'incl. inter-octave' },
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

export const GRADE_LABELS: Record<HearingLossGrade, { icon: string; label: string }> = {
  'normal': { icon: '✅', label: 'Normal' },
  'slight': { icon: '🟢', label: 'Slight loss' },
  'mild': { icon: '🟡', label: 'Mild loss' },
  'moderate': { icon: '🟠', label: 'Moderate loss' },
  'moderately-severe': { icon: '🟠', label: 'Moderately severe loss' },
  'severe': { icon: '🔴', label: 'Severe loss' },
  'profound': { icon: '🔴', label: 'Profound loss' },
};

/** Standard pure-tone average frequencies */
export const PTA_FREQUENCIES: readonly number[] = [500, 1000, 2000];

export interface PTAResult {
  value: number;
  frequencies: number[];
  /** False when fewer than two PTA frequencies were tested (e.g. Quick Test) and all tested frequencies were averaged */
  standard: boolean;
}

/**
 * Pure-tone average for one ear over 500/1000/2000 Hz, falling back to the
 * average of every tested frequency when fewer than two of those were tested.
 */
export function calculatePTA(thresholds: HearingThreshold[], ear: 'rightEar' | 'leftEar'): PTAResult | null {
  const tested = thresholds.filter(t => Number.isFinite(t[ear]));
  const ptaTested = tested.filter(t => PTA_FREQUENCIES.includes(t.frequency));
  const standard = ptaTested.length >= 2;
  const used = standard ? ptaTested : tested;
  if (used.length === 0) return null;
  return {
    value: used.reduce((sum, t) => sum + (t[ear] as number), 0) / used.length,
    frequencies: used.map(t => t.frequency),
    standard,
  };
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
  
  // p10 sits half the median-to-p90 spread below the median, floored at -5 dB HL.
  // The 0.5 factor is a simplification, not a value taken from ISO 7029's tables.
  const band = (median: number, p90: number) =>
    ({ p10: Math.max(-5, median - Math.round((p90 - median) * 0.5)), median, p90 });

  return {
    125:  band(Math.round(ageOffset * 0.05), Math.round(ageOffset * 0.15 + 8)),
    250:  band(Math.round(ageOffset * 0.1), Math.round(ageOffset * 0.2 + 10)),
    500:  band(Math.round(ageOffset * 0.15), Math.round(ageOffset * 0.25 + 10)),
    750:  band(Math.round(ageOffset * 0.17), Math.round(ageOffset * 0.30 + 10)),
    1000: band(Math.round(ageOffset * 0.2), Math.round(ageOffset * 0.35 + 10)),
    1500: band(Math.round(ageOffset * 0.27), Math.round(ageOffset * 0.45 + 10)),
    2000: band(Math.round(ageOffset * 0.35), Math.round(ageOffset * 0.55 + 10)),
    3000: band(Math.round(ageOffset * 0.5), Math.round(ageOffset * 0.8 + 12)),
    4000: band(Math.round(ageOffset * 0.7), Math.round(ageOffset * 1.1 + 15)),
    6000: band(Math.round(ageOffset * 0.85), Math.round(ageOffset * 1.3 + 18)),
    8000: band(Math.round(ageOffset * 1.0), Math.round(ageOffset * 1.5 + 20)),
  };
}

export type AgeVerdict = 'better' | 'typical' | 'worse';

export const AGE_VERDICT_LABELS: Record<AgeVerdict, { icon: string; label: string }> = {
  better: { icon: '✨', label: 'Your hearing is better than or equal to average for your age.' },
  typical: { icon: '👍', label: 'Your hearing is typical for your age.' },
  worse: { icon: '📋', label: 'Your hearing shows more loss than typical for your age.' },
};

/**
 * Compare the mean of the available ear PTAs with the age-expected median,
 * taken per ear over the frequencies that ear's PTA used.
 */
export function compareToAge(
  age: number,
  right: PTAResult | null,
  left: PTAResult | null
): { average: number; expected: number; verdict: AgeVerdict } | null {
  const ptas = [right, left].filter((p): p is PTAResult => p !== null);
  if (ptas.length === 0) return null;
  const medians = getExpectedThresholds(age);
  const mean = (xs: number[]) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const expected = mean(ptas.map(p => mean(p.frequencies.map(f => medians[f].median))));
  const average = mean(ptas.map(p => p.value));
  const verdict = average <= expected ? 'better' : average <= expected + 10 ? 'typical' : 'worse';
  return { average, expected, verdict };
}
