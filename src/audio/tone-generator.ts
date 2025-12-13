/**
 * Pure tone generator for audiometry
 * Generates calibrated sine waves with smooth envelope to avoid clicks
 */

import { ensureAudioContextRunning } from './context';

export interface ToneOptions {
  frequency: number; // Hz
  level: number; // dB (relative, not absolute SPL)
  duration: number; // ms
  channel: 'left' | 'right' | 'both';
}

// Active oscillator tracking for cleanup
let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
let activePanner: StereoPannerNode | null = null;

/**
 * Convert dB to linear gain
 * 0 dB = 1.0, -20 dB ≈ 0.1, etc.
 */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Convert linear gain to dB
 */
export function gainToDb(gain: number): number {
  return 20 * Math.log10(gain);
}

/**
 * Reference level mapping
 * Maps audiometric dB HL to actual output gain
 * 
 * Note: Without proper calibration, these are approximations.
 * In real audiometry, equipment is calibrated to specific SPL levels.
 * 
 * We use a reference where 0 dB HL ≈ -60 dB gain (very quiet)
 * This gives us headroom up to +40 dB HL at reasonable volume
 */
const REFERENCE_DB = -60; // 0 dB HL maps to this gain in dB

export function hearingLevelToGain(dbHL: number): number {
  const gainDb = REFERENCE_DB + dbHL;
  // Clamp to safe range
  const clampedDb = Math.max(-80, Math.min(0, gainDb));
  return dbToGain(clampedDb);
}

/**
 * Play a pure tone with given parameters
 * Returns a promise that resolves when the tone ends
 */
export async function playTone(options: ToneOptions): Promise<void> {
  const { frequency, level, duration, channel } = options;
  
  // Stop any currently playing tone
  stopTone();
  
  const ctx = await ensureAudioContextRunning();
  
  // Create oscillator
  const oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  
  // Create gain node for volume and envelope
  const gainNode = ctx.createGain();
  const targetGain = hearingLevelToGain(level);
  
  // Create stereo panner for ear selection
  const panner = ctx.createStereoPanner();
  panner.pan.value = channel === 'left' ? -1 : channel === 'right' ? 1 : 0;
  
  // Connect the audio graph
  oscillator.connect(gainNode);
  gainNode.connect(panner);
  panner.connect(ctx.destination);
  
  // Apply envelope to avoid clicks
  const now = ctx.currentTime;
  const rampTime = 0.02; // 20ms ramp
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(targetGain, now + rampTime);
  gainNode.gain.setValueAtTime(targetGain, now + duration / 1000 - rampTime);
  gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);
  
  // Store references for cleanup
  activeOscillator = oscillator;
  activeGain = gainNode;
  activePanner = panner;
  
  // Start and schedule stop
  oscillator.start(now);
  oscillator.stop(now + duration / 1000 + 0.1); // Small buffer
  
  return new Promise((resolve) => {
    oscillator.onended = () => {
      cleanup();
      resolve();
    };
  });
}

/**
 * Stop the currently playing tone immediately
 */
export function stopTone(): void {
  if (activeOscillator) {
    try {
      activeOscillator.stop();
    } catch {
      // Already stopped
    }
    cleanup();
  }
}

/**
 * Check if a tone is currently playing
 */
export function isPlaying(): boolean {
  return activeOscillator !== null;
}

function cleanup(): void {
  if (activeOscillator) {
    activeOscillator.disconnect();
    activeOscillator = null;
  }
  if (activeGain) {
    activeGain.disconnect();
    activeGain = null;
  }
  if (activePanner) {
    activePanner.disconnect();
    activePanner = null;
  }
}

/**
 * Play a brief calibration tone
 * Used to let user set comfortable volume before testing
 */
export async function playCalibrationTone(ear: 'left' | 'right'): Promise<void> {
  await playTone({
    frequency: 1000, // Standard reference frequency
    level: 40, // Moderate level
    duration: 2000,
    channel: ear,
  });
}
