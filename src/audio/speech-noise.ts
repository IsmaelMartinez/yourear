/**
 * Speech-in-Noise Test Audio
 * 
 * Generates background noise and uses Web Speech API for speech synthesis.
 * Tests ability to understand speech at various signal-to-noise ratios (SNR).
 */

// AudioContext singleton
let audioContext: AudioContext | null = null;
let noiseNode: AudioBufferSourceNode | null = null;
let noiseGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

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

/**
 * Start playing background noise
 */
export function startNoise(volumeDb: number = 0): void {
  stopNoise();
  
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  // Create 10 seconds of looping noise
  const noiseBuffer = createPinkNoiseBuffer(ctx, 10);
  
  noiseNode = ctx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;
  
  noiseGain = ctx.createGain();
  noiseGain.gain.value = Math.pow(10, (volumeDb - 30) / 20); // Reference at -30dBFS
  
  noiseNode.connect(noiseGain).connect(ctx.destination);
  noiseNode.start();
}

/**
 * Stop background noise
 */
export function stopNoise(): void {
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
 * Adjust noise volume in real-time
 */
export function setNoiseVolume(volumeDb: number): void {
  if (noiseGain) {
    noiseGain.gain.value = Math.pow(10, (volumeDb - 30) / 20);
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

/**
 * Speak a word using Web Speech API
 * Returns a promise that resolves when speech is complete
 */
export function speakWord(word: string, rate: number = 0.9): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to use a good English voice
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Daniel'))
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);
    
    speechSynthesis.speak(utterance);
  });
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

/**
 * Calculate speech threshold (SNR-50)
 * This is the SNR at which the user gets 50% correct
 */
export function calculateSNR50(results: Map<SNRLevel, { correct: number; total: number }>): number | null {
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

