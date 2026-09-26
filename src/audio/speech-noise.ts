/**
 * Speech-in-Noise Test Audio
 *
 * Plays pre-generated word clips (public/speech, see ADR 008) and pink noise
 * through the shared AudioContext, so both levels are known and the SNR is
 * the difference of their RMS levels in dBFS.
 */

import { dbToGain, ensureRunning } from './audio-context';

/** RMS level every word is played at; the noise is set relative to it */
export const SPEECH_LEVEL_DBFS = -25;

interface MeasuredBuffer {
  buffer: AudioBuffer;
  rms: number;
}

let noiseNode: AudioBufferSourceNode | null = null;
let noiseGain: GainNode | null = null;
let noiseRms = 1;
/** Incremented on every start/stop so a superseded startNoise() does nothing after its await */
let noiseGeneration = 0;
/** Pink-noise buffers keyed by sample rate; generating one costs ~15 ms on the main thread */
const noiseBufferCache = new Map<number, MeasuredBuffer>();

let speechNode: AudioBufferSourceNode | null = null;
/** Incremented on every speak/stop so a superseded speakWord() plays nothing after its await */
let speechGeneration = 0;
/** Decoded word clips keyed by word, so each is fetched and decoded once */
const clipCache = new Map<string, Promise<MeasuredBuffer>>();

const NOISE_DURATION_S = 10;
const NOISE_RAMP_TIME_CONSTANT_S = 0.05;

/**
 * Generate pink noise buffer (more natural than white noise)
 * Pink noise has equal energy per octave, similar to speech babble
 */
function createPinkNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    
    // Pink noise using Voss-McCartney algorithm (simplified)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  
  return buffer;
}

/** RMS of all samples across all channels (linear, full scale = 1) */
function measureRms(buffer: AudioBuffer): number {
  let sum = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    for (const sample of buffer.getChannelData(c)) sum += sample * sample;
  }
  return Math.sqrt(sum / (buffer.numberOfChannels * buffer.length));
}

function getPinkNoiseBuffer(ctx: AudioContext): MeasuredBuffer {
  let noise = noiseBufferCache.get(ctx.sampleRate);
  if (!noise) {
    const buffer = createPinkNoiseBuffer(ctx, NOISE_DURATION_S);
    noise = { buffer, rms: measureRms(buffer) };
    noiseBufferCache.set(ctx.sampleRate, noise);
  }
  return noise;
}

/** Gain that plays a buffer of the given RMS at levelDbfs RMS */
function gainForRms(levelDbfs: number, rms: number): number {
  return dbToGain(levelDbfs) / rms;
}

/**
 * Start one looping background noise source at levelDbfs RMS, replacing any
 * existing one. Change its level afterwards with setNoiseLevel().
 */
export async function startNoise(levelDbfs: number): Promise<void> {
  stopNoise();
  const generation = noiseGeneration;

  const ctx = await ensureRunning();
  if (generation !== noiseGeneration) return; // superseded by another start or a stop

  const noise = getPinkNoiseBuffer(ctx);
  noiseRms = noise.rms;
  noiseNode = ctx.createBufferSource();
  noiseNode.buffer = noise.buffer;
  noiseNode.loop = true;

  noiseGain = ctx.createGain();
  noiseGain.gain.value = gainForRms(levelDbfs, noiseRms);

  noiseNode.connect(noiseGain).connect(ctx.destination);
  noiseNode.start();
}

/**
 * Ramp the running noise to a new RMS level without restarting the source
 */
export function setNoiseLevel(levelDbfs: number): void {
  if (!noiseGain) return;
  noiseGain.gain.setTargetAtTime(
    gainForRms(levelDbfs, noiseRms),
    noiseGain.context.currentTime,
    NOISE_RAMP_TIME_CONSTANT_S
  );
}

/**
 * Stop background noise
 */
export function stopNoise(): void {
  noiseGeneration++;
  if (noiseNode) {
    try { noiseNode.stop(); } catch { /* already stopped */ }
    noiseNode.disconnect();
    noiseNode = null;
  }
  if (noiseGain) {
    noiseGain.disconnect();
    noiseGain = null;
  }
}

/**
 * Simple word lists for speech-in-noise testing
 * Using numbers as they're universal and easy to verify
 */
export const WORD_LISTS = {
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  colors: ['red', 'blue', 'green', 'white', 'black', 'yellow', 'orange', 'pink', 'brown', 'gray'],
  animals: ['cat', 'dog', 'bird', 'fish', 'horse', 'cow', 'sheep', 'pig', 'duck', 'mouse'],
};

export type WordListType = keyof typeof WORD_LISTS;

