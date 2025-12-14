/**
 * Pure tone generator for audiometry
 * 
 * Uses the Web Audio API to generate precise sine wave tones
 * at specific frequencies for hearing threshold testing.
 */

// AudioContext singleton - created on first use to comply with autoplay policies
let audioContext: AudioContext | null = null;

/** Error thrown when audio cannot be initialized */
export class AudioInitError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AudioInitError';
  }
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch (error) {
      throw new AudioInitError(
        'Could not initialize audio. Please ensure your browser supports Web Audio API.',
        error
      );
    }
  }
  return audioContext;
}

async function ensureRunning(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (error) {
      throw new AudioInitError(
        'Could not resume audio context. Please interact with the page and try again.',
        error
      );
    }
  }
  return ctx;
}

// Active tone tracking
let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
let activePanner: StereoPannerNode | null = null;

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
 * Reference level: 0 dB HL maps to -60 dB relative to full scale (dBFS).
 * 
 * This provides sufficient headroom:
 * - At 0 dB HL: output is very quiet (-60 dBFS)
 * - At 90 dB HL: output is moderate (-60 + 90 = -30 dBFS, clamped to 0)
 * 
 * Note: This is an arbitrary reference since consumer hardware isn't calibrated.
 * Results are relative, not absolute SPL.
 */
const REFERENCE_DB_FS = -60;

/** Minimum gain to prevent complete silence (for safety) */
const MIN_GAIN_DB = -80;

/** Maximum gain to prevent clipping */
const MAX_GAIN_DB = 0;

/**
 * Convert hearing level (dB HL) to Web Audio gain value
 * @param dbHL - Hearing level in decibels (0-90 typical range)
 * @returns Linear gain value for GainNode
 */
function hearingLevelToGain(dbHL: number): number {
  const gainDb = Math.max(MIN_GAIN_DB, Math.min(MAX_GAIN_DB, REFERENCE_DB_FS + dbHL));
  return dbToGain(gainDb);
}

function cleanup(): void {
  activeOscillator?.disconnect();
  activeGain?.disconnect();
  activePanner?.disconnect();
  activeOscillator = null;
  activeGain = null;
  activePanner = null;
}

export function stopTone(): void {
  if (activeOscillator) {
    try { activeOscillator.stop(); } catch { /* already stopped */ }
    cleanup();
  }
}

export async function playTone(options: ToneOptions): Promise<void> {
  const { frequency, level, duration, channel } = options;
  
  stopTone();
  
  const ctx = await ensureRunning();
  
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
  activePanner = panner;
  
  oscillator.start(now);
  oscillator.stop(now + durationSec + 0.1);
  
  return new Promise(resolve => {
    oscillator.onended = () => {
      cleanup();
      resolve();
    };
  });
}

export async function playCalibrationTone(ear: 'left' | 'right'): Promise<void> {
  await playTone({ frequency: 1000, level: 40, duration: 2000, channel: ear });
}
