import { describe, it, expect } from 'vitest';
import { calculatePTAChange } from './comparison-audiogram';
import { HearingProfile, HearingThreshold } from '../types';

const profile = (thresholds: HearingThreshold[]): HearingProfile => ({
  id: 'p', name: 'p', createdAt: new Date(), updatedAt: new Date(), thresholds,
});

describe('calculatePTAChange', () => {
  it('uses the standard PTA when both profiles have 500/1000/2000 Hz', () => {
    const older = profile([500, 1000, 2000].map(frequency => ({ frequency, rightEar: 10, leftEar: 0 })));
    const newer = profile([500, 1000, 2000].map(frequency => ({ frequency, rightEar: 20, leftEar: 0 })));
    expect(calculatePTAChange(older, newer)).toEqual({ right: 10, left: 0, standard: true });
  });

  it('reports the fallback average for Quick Test profiles', () => {
    const older = profile([1000, 4000, 8000].map(frequency => ({ frequency, rightEar: 10, leftEar: 10 })));
    const newer = profile([1000, 4000, 8000].map(frequency => ({ frequency, rightEar: 15, leftEar: 10 })));
    expect(calculatePTAChange(older, newer)).toEqual({ right: 5, left: 0, standard: false });
  });
});