function loadClip(ctx: AudioContext, word: string): Promise<MeasuredBuffer> {
  let clip = clipCache.get(word);
  if (!clip) {
    clip = (async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}speech/${word}.mp3`);
      if (!response.ok) throw new Error(`Could not load the clip for "${word}" (HTTP ${response.status})`);
      const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      return { buffer, rms: measureRms(buffer) };
    })();
    clipCache.set(word, clip);
    clip.catch(() => clipCache.delete(word)); // let a later call retry
  }
  return clip;
}

/**
 * Play a word's clip at SPEECH_LEVEL_DBFS RMS, stopping any word already playing.
 * Resolves when the word ends or is stopped by stopSpeech().
 */
export async function speakWord(word: string): Promise<void> {
  stopSpeech();
  const generation = speechGeneration;

  const ctx = await ensureRunning();
  const clip = await loadClip(ctx, word);
  if (generation !== speechGeneration) return; // superseded by another word or a stop

  const source = ctx.createBufferSource();
  source.buffer = clip.buffer;
  const gain = ctx.createGain();
  gain.gain.value = gainForRms(SPEECH_LEVEL_DBFS, clip.rms);
  source.connect(gain).connect(ctx.destination);
  speechNode = source;

  await new Promise<void>(resolve => {
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      if (speechNode === source) speechNode = null;
      resolve();
    };
    source.start();
  });
}

/**
 * Stop the word that is playing, if any, and cancel one that is still loading
 */
export function stopSpeech(): void {
  speechGeneration++;
  if (speechNode) {
    try { speechNode.stop(); } catch { /* already stopped */ }
    speechNode = null;
  }
}

/**
 * Get a random word from a list (excluding already used words)
 */
export function getRandomWord(listType: WordListType, exclude: string[] = []): string {
  const list = WORD_LISTS[listType];
  const available = list.filter(w => !exclude.includes(w));
  if (available.length === 0) return list[Math.floor(Math.random() * list.length)];
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * SNR levels for testing (in dB)
 * Positive = speech louder than noise
 * Negative = noise louder than speech
 */
export const SNR_LEVELS = [10, 5, 0, -5, -10] as const;
export type SNRLevel = typeof SNR_LEVELS[number];

export type SNRResults = Map<SNRLevel, { correct: number; total: number }>;

/**
 * Noise RMS level in dBFS for an SNR. Speech always plays at
 * SPEECH_LEVEL_DBFS, so the SNR is set by moving the noise only (ADR 008).
 */
export function noiseLevelDbfsForSNR(snr: SNRLevel): number {
  return SPEECH_LEVEL_DBFS - snr;
}

export function createEmptyResults(): SNRResults {
  return new Map(SNR_LEVELS.map(snr => [snr, { correct: 0, total: 0 }]));
}

export interface TrialProgress {
  currentSNR: SNRLevel;
  currentTrial: number;
  results: SNRResults;
}

/**
 * Record one response and work out the next trial.
 * Runs trialsPerSNR trials at each level in SNR_LEVELS order; done after the last level.
 */
export function advanceTrial(
  progress: TrialProgress,
  isCorrect: boolean,
  trialsPerSNR: number
): TrialProgress & { done: boolean } {
  const results: SNRResults = new Map(
    [...progress.results].map(([snr, data]) => [snr, { ...data }])
  );
  const current = results.get(progress.currentSNR) ?? { correct: 0, total: 0 };
  results.set(progress.currentSNR, {
    correct: current.correct + (isCorrect ? 1 : 0),
    total: current.total + 1,
  });

  const nextTrial = progress.currentTrial + 1;
  if (nextTrial < trialsPerSNR) {
    return { currentSNR: progress.currentSNR, currentTrial: nextTrial, results, done: false };
  }

  const nextIndex = SNR_LEVELS.indexOf(progress.currentSNR) + 1;
  if (nextIndex < SNR_LEVELS.length) {
    return { currentSNR: SNR_LEVELS[nextIndex], currentTrial: 0, results, done: false };
  }
  return { currentSNR: progress.currentSNR, currentTrial: 0, results, done: true };
}

/**
 * Calculate speech threshold (SNR-50)
 * This is the SNR at which the user gets 50% correct
 */
export function calculateSNR50(results: SNRResults): number | null {
  const points: { snr: number; percent: number }[] = [];
  
  results.forEach((data, snr) => {
    if (data.total > 0) {
      points.push({ snr, percent: (data.correct / data.total) * 100 });
    }
  });
  
  if (points.length < 2) return null;
  
  // Sort by SNR
  points.sort((a, b) => b.snr - a.snr);
  
  // Find where it crosses 50%
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    if ((p1.percent >= 50 && p2.percent < 50) || (p1.percent <= 50 && p2.percent > 50)) {
      // Linear interpolation
      const slope = (p2.snr - p1.snr) / (p2.percent - p1.percent);
      return p1.snr + slope * (50 - p1.percent);
    }
  }
  
  // If always above or below 50%, return edge value
  const lastPoint = points[points.length - 1];
  if (lastPoint.percent >= 50) return lastPoint.snr - 5; // Better than tested
  return points[0].snr + 5; // Worse than tested
}

/**
 * Interpret SNR-50 result
 */
export function interpretSNR50(snr50: number): { grade: string; description: string } {
  if (snr50 <= -5) {
    return { grade: 'Excellent', description: 'You can understand speech very well in noisy environments.' };
  }
  if (snr50 <= 0) {
    return { grade: 'Good', description: 'You handle background noise well.' };
  }
  if (snr50 <= 5) {
    return { grade: 'Average', description: 'You may have some difficulty in very noisy situations.' };
  }
  if (snr50 <= 10) {
    return { grade: 'Below Average', description: 'You may struggle to understand speech in noisy environments.' };
  }
  return { grade: 'Difficulty', description: 'Understanding speech in noise is challenging for you.' };
}

