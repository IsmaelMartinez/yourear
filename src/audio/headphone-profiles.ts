/**
 * Headphone Frequency Response Profiles
 * 
 * Stores frequency response compensation curves for popular headphone models.
 * These values represent the deviation from flat response at each audiometric frequency.
 * 
 * Data sources:
 * - rtings.com headphone measurements
 * - Published manufacturer specifications
 * - Community measurements from Head-Fi and ASR
 * 
 * Note: These are approximate values. Individual unit variation exists.
 */

/**
 * Frequency response deviation in dB at each audiometric frequency.
 * Positive values = headphone is louder than flat at this frequency.
 * Negative values = headphone is quieter than flat at this frequency.
 */
export interface HeadphoneProfile {
  id: string;
  brand: string;
  model: string;
  type: 'over-ear' | 'on-ear' | 'in-ear' | 'earbuds';
  /** Frequency response deviation at each test frequency (Hz -> dB) */
  response: {
    250: number;
    500: number;
    1000: number;
    2000: number;
    3000?: number;
    4000: number;
    6000?: number;
    8000: number;
  };
  /** Notes about the measurement or headphone */
  notes?: string;
}

/**
 * Common headphone profiles with frequency response data
 * 
 * Values are relative to a flat response (0 dB = flat).
 * Positive = headphone is louder than neutral
 * Negative = headphone is quieter than neutral
 */
