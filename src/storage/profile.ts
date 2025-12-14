/**
 * Local storage for hearing profiles
 */

import { HearingProfile } from '../types';

const STORAGE_KEY = 'yourear_profiles';

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Retrieve all saved hearing profiles from localStorage
 * @returns Array of profiles, or empty array if none exist or on error
 */
export function getAllProfiles(): HearingProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    return (JSON.parse(data) as HearingProfile[]).map(p => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
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
  const profiles = getAllProfiles();
  const newProfile: HearingProfile = { ...profile, id: generateId() };
  
  try {
    profiles.push(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('[YourEar] Failed to save profile to localStorage:', error);
    // Still return the profile even if save failed - user can see their results
  }
  
  return newProfile;
}

/**
 * @deprecated Use createProfile instead. This alias exists for backwards compatibility.
 */
export const saveProfile = createProfile;

/**
 * Get the most recently created profile
 * @returns Latest profile or null if no profiles exist
 */
export function getLatestProfile(): HearingProfile | null {
  const profiles = getAllProfiles();
  if (profiles.length === 0) return null;
  return profiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}
