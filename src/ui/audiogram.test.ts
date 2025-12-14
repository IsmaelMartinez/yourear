import { describe, it, expect } from 'vitest';
import { generateSummary } from './audiogram';
import { HearingProfile } from '../types';

describe('generateSummary', () => {
  const createProfile = (overrides: Partial<HearingProfile> = {}): HearingProfile => ({
    id: 'test-id',
    name: 'Test Profile',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    thresholds: [
      { frequency: 250, rightEar: 10, leftEar: 15 },
      { frequency: 500, rightEar: 10, leftEar: 10 },
      { frequency: 1000, rightEar: 15, leftEar: 10 },
      { frequency: 2000, rightEar: 20, leftEar: 20 },
      { frequency: 4000, rightEar: 25, leftEar: 30 },
      { frequency: 8000, rightEar: 35, leftEar: 40 },
    ],
    ...overrides,
  });

  it('generates a summary header', () => {
    const profile = createProfile();
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Hearing Assessment Summary');
  });

  it('includes age when provided', () => {
    const profile = createProfile({ age: 45 });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Age: 45 years');
  });

  it('excludes age line when not provided', () => {
    const profile = createProfile({ age: undefined });
    const summary = generateSummary(profile);
    
    expect(summary).not.toContain('Age:');
  });

  it('calculates PTA for right ear', () => {
    // PTA uses 500, 1000, 2000 Hz
    // Right ear: 10 + 15 + 20 = 45 / 3 = 15 dB HL
    const profile = createProfile();
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Right ear: 15 dB HL');
  });

  it('calculates PTA for left ear', () => {
    // Left ear: 10 + 10 + 20 = 40 / 3 = 13.33 ≈ 13 dB HL
    const profile = createProfile();
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Left ear: 13 dB HL');
  });

  it('classifies normal hearing correctly', () => {
    const profile = createProfile({
      thresholds: [
        { frequency: 500, rightEar: 10, leftEar: 10 },
        { frequency: 1000, rightEar: 10, leftEar: 10 },
        { frequency: 2000, rightEar: 10, leftEar: 10 },
      ],
    });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Normal');
  });

  it('classifies mild hearing loss correctly', () => {
    const profile = createProfile({
      thresholds: [
        { frequency: 500, rightEar: 30, leftEar: 30 },
        { frequency: 1000, rightEar: 35, leftEar: 35 },
        { frequency: 2000, rightEar: 40, leftEar: 40 },
      ],
    });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Mild loss');
  });

  it('includes expected PTA when age is provided', () => {
    const profile = createProfile({ age: 50 });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Expected PTA for age 50');
  });

  it('shows positive comparison for better-than-expected hearing', () => {
    const profile = createProfile({
      age: 60,
      thresholds: [
        { frequency: 500, rightEar: 5, leftEar: 5 },
        { frequency: 1000, rightEar: 5, leftEar: 5 },
        { frequency: 2000, rightEar: 5, leftEar: 5 },
      ],
    });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('better than or equal to average');
  });

  it('always includes disclaimer', () => {
    const profile = createProfile();
    const summary = generateSummary(profile);
    
    expect(summary).toContain('self-assessment tool');
    expect(summary).toContain('audiologist');
  });

  it('handles null threshold values', () => {
    const profile = createProfile({
      thresholds: [
        { frequency: 500, rightEar: null, leftEar: 10 },
        { frequency: 1000, rightEar: null, leftEar: 10 },
        { frequency: 2000, rightEar: null, leftEar: 10 },
      ],
    });
    const summary = generateSummary(profile);
    
    // Should still generate summary with available data
    expect(summary).toContain('Left ear');
  });

  it('handles quick test with only 3 frequencies', () => {
    const profile = createProfile({
      thresholds: [
        { frequency: 1000, rightEar: 15, leftEar: 15 },
        { frequency: 4000, rightEar: 25, leftEar: 25 },
        { frequency: 8000, rightEar: 35, leftEar: 35 },
      ],
    });
    const summary = generateSummary(profile);
    
    // PTA only uses 1000Hz in this case (500 and 2000 are missing)
    expect(summary).toContain('Right ear');
    expect(summary).toContain('Left ear');
  });
});

