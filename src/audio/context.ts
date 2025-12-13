/**
 * Singleton AudioContext manager
 * Handles browser autoplay policies and context lifecycle
 */

let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function ensureAudioContextRunning(): Promise<AudioContext> {
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  
  return ctx;
}

export function getAudioContextState(): AudioContextState {
  return audioContext?.state ?? 'closed';
}

export function closeAudioContext(): void {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

/**
 * Get the sample rate of the audio context
 * Useful for understanding frequency limitations
 */
export function getSampleRate(): number {
  return getAudioContext().sampleRate;
}

/**
 * Maximum reproducible frequency (Nyquist limit)
 */
export function getMaxFrequency(): number {
  return getSampleRate() / 2;
}
