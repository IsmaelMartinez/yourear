import { describe, it, expect } from 'vitest';
import { classifyHearingLoss, TEST_FREQUENCIES, DEFAULT_TEST_CONFIG, QUICK_TEST_CONFIG, formatFrequency, calculatePTA, compareToAge, getExpectedThresholds, HearingThreshold } from './index';

describe('classifyHearingLoss', () => {
  it('classifies normal hearing (≤20 dB)', () => {
    expect(classifyHearingLoss(0)).toBe('normal');
    expect(classifyHearingLoss(10)).toBe('normal');
    expect(classifyHearingLoss(20)).toBe('normal');
  });

  it('classifies slight loss (21-25 dB)', () => {
    expect(classifyHearingLoss(21)).toBe('slight');
    expect(classifyHearingLoss(25)).toBe('slight');
  });

  it('classifies mild loss (26-40 dB)', () => {
    expect(classifyHearingLoss(26)).toBe('mild');
    expect(classifyHearingLoss(40)).toBe('mild');
  });

  it('classifies moderate loss (41-55 dB)', () => {
    expect(classifyHearingLoss(41)).toBe('moderate');
    expect(classifyHearingLoss(55)).toBe('moderate');
  });

  it('classifies moderately-severe loss (56-70 dB)', () => {
    expect(classifyHearingLoss(56)).toBe('moderately-severe');
    expect(classifyHearingLoss(70)).toBe('moderately-severe');
  });

  it('classifies severe loss (71-90 dB)', () => {
    expect(classifyHearingLoss(71)).toBe('severe');
    expect(classifyHearingLoss(90)).toBe('severe');
  });

  it('classifies profound loss (>90 dB)', () => {
    expect(classifyHearingLoss(91)).toBe('profound');
    expect(classifyHearingLoss(120)).toBe('profound');
  });
});

describe('TEST_FREQUENCIES', () => {
  it('contains standard audiometric frequencies', () => {
    expect(TEST_FREQUENCIES).toEqual([250, 500, 1000, 2000, 4000, 8000]);
  });

  it('has 6 frequencies', () => {
    expect(TEST_FREQUENCIES).toHaveLength(6);
  });
});

describe('DEFAULT_TEST_CONFIG', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_TEST_CONFIG.startLevel).toBe(40);
    expect(DEFAULT_TEST_CONFIG.minLevel).toBe(-10);
    expect(DEFAULT_TEST_CONFIG.maxLevel).toBe(90);
    expect(DEFAULT_TEST_CONFIG.stepUp).toBe(5);
    expect(DEFAULT_TEST_CONFIG.stepDown).toBe(10);
  });

  it('uses TEST_FREQUENCIES', () => {
    expect(DEFAULT_TEST_CONFIG.frequencies).toBe(TEST_FREQUENCIES);
  });
});

describe('QUICK_TEST_CONFIG', () => {
  it('uses only 3 key frequencies', () => {
    expect(QUICK_TEST_CONFIG.frequencies).toEqual([1000, 4000, 8000]);
    expect(QUICK_TEST_CONFIG.frequencies).toHaveLength(3);
  });

  it('has faster timing than full test', () => {
    expect(QUICK_TEST_CONFIG.toneDuration).toBeLessThan(DEFAULT_TEST_CONFIG.toneDuration);
    expect(QUICK_TEST_CONFIG.responseDuration).toBeLessThan(DEFAULT_TEST_CONFIG.responseDuration);
  });

  it('uses same threshold detection settings', () => {
    expect(QUICK_TEST_CONFIG.stepUp).toBe(DEFAULT_TEST_CONFIG.stepUp);
    expect(QUICK_TEST_CONFIG.stepDown).toBe(DEFAULT_TEST_CONFIG.stepDown);
    expect(QUICK_TEST_CONFIG.startLevel).toBe(DEFAULT_TEST_CONFIG.startLevel);
  });
});

