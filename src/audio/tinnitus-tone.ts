/**
 * Tinnitus tone generator - continuous adjustable tone for frequency matching
 */

// AudioContext singleton (shared with tone-generator.ts)
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Active nodes
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

/**
 * Current tinnitus tone settings
 */
export interface TinnitusSettings {
  frequency: number;  // Hz (typically 100-12000)
  volume: number;     // dB HL (0-60 range for matching)
  isPlaying: boolean;
}

let currentSettings: TinnitusSettings = {
  frequency: 4000,
  volume: 30,
  isPlaying: false,
};

/**
 * Convert dB to linear gain
 */
function dbToGain(db: number): number {
  // Reference: 0 dB = -50 dBFS for comfortable listening
  const dbFS = -50 + db * 0.8; // Scale to reasonable range
  return Math.pow(10, dbFS / 20);
}

/**
 * Start playing the tinnitus matching tone
 */
export function startTinnitusTone(): void {
  if (oscillator) return; // Already playing
  
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = currentSettings.frequency;
  
  gainNode = ctx.createGain();
  gainNode.gain.value = dbToGain(currentSettings.volume);
  
  oscillator.connect(gainNode).connect(ctx.destination);
  oscillator.start();
  
  currentSettings.isPlaying = true;
}

/**
 * Stop the tinnitus matching tone
 */
export function stopTinnitusTone(): void {
  if (oscillator) {
    try {
      oscillator.stop();
    } catch { /* already stopped */ }
    oscillator.disconnect();
    oscillator = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
  currentSettings.isPlaying = false;
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
 * Update the volume in real-time
 */
export function setTinnitusVolume(db: number): void {
  currentSettings.volume = Math.max(0, Math.min(60, db));
  if (gainNode) {
    gainNode.gain.value = dbToGain(currentSettings.volume);
  }
}

/**
 * Get current settings
 */
export function getTinnitusSettings(): TinnitusSettings {
  return { ...currentSettings };
}

/**
 * Reset to defaults
 */
export function resetTinnitusSettings(): void {
  stopTinnitusTone();
  currentSettings = {
    frequency: 4000,
    volume: 30,
    isPlaying: false,
  };
}

