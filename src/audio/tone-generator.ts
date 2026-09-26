/**
 * Pure tone generator for audiometry
 *
 * Uses the Web Audio API to generate precise sine wave tones
 * at specific frequencies for hearing threshold testing.
 */

import { ensureRunning, getAudioContext } from './audio-context';

// Active tone tracking
let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
// Bumped by stopTone so a playTone still awaiting the AudioContext does not start
let toneGeneration = 0;

export interface ToneOptions {
  frequency: number;
  level: number;
  duration: number;
  channel: 'left' | 'right' | 'both';
}

/**
 * Convert decibels to linear gain value
 * @param db - Decibel value
 * @returns Linear gain multiplier (0-1 range for negative dB)
 */
function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Reference level: 0 dB HL maps to -90 dB relative to full scale (dBFS).
 *
 * The full test range stays below clipping and every 5 dB step is distinct:
 * - At -10 dB HL (minLevel): -100 dBFS
 * - At 0 dB HL: -90 dBFS
 * - At 90 dB HL (maxLevel): 0 dBFS, the loudest undistorted output
 *
 * Note: This is an arbitrary reference since consumer hardware isn't calibrated.
 * Results are relative, not absolute SPL, and no per-frequency (ISO 389)
 * offsets are applied. See ADR 002.
 */
const REFERENCE_DB_FS = -90;

/** Floor below the quietest test level (-10 dB HL = -100 dBFS) */
const MIN_GAIN_DB = -110;

/** Maximum gain to prevent clipping */
const MAX_GAIN_DB = 0;

/** Fade-out applied by stopTone to avoid an audible click */
const STOP_RAMP_SEC = 0.02;

/**
 * Convert hearing level (dB HL) to Web Audio gain value
 * @param dbHL - Hearing level in decibels (-10 to 90 test range)
 * @returns Linear gain value for GainNode
 */
function hearingLevelToGain(dbHL: number): number {
  const gainDb = Math.max(MIN_GAIN_DB, Math.min(MAX_GAIN_DB, REFERENCE_DB_FS + dbHL));
  return dbToGain(gainDb);
}

export function stopTone(): void {
  toneGeneration++;
  if (!activeOscillator || !activeGain) return;

  const now = getAudioContext().currentTime;
  const gain = activeGain.gain;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(0, now + STOP_RAMP_SEC);
  try { activeOscillator.stop(now + STOP_RAMP_SEC); } catch { /* already stopped */ }

  // The oscillator's own onended handler disconnects its nodes once the fade finishes
  activeOscillator = null;
  activeGain = null;
}

export async function playTone(options: ToneOptions): Promise<void> {
  const { frequency, level, duration, channel } = options;
  
  stopTone();
  const generation = toneGeneration;

  const ctx = await ensureRunning();

  // Stopped or superseded by another tone while the context was resuming
  if (generation !== toneGeneration) return;
  
  const oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  
  const gainNode = ctx.createGain();
  const targetGain = hearingLevelToGain(level);
  
  const panner = ctx.createStereoPanner();
  panner.pan.value = channel === 'left' ? -1 : channel === 'right' ? 1 : 0;
  
  oscillator.connect(gainNode).connect(panner).connect(ctx.destination);
  
  // Smooth envelope to avoid audible clicks at tone start/end
  const now = ctx.currentTime;
  const RAMP_TIME_SEC = 0.02; // 20ms fade in/out - fast enough to not affect perception
  const durationSec = duration / 1000;
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(targetGain, now + RAMP_TIME_SEC);
  gainNode.gain.setValueAtTime(targetGain, now + durationSec - RAMP_TIME_SEC);
  gainNode.gain.linearRampToValueAtTime(0, now + durationSec);
  
  activeOscillator = oscillator;
  activeGain = gainNode;
  
  oscillator.start(now);
  oscillator.stop(now + durationSec + 0.1);
  
  return new Promise(resolve => {
    oscillator.onended = () => {
      // Only tear down this tone's nodes; a newer tone may already be active
      oscillator.disconnect();
      gainNode.disconnect();
      panner.disconnect();
      if (activeOscillator === oscillator) {
        activeOscillator = null;
        activeGain = null;
      }
      resolve();
    };
  });
}

export async function playCalibrationTone(ear: 'left' | 'right'): Promise<void> {
  await playTone({ frequency: 1000, level: 40, duration: 2000, channel: ear });
}
