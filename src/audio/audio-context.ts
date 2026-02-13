/**
 * Shared AudioContext singleton
 *
 * All audio modules should use this instead of creating their own
 * AudioContext instances. The Web Audio spec recommends a single
 * context per page for efficiency.
 */

let audioContext: AudioContext | null = null;

/** Error thrown when audio cannot be initialized */
export class AudioInitError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AudioInitError';
  }
}

export function getAudioContext(): AudioContext {
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

export async function ensureRunning(): Promise<AudioContext> {
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