export const HEADPHONE_PROFILES: HeadphoneProfile[] = [
  // === APPLE ===
  {
    id: 'apple-airpods-pro-2',
    brand: 'Apple',
    model: 'AirPods Pro (2nd Gen)',
    type: 'in-ear',
    response: { 250: -1, 500: 0, 1000: 0, 2000: 1, 3000: 2, 4000: 1, 6000: 0, 8000: -1 },
    notes: 'Active noise cancellation, with adaptive EQ enabled',
  },
  {
    id: 'apple-airpods-3',
    brand: 'Apple',
    model: 'AirPods (3rd Gen)',
    type: 'earbuds',
    response: { 250: -2, 500: -1, 1000: 0, 2000: 2, 3000: 3, 4000: 2, 6000: 1, 8000: 0 },
    notes: 'Open design, bass-light',
  },
  {
    id: 'apple-airpods-max',
    brand: 'Apple',
    model: 'AirPods Max',
    type: 'over-ear',
    response: { 250: 0, 500: 0, 1000: 0, 2000: 1, 3000: 1, 4000: 0, 6000: -1, 8000: -2 },
    notes: 'Computational audio, relatively neutral',
  },

  // === SONY ===
  {
    id: 'sony-wh1000xm5',
    brand: 'Sony',
    model: 'WH-1000XM5',
    type: 'over-ear',
    response: { 250: 2, 500: 1, 1000: 0, 2000: -1, 3000: -2, 4000: -2, 6000: -1, 8000: -2 },
    notes: 'V-shaped sound signature, bass emphasis',
  },
  {
    id: 'sony-wh1000xm4',
    brand: 'Sony',
    model: 'WH-1000XM4',
    type: 'over-ear',
    response: { 250: 3, 500: 1, 1000: 0, 2000: -1, 3000: -3, 4000: -2, 6000: -1, 8000: -3 },
    notes: 'Bass-heavy, recessed upper mids',
  },
  {
    id: 'sony-wf1000xm5',
    brand: 'Sony',
    model: 'WF-1000XM5',
    type: 'in-ear',
    response: { 250: 1, 500: 0, 1000: 0, 2000: 0, 3000: -1, 4000: -1, 6000: 0, 8000: -1 },
    notes: 'More neutral than over-ear siblings',
  },

  // === BOSE ===
  {
    id: 'bose-qc45',
    brand: 'Bose',
    model: 'QuietComfort 45',
    type: 'over-ear',
    response: { 250: 2, 500: 1, 1000: 0, 2000: 0, 3000: -1, 4000: -2, 6000: -2, 8000: -3 },
    notes: 'Warm, bass-forward signature',
  },
  {
    id: 'bose-nc700',
    brand: 'Bose',
    model: 'Noise Cancelling 700',
    type: 'over-ear',
    response: { 250: 1, 500: 0, 1000: 0, 2000: 0, 3000: -1, 4000: -1, 6000: -1, 8000: -2 },
    notes: 'More neutral than QC series',
  },
  {
    id: 'bose-qc-earbuds-ii',
    brand: 'Bose',
    model: 'QuietComfort Earbuds II',
    type: 'in-ear',
    response: { 250: 1, 500: 0, 1000: 0, 2000: 1, 3000: 1, 4000: 0, 6000: 0, 8000: -1 },
    notes: 'CustomTune calibration',
  },

  // === SENNHEISER ===
  {
    id: 'sennheiser-hd600',
    brand: 'Sennheiser',
    model: 'HD 600',
    type: 'over-ear',
    response: { 250: 0, 500: 0, 1000: 0, 2000: 0, 3000: 1, 4000: 0, 6000: 0, 8000: -1 },
    notes: 'Reference headphone, very neutral',
  },
  {
    id: 'sennheiser-hd650',
    brand: 'Sennheiser',
    model: 'HD 650',
    type: 'over-ear',
    response: { 250: 1, 500: 0, 1000: 0, 2000: 0, 3000: 0, 4000: -1, 6000: -1, 8000: -2 },
    notes: 'Warmer than HD 600, rolled-off treble',
  },
  {
    id: 'sennheiser-momentum-4',
    brand: 'Sennheiser',
    model: 'Momentum 4 Wireless',
    type: 'over-ear',
    response: { 250: 2, 500: 1, 1000: 0, 2000: 0, 3000: -1, 4000: -1, 6000: 0, 8000: -1 },
    notes: 'Consumer tuning, bass boost',
  },

  // === AUDIO-TECHNICA ===
  {
    id: 'audio-technica-m50x',
    brand: 'Audio-Technica',
    model: 'ATH-M50x',
    type: 'over-ear',
    response: { 250: 1, 500: 0, 1000: 0, 2000: 1, 3000: 2, 4000: 1, 6000: 1, 8000: 0 },
    notes: 'Studio monitor, slight V-shape',
  },
  {
    id: 'audio-technica-r70x',
    brand: 'Audio-Technica',
    model: 'ATH-R70x',
    type: 'over-ear',
    response: { 250: 0, 500: 0, 1000: 0, 2000: 0, 3000: 0, 4000: 0, 6000: 0, 8000: -1 },
    notes: 'Reference open-back, very flat',
  },

  // === BEYERDYNAMIC ===
  {
    id: 'beyerdynamic-dt770',
    brand: 'Beyerdynamic',
    model: 'DT 770 Pro',
    type: 'over-ear',
    response: { 250: 1, 500: 0, 1000: 0, 2000: 1, 3000: 2, 4000: 3, 6000: 2, 8000: 4 },
    notes: 'Famous treble peak around 8kHz',
  },
  {
    id: 'beyerdynamic-dt990',
    brand: 'Beyerdynamic',
    model: 'DT 990 Pro',
    type: 'over-ear',
    response: { 250: 2, 500: 0, 1000: 0, 2000: 1, 3000: 3, 4000: 4, 6000: 3, 8000: 5 },
    notes: 'V-shaped, bright treble',
  },

  // === SAMSUNG ===
  {
    id: 'samsung-buds2-pro',
    brand: 'Samsung',
    model: 'Galaxy Buds2 Pro',
    type: 'in-ear',
    response: { 250: 1, 500: 0, 1000: 0, 2000: 1, 3000: 1, 4000: 0, 6000: -1, 8000: -2 },
    notes: 'AKG tuning, warm signature',
  },

  // === GENERIC CATEGORIES ===
  {
    id: 'generic-earbuds',
    brand: 'Generic',
    model: 'Budget Earbuds',
    type: 'earbuds',
    response: { 250: -3, 500: -2, 1000: 0, 2000: 2, 3000: 3, 4000: 2, 6000: 1, 8000: -2 },
    notes: 'Typical budget earbuds - weak bass, recessed treble',
  },
  {
    id: 'generic-gaming',
    brand: 'Generic',
    model: 'Gaming Headset',
    type: 'over-ear',
    response: { 250: 4, 500: 2, 1000: 0, 2000: 1, 3000: 2, 4000: 3, 6000: 2, 8000: 1 },
    notes: 'Typical gaming headset - boosted bass and treble',
  },
  {
    id: 'flat-reference',
    brand: 'Reference',
    model: 'Flat Response (No Compensation)',
    type: 'over-ear',
    response: { 250: 0, 500: 0, 1000: 0, 2000: 0, 3000: 0, 4000: 0, 6000: 0, 8000: 0 },
    notes: 'Use this if your headphones are not listed or you prefer no compensation',
  },
];

