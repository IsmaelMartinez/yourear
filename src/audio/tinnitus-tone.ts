/**
 * Tinnitus tone generator - continuous adjustable tone for frequency matching
 */

import { ensureRunning } from './audio-context';

/** Time constant (s) for gain ramps; avoids clicks on start, stop and volume changes */
const RAMP_TIME_CONSTANT = 0.015;
/** Delay (s) before stopping the oscillator so the fade-out completes (~5 time constants) */
const FADE_OUT_DURATION = RAMP_TIME_CONSTANT * 5;

// Active nodes
let ctx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
/** Bumped by stop so a start still awaiting the context bails out */
let startGeneration = 0;

/**
 * Current tinnitus tone settings
 */
export interface TinnitusSettings {
  frequency: number;  // Hz (typically 100-12000)
  volume: number;     // dB HL (0-60 range for matching)
  isPlaying: boolean;
}

const DEFAULTS = { frequency: 4000, volume: 30 } as const;

let currentSettings: Omit<TinnitusSettings, 'isPlaying'> = { ...DEFAULTS };

/**
 * Convert dB to linear gain
 */
function dbToGain(db: number): number {
  // Reference: 0 dB = -50 dBFS for comfortable listening
  const dbFS = -50 + db * 0.8; // Scale to reasonable range
  return Math.pow(10, dbFS / 20);
}

/**
 * Start playing the tinnitus matching tone (fades in)
 */
export async function startTinnitusTone(): Promise<void> {
  if (oscillator) return; // Already playing

  const generation = ++startGeneration;
  const audioCtx = await ensureRunning();
  // Started by a concurrent call, or stopped, while awaiting
  if (oscillator || generation !== startGeneration) return;

  ctx = audioCtx;
  oscillator = audioCtx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = currentSettings.frequency;

  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0;
  gainNode.gain.setTargetAtTime(dbToGain(currentSettings.volume), audioCtx.currentTime, RAMP_TIME_CONSTANT);

  oscillator.connect(gainNode).connect(audioCtx.destination);
  oscillator.start();
}

/**
 * Stop the tinnitus matching tone (fades out, then releases the nodes)
 */
export function stopTinnitusTone(): void {
  startGeneration++;
  if (!oscillator || !gainNode || !ctx) return;

  const osc = oscillator;
  const gain = gainNode;
  const now = ctx.currentTime;
  oscillator = null;
  gainNode = null;

  gain.gain.cancelScheduledValues(now);
  gain.gain.setTargetAtTime(0, now, RAMP_TIME_CONSTANT);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  try {
    osc.stop(now + FADE_OUT_DURATION);
  } catch { /* already stopped */ }
}

/**
 * Update the frequency in real-time
 */
export function setTinnitusFrequency(hz: number): void {
  currentSettings.frequency = Math.max(100, Math.min(12000, hz));
  if (oscillator) {
    oscillator.frequency.value = currentSettings.frequency;
  }
}

/**
 * Update the volume in real-time (ramped to avoid clicks)
 */
export function setTinnitusVolume(db: number): void {
  currentSettings.volume = Math.max(0, Math.min(60, db));
  if (gainNode && ctx) {
    gainNode.gain.setTargetAtTime(dbToGain(currentSettings.volume), ctx.currentTime, RAMP_TIME_CONSTANT);
  }
}

/**
 * Get current settings
 */
export function getTinnitusSettings(): TinnitusSettings {
  return { ...currentSettings, isPlaying: oscillator !== null };
}

/**
 * Stop playback and reset to defaults
 */
export function resetTinnitusSettings(): void {
  stopTinnitusTone();
  currentSettings = { ...DEFAULTS };
}
