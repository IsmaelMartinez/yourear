/**
 * Reference Calibration
 * 
 * Allows users to calibrate their setup by adjusting a reference tone
 * to match a known loudness level (conversational speech ~60 dB SPL).
 * 
 * This provides a simple but meaningful accuracy improvement by establishing
 * a baseline for the user's specific hardware setup.
 */

// AudioContext singleton - reuse from tone-generator if possible
let audioContext: AudioContext | null = null;
let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;

/** Reference frequency for calibration (1kHz is standard) */
export const REFERENCE_FREQUENCY = 1000;

/** Default reference level in dB (starting point for adjustment) */
export const DEFAULT_REFERENCE_LEVEL = -30;

/** Minimum reference level (very quiet) */
export const MIN_REFERENCE_LEVEL = -60;

/** Maximum reference level (loud but safe) */
export const MAX_REFERENCE_LEVEL = -10;

/** Step size for level adjustment */
export const LEVEL_STEP = 2;

/** Storage key for calibration offset */
const CALIBRATION_STORAGE_KEY = 'yourear_calibration_offset';

/**
 * Calibration state
 */
export interface CalibrationState {
  /** Current adjusted level in dB */
  currentLevel: number;
  /** Whether calibration tone is playing */
  isPlaying: boolean;
  /** Whether calibration has been completed */
  isCalibrated: boolean;
  /** The saved calibration offset */
  savedOffset: number | null;
}

/**
 * Get or create audio context
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Ensure audio context is running
 */
async function ensureRunning(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
}

/**
 * Convert dB to linear gain
 */
function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Start playing the reference calibration tone
 */
export async function startCalibrationTone(level: number): Promise<void> {
  stopCalibrationTone();
  
  const ctx = await ensureRunning();
  
  activeOscillator = ctx.createOscillator();
  activeOscillator.type = 'sine';
  activeOscillator.frequency.value = REFERENCE_FREQUENCY;
  
  activeGain = ctx.createGain();
  const gain = dbToGain(Math.max(MIN_REFERENCE_LEVEL, Math.min(MAX_REFERENCE_LEVEL, level)));
  
  // Smooth ramp to avoid clicks
  activeGain.gain.setValueAtTime(0, ctx.currentTime);
  activeGain.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
  
  activeOscillator.connect(activeGain).connect(ctx.destination);
  activeOscillator.start();
}

/**
 * Update the level of the currently playing calibration tone
 */
export function updateCalibrationToneLevel(level: number): void {
  if (activeGain && audioContext) {
    const gain = dbToGain(Math.max(MIN_REFERENCE_LEVEL, Math.min(MAX_REFERENCE_LEVEL, level)));
    activeGain.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.05);
  }
}

/**
 * Stop the calibration tone
 */
export function stopCalibrationTone(): void {
  if (activeOscillator) {
    try {
      activeOscillator.stop();
    } catch {
      // Already stopped
    }
    activeOscillator.disconnect();
    activeOscillator = null;
  }
  if (activeGain) {
    activeGain.disconnect();
    activeGain = null;
  }
}

/**
 * Calculate the calibration offset based on user adjustment
 * 
 * The offset represents how many dB the user's system differs from
 * the assumed "standard" output level.
 * 
 * If the user set the level to -35 dB to match conversational speech,
 * and our reference was -30 dB, the offset is +5 dB (their system is quieter).
 */
export function calculateCalibrationOffset(adjustedLevel: number): number {
  // The target is conversational speech level
  // If user had to increase volume (higher dB), their system is quieter → positive offset
  // If user had to decrease volume (lower dB), their system is louder → negative offset
  return DEFAULT_REFERENCE_LEVEL - adjustedLevel;
}

/**
 * Save calibration offset to localStorage
 */
export function saveCalibrationOffset(offset: number): void {
  try {
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify({
      offset,
      timestamp: new Date().toISOString(),
    }));
  } catch {
    // localStorage might not be available
    console.warn('Could not save calibration offset');
  }
}

/**
 * Load saved calibration offset from localStorage
 */
export function loadCalibrationOffset(): number | null {
  try {
    const stored = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.offset ?? null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Clear saved calibration
 */
export function clearCalibrationOffset(): void {
  try {
    localStorage.removeItem(CALIBRATION_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if calibration has been performed
 */
export function hasCalibration(): boolean {
  return loadCalibrationOffset() !== null;
}

/**
 * Apply calibration offset to a hearing level measurement
 * 
 * @param measuredLevel - The raw measured threshold in dB HL
 * @param offset - The calibration offset (positive = system is quieter)
 * @returns Adjusted threshold
 */
export function applyCalibrationOffset(measuredLevel: number, offset: number): number {
  // If system is quieter (positive offset), measured thresholds are artificially high
  // So we subtract the offset to get closer to true thresholds
  return measuredLevel - offset;
}

/**
 * Get calibration info for display
 */
export function getCalibrationInfo(): { isCalibrated: boolean; offset: number | null; message: string } {
  const offset = loadCalibrationOffset();
  
  if (offset === null) {
    return {
      isCalibrated: false,
      offset: null,
      message: 'Not calibrated - using default settings',
    };
  }
  
  const direction = offset > 0 ? 'quieter' : offset < 0 ? 'louder' : 'average';
  const absOffset = Math.abs(offset);
  
  return {
    isCalibrated: true,
    offset,
    message: absOffset < 3 
      ? 'Calibrated - your system is close to average'
      : `Calibrated - your system is ${absOffset.toFixed(0)} dB ${direction} than average`,
  };
}