describe('formatFrequency', () => {
  describe('short format (default)', () => {
    it('formats frequencies below 1000 Hz as plain numbers', () => {
      expect(formatFrequency(250)).toBe('250');
      expect(formatFrequency(500)).toBe('500');
    });

    it('formats frequencies at or above 1000 Hz with k suffix', () => {
      expect(formatFrequency(1000)).toBe('1k');
      expect(formatFrequency(2000)).toBe('2k');
      expect(formatFrequency(4000)).toBe('4k');
      expect(formatFrequency(8000)).toBe('8k');
    });
  });

  describe('full format', () => {
    it('returns plain numbers for all frequencies', () => {
      expect(formatFrequency(250, 'full')).toBe('250');
      expect(formatFrequency(1000, 'full')).toBe('1000');
      expect(formatFrequency(8000, 'full')).toBe('8000');
    });
  });

  describe('spoken format', () => {
    it('formats frequencies below 1000 Hz with hertz', () => {
      expect(formatFrequency(250, 'spoken')).toBe('250 hertz');
      expect(formatFrequency(500, 'spoken')).toBe('500 hertz');
    });

    it('formats frequencies at or above 1000 Hz with kilohertz', () => {
      expect(formatFrequency(1000, 'spoken')).toBe('1 kilohertz');
      expect(formatFrequency(4000, 'spoken')).toBe('4 kilohertz');
      expect(formatFrequency(8000, 'spoken')).toBe('8 kilohertz');
    });
  });
});


describe('calculatePTA', () => {
  it('averages 500, 1000 and 2000 Hz when tested', () => {
    const thresholds: HearingThreshold[] = [
      { frequency: 250, rightEar: 50, leftEar: 50 },
      { frequency: 500, rightEar: 10, leftEar: 10 },
      { frequency: 1000, rightEar: 15, leftEar: 10 },
      { frequency: 2000, rightEar: 20, leftEar: 20 },
    ];
    expect(calculatePTA(thresholds, 'rightEar')).toEqual({ value: 15, frequencies: [500, 1000, 2000], standard: true });
  });

  it('ignores undefined, null and NaN values', () => {
    const thresholds = [
      { frequency: 500, rightEar: undefined, leftEar: 10 },
      { frequency: 1000, rightEar: 20, leftEar: null },
      { frequency: 2000, rightEar: 30, leftEar: NaN },
    ] as unknown as HearingThreshold[];
    expect(calculatePTA(thresholds, 'rightEar')?.value).toBe(25);
  });

  it('falls back to the average of tested frequencies for Quick Test', () => {
    const thresholds: HearingThreshold[] = [
      { frequency: 1000, rightEar: 15, leftEar: 15 },
      { frequency: 4000, rightEar: 25, leftEar: 25 },
      { frequency: 8000, rightEar: 35, leftEar: 35 },
    ];
    expect(calculatePTA(thresholds, 'rightEar')).toEqual({ value: 25, frequencies: [1000, 4000, 8000], standard: false });
  });

  it('returns null when the ear has no values', () => {
    expect(calculatePTA([{ frequency: 1000, rightEar: null, leftEar: 10 }], 'rightEar')).toBeNull();
  });
});

describe('compareToAge', () => {
  const pta = (value: number) => ({ value, frequencies: [500, 1000, 2000], standard: true });

  it('averages a 0 dB ear with the other ear', () => {
    // right 0, left 20 -> average 10; expected at age 60 is (6 + 8 + 14) / 3 ≈ 9.3
    const result = compareToAge(60, pta(0), pta(20));
    expect(result?.average).toBe(10);
    expect(result?.verdict).toBe('typical');
  });

  it('uses the expected medians of the frequencies actually averaged', () => {
    const expected = getExpectedThresholds(40);
    const quick = { value: 0, frequencies: [1000, 4000, 8000], standard: false };
    const result = compareToAge(40, quick, null);
    expect(result?.expected).toBeCloseTo((expected[1000].median + expected[4000].median + expected[8000].median) / 3);
    expect(result?.verdict).toBe('better');
  });

  it('returns null when neither ear has a PTA', () => {
    expect(compareToAge(40, null, null)).toBeNull();
  });
});
