import { describe, it, expect, beforeEach } from 'vitest';
import { getAllProfiles, saveProfile, getLatestProfile } from './profile';

describe('profile storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAllProfiles', () => {
    it('returns empty array when no profiles exist', () => {
      expect(getAllProfiles()).toEqual([]);
    });

    it('returns saved profiles', () => {
      const profile = saveProfile({
        name: 'Test Profile',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        thresholds: [],
      });

      const profiles = getAllProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('Test Profile');
      expect(profiles[0].id).toBe(profile.id);
    });

    it('restores Date objects', () => {
      saveProfile({
        name: 'Test',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        thresholds: [],
      });

      const profiles = getAllProfiles();
      expect(profiles[0].createdAt).toBeInstanceOf(Date);
      expect(profiles[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('saveProfile', () => {
    it('generates unique id', () => {
      const profile1 = saveProfile({
        name: 'Test 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        thresholds: [],
      });

      const profile2 = saveProfile({
        name: 'Test 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        thresholds: [],
      });

      expect(profile1.id).not.toBe(profile2.id);
      expect(profile1.id).toMatch(/^profile_\d+_/);
    });

    it('persists to localStorage', () => {
      saveProfile({
        name: 'Persisted',
        createdAt: new Date(),
        updatedAt: new Date(),
        thresholds: [],
      });

      const stored = localStorage.getItem('yourear_profiles');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toHaveLength(1);
    });

    it('preserves thresholds', () => {
      const thresholds = [
        { frequency: 1000, leftEar: 20, rightEar: 15 },
        { frequency: 2000, leftEar: 25, rightEar: 20 },
      ];

      saveProfile({
        name: 'With Thresholds',
        createdAt: new Date(),
        updatedAt: new Date(),
        thresholds,
      });

      const profiles = getAllProfiles();
      expect(profiles[0].thresholds).toEqual(thresholds);
    });
  });

  describe('getLatestProfile', () => {
    it('returns null when no profiles exist', () => {
      expect(getLatestProfile()).toBeNull();
    });

    it('returns most recent profile', () => {
      saveProfile({
        name: 'Old',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        thresholds: [],
      });

      saveProfile({
        name: 'New',
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-01'),
        thresholds: [],
      });

      saveProfile({
        name: 'Middle',
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
        thresholds: [],
      });

      const latest = getLatestProfile();
      expect(latest?.name).toBe('New');
    });
  });
});

