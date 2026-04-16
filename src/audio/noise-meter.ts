/**
 * Environmental Noise Meter
 *
 * Samples ambient noise via the microphone and estimates approximate
 * dB SPL. Used before a hearing test to warn when the room is too loud
 * for reliable thresholds.
 *
 * Accuracy note: consumer microphones are not calibrated to an absolute
 * SPL reference. The offset below is a widely-used approximation that
 * puts typical quiet rooms around 25-35 dB and loud rooms above 60 dB,
 * good enough to flag obviously noisy environments — not a sound-level
 * meter replacement.
 */

import { getAudioContext, AudioInitError } from './audio-context';

/** Approximate offset that maps 0 dBFS -> ~94 dB SPL on typical consumer mics. */
const SPL_OFFSET_DB = 94;
const SAMPLE_INTERVAL_MS = 200;
const FFT_SIZE = 2048;

/** Warning threshold above which ambient noise starts to affect test accuracy. */
export const NOISE_WARNING_THRESHOLD_DB = 40;

export interface NoiseSample {
  /** Instantaneous approximate dB SPL. */
  db: number;
  /** Running peak dB SPL since meter start. */
  peakDb: number;
}

export interface NoiseMeterHandle {
  stop(): void;
}

/**
 * Convert a time-domain RMS value in [0, 1] to an approximate dB SPL reading.
 * Silence (rms = 0) is reported as 0 dB rather than -Infinity so the UI
 * never renders an invalid number.
 */
export function rmsToDbSpl(rms: number): number {
  if (rms <= 0) return 0;
  const dbFs = 20 * Math.log10(rms);
  return Math.max(0, dbFs + SPL_OFFSET_DB);
}

/**
 * Start sampling ambient noise. Resolves with a handle once the microphone
 * is live; rejects with AudioInitError if the browser doesn't support
 * getUserMedia or the user denies permission.
 */
export async function startNoiseMeter(
  onSample: (sample: NoiseSample) => void,
): Promise<NoiseMeterHandle> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new AudioInitError('Microphone access is not supported by this browser.');
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  } catch (error) {
    throw new AudioInitError(
      'Microphone access was denied. Grant permission to check ambient noise.',
      error,
    );
  }

  const ctx = getAudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let peakDb = 0;
  let stopped = false;

  const sample = () => {
    if (stopped) return;
    analyser.getFloatTimeDomainData(buffer);
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    const db = rmsToDbSpl(rms);
    if (db > peakDb) peakDb = db;
    onSample({ db, peakDb });
  };

  const interval = setInterval(sample, SAMPLE_INTERVAL_MS);
  sample();

  return {
    stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(interval);
      try { source.disconnect(); } catch { /* already disconnected */ }
      try { analyser.disconnect(); } catch { /* already disconnected */ }
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}
