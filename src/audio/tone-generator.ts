/**
 * Pure tone generator for audiometry
 */

// AudioContext singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

async function ensureRunning(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
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

function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

// Reference: 0 dB HL maps to -60 dB gain (very quiet)
const REFERENCE_DB = -60;

function hearingLevelToGain(dbHL: number): number {
  const gainDb = Math.max(-80, Math.min(0, REFERENCE_DB + dbHL));
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
  
  // Smooth envelope to avoid clicks
  const now = ctx.currentTime;
  const rampTime = 0.02;
  const durationSec = duration / 1000;
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(targetGain, now + rampTime);
  gainNode.gain.setValueAtTime(targetGain, now + durationSec - rampTime);
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