/** Storage key for selected headphone profile */
const PROFILE_STORAGE_KEY = 'yourear_headphone_profile';

/**
 * Get all available headphone profiles grouped by brand
 */
export function getProfilesByBrand(): Map<string, HeadphoneProfile[]> {
  const byBrand = new Map<string, HeadphoneProfile[]>();
  
  for (const profile of HEADPHONE_PROFILES) {
    const existing = byBrand.get(profile.brand) || [];
    existing.push(profile);
    byBrand.set(profile.brand, existing);
  }
  
  return byBrand;
}

/**
 * Get a profile by ID
 */
export function getProfileById(id: string): HeadphoneProfile | undefined {
  return HEADPHONE_PROFILES.find(p => p.id === id);
}

/**
 * Save selected headphone profile ID
 */
export function saveSelectedProfile(profileId: string): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, profileId);
  } catch {
    console.warn('Could not save headphone profile');
  }
}

/**
 * Load selected headphone profile ID
 */
export function loadSelectedProfileId(): string | null {
  try {
    return localStorage.getItem(PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Get the currently selected profile
 */
export function getSelectedProfile(): HeadphoneProfile | null {
  const id = loadSelectedProfileId();
  if (!id) return null;
  return getProfileById(id) || null;
}

/**
 * Get compensation value for a frequency
 * 
 * @param profile - The headphone profile
 * @param frequency - The test frequency in Hz
 * @returns Compensation in dB (subtract from measured threshold)
 */
export function getCompensation(profile: HeadphoneProfile, frequency: number): number {
  const freqKey = frequency as keyof typeof profile.response;
  const value = profile.response[freqKey];
  
  if (value !== undefined) {
    // Compensation is inverse of deviation
    // If headphone is +3 dB loud at this frequency, we subtract 3 dB from threshold
    return -value;
  }
  
  // Interpolate for frequencies not in profile
  const frequencies = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
  const validFreqs = frequencies.filter(f => profile.response[f as keyof typeof profile.response] !== undefined);
  
  // Find surrounding frequencies
  let lower = validFreqs[0];
  let upper = validFreqs[validFreqs.length - 1];
  
  for (const f of validFreqs) {
    if (f <= frequency) lower = f;
    if (f >= frequency && upper === validFreqs[validFreqs.length - 1]) upper = f;
  }
  
  if (lower === upper) {
    const val = profile.response[lower as keyof typeof profile.response];
    return val !== undefined ? -val : 0;
  }
  
  // Linear interpolation
  const lowerVal = profile.response[lower as keyof typeof profile.response] || 0;
  const upperVal = profile.response[upper as keyof typeof profile.response] || 0;
  const ratio = (frequency - lower) / (upper - lower);
  const interpolated = lowerVal + (upperVal - lowerVal) * ratio;
  
  return -interpolated;
}

/**
 * Apply headphone compensation to a threshold measurement
 * 
 * @param measuredThreshold - The raw measured threshold in dB HL
 * @param frequency - The test frequency in Hz
 * @param profile - The headphone profile (optional, uses saved profile if not provided)
 * @returns Compensated threshold in dB HL
 */
export function applyHeadphoneCompensation(
  measuredThreshold: number,
  frequency: number,
  profile?: HeadphoneProfile | null
): number {
  const activeProfile = profile ?? getSelectedProfile();
  
  if (!activeProfile || activeProfile.id === 'flat-reference') {
    return measuredThreshold;
  }
  
  const compensation = getCompensation(activeProfile, frequency);
  return measuredThreshold + compensation;
}

