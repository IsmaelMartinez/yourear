/**
 * Ambient Noise Detector
 * 
 * Uses the microphone to measure ambient noise levels in the room.
 * Warns users if background noise is too high for accurate testing.
 */

export interface NoiseCheckResult {
  averageDb: number;
  peakDb: number;
  isAcceptable: boolean;
  recommendation: string;
}

/** Error thrown when microphone access fails */
export class MicrophoneAccessError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'MicrophoneAccessError';
  }
}

/**
 * Threshold levels for ambient noise (approximate dB SPL)
 * 
 * Note: These are relative measurements since we can't calibrate the microphone.
 * We use conservative thresholds that correlate with typical room noise levels.
 */
const NOISE_THRESHOLDS = {
  /** Ideal: very quiet room (<40 dB) */
  IDEAL: -50,
  /** Acceptable: quiet room (40-50 dB) */
  ACCEPTABLE: -40,
  /** Warning: noisy room (50-60 dB) - results may be affected */
  WARNING: -30,
  /** Too loud: very noisy (>60 dB) - testing not recommended */
  TOO_LOUD: -20,
} as const;

/** Duration to sample noise in milliseconds */
const SAMPLE_DURATION_MS = 3000;

/** How often to sample during the measurement period */
const SAMPLE_INTERVAL_MS = 100;

/**
 * Convert RMS amplitude to approximate dB
 */
function amplitudeToDb(amplitude: number): number {
  if (amplitude <= 0) return -100;
  return 20 * Math.log10(amplitude);
}

/**
 * Calculate RMS (Root Mean Square) of audio data
 */
function calculateRMS(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

/**
 * Check ambient noise level using the microphone
 * 
 * @returns Promise with noise check results
 * @throws MicrophoneAccessError if microphone access is denied
 */
export async function checkAmbientNoise(): Promise<NoiseCheckResult> {
  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;

  try {
    // Request microphone access
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    
    source.connect(analyser);

    const dataArray = new Float32Array(analyser.fftSize);
    const samples: number[] = [];

    // Collect samples over the measurement period
    await new Promise<void>((resolve) => {
      const intervalId = setInterval(() => {
        analyser.getFloatTimeDomainData(dataArray);
        const rms = calculateRMS(dataArray);
        const db = amplitudeToDb(rms);
        samples.push(db);
      }, SAMPLE_INTERVAL_MS);

      setTimeout(() => {
        clearInterval(intervalId);
        resolve();
      }, SAMPLE_DURATION_MS);
    });

    // Calculate statistics
    const averageDb = samples.reduce((a, b) => a + b, 0) / samples.length;
    const peakDb = Math.max(...samples);

    // Determine acceptability and recommendation
    let isAcceptable = true;
    let recommendation = '';

    if (averageDb < NOISE_THRESHOLDS.IDEAL) {
      recommendation = 'Excellent! Your environment is very quiet - ideal for testing.';
    } else if (averageDb < NOISE_THRESHOLDS.ACCEPTABLE) {
      recommendation = 'Good. Your environment is acceptably quiet for testing.';
    } else if (averageDb < NOISE_THRESHOLDS.WARNING) {
      isAcceptable = true; // Still acceptable but with warning
      recommendation = 'Your environment has some background noise. Results may be slightly affected. Consider finding a quieter space if possible.';
    } else if (averageDb < NOISE_THRESHOLDS.TOO_LOUD) {
      isAcceptable = false;
      recommendation = 'Your environment is quite noisy. We recommend finding a quieter space for more accurate results.';
    } else {
      isAcceptable = false;
      recommendation = 'Your environment is very noisy. Testing is not recommended. Please find a quieter location.';
    }

    return {
      averageDb,
      peakDb,
      isAcceptable,
      recommendation,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      throw new MicrophoneAccessError(
        'Microphone access was denied. The noise check is optional - you can proceed without it.',
        error
      );
    }
    if (error instanceof Error && error.name === 'NotFoundError') {
      throw new MicrophoneAccessError(
        'No microphone found. The noise check is optional - you can proceed without it.',
        error
      );
    }
    throw new MicrophoneAccessError(
      'Could not access microphone for noise check. You can proceed without it.',
      error
    );
  } finally {
    // Clean up resources
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
      await audioContext.close();
    }
  }
}

/**
 * Get a visual indicator level (0-4) for the noise level
 * 0 = silent, 1 = quiet, 2 = moderate, 3 = loud, 4 = very loud
 */
export function getNoiseLevel(db: number): 0 | 1 | 2 | 3 | 4 {
  if (db < NOISE_THRESHOLDS.IDEAL) return 0;
  if (db < NOISE_THRESHOLDS.ACCEPTABLE) return 1;
  if (db < NOISE_THRESHOLDS.WARNING) return 2;
  if (db < NOISE_THRESHOLDS.TOO_LOUD) return 3;
  return 4;
}

/**
 * Get color for noise level indicator
 */
export function getNoiseLevelColor(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 0: return 'var(--accent-success)';
    case 1: return 'var(--accent-left)';
    case 2: return 'var(--accent-warning)';
    case 3: return 'var(--accent-right)';
    case 4: return 'var(--accent-right)';
  }
}

