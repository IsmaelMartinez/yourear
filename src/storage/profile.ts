/**
 * Local storage for hearing profiles
 */

import { HearingProfile, HearingThreshold } from '../types';

const STORAGE_KEY = 'yourear_profiles';
const BACKUP_KEY = 'yourear_profiles_backup';

function generateId(): string {
  return crypto.randomUUID();
}

interface StoredProfiles {
  profiles: HearingProfile[];
  /** Raw stored value when it could not be read in full, so it can be backed up before overwriting */
  unreadable: string | null;
}

const isEarLevel = (v: unknown): boolean => v === null || typeof v === 'number';

function isThreshold(t: unknown): boolean {
  if (typeof t !== 'object' || t === null) return false;
  const { frequency, leftEar, rightEar } = t as HearingThreshold;
  return typeof frequency === 'number' && isEarLevel(leftEar) && isEarLevel(rightEar);
}

function toProfile(entry: unknown): HearingProfile | null {
  if (typeof entry !== 'object' || entry === null) return null;
  const p = entry as HearingProfile;
  // new Date(null) is the epoch, so only accept stored strings or numbers
  const rawCreatedAt: unknown = p.createdAt;
  const createdAt = new Date(typeof rawCreatedAt === 'string' || typeof rawCreatedAt === 'number' ? rawCreatedAt : NaN);
  if (
    typeof p.id !== 'string' ||
    !Array.isArray(p.thresholds) ||
    !p.thresholds.every(isThreshold) ||
    isNaN(createdAt.getTime())
  ) {
    return null;
  }
  const updatedAt = new Date(p.updatedAt);
  return {
    ...p,
    name: typeof p.name === 'string' ? p.name : '',
    age: typeof p.age === 'number' ? p.age : undefined,
    createdAt,
    updatedAt: isNaN(updatedAt.getTime()) ? createdAt : updatedAt,
  };
}

function readProfiles(): StoredProfiles {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data === null) return { profiles: [], unreadable: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch (error) {
    console.error('[YourEar] Stored profiles are not valid JSON:', error);
    return { profiles: [], unreadable: data };
  }
  if (!Array.isArray(parsed)) {
    console.error('[YourEar] Stored profiles are not an array');
    return { profiles: [], unreadable: data };
  }

  const profiles = parsed.map(toProfile).filter((p): p is HearingProfile => p !== null);
  if (profiles.length < parsed.length) {
    console.error(`[YourEar] Skipped ${parsed.length - profiles.length} invalid stored profile(s)`);
  }
  return { profiles, unreadable: profiles.length < parsed.length ? data : null };
}

/**
 * Retrieve all saved hearing profiles from localStorage
 * @returns Valid profiles (invalid entries are skipped), or empty array if none exist or on error
 */
export function getAllProfiles(): HearingProfile[] {
  try {
    return readProfiles().profiles;
  } catch (error) {
    console.error('[YourEar] Failed to load profiles from localStorage:', error);
    return [];
  }
}

/**
 * Create and save a new hearing profile
 * @param profile - Profile data without ID (ID will be generated)
 * @returns The created profile with generated ID
 */
export function createProfile(profile: Omit<HearingProfile, 'id'>): HearingProfile {
  const newProfile: HearingProfile = { ...profile, id: generateId() };

  try {
    const { profiles, unreadable } = readProfiles();
    // Keep a copy of anything we could not read in full before overwriting it
    if (unreadable !== null) localStorage.setItem(BACKUP_KEY, unreadable);
    profiles.push(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('[YourEar] Failed to save profile to localStorage:', error);
    // Still return the profile even if save failed - user can see their results
  }

  return newProfile;
}

/**
 * Get the most recently created profile
 * @returns Latest profile or null if no profiles exist
 */
export function getLatestProfile(): HearingProfile | null {
  const profiles = getAllProfiles();
  if (profiles.length === 0) return null;
  return profiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}
