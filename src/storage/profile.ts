/**
 * Local storage management for hearing profiles
 */

import { HearingProfile } from '../types';

const STORAGE_KEY = 'yourear_profiles';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all saved profiles
 */
export function getAllProfiles(): HearingProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const profiles = JSON.parse(data) as HearingProfile[];
    // Restore Date objects
    return profiles.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  } catch {
    console.error('Failed to load profiles from storage');
    return [];
  }
}

/**
 * Save a new profile
 */
export function saveProfile(profile: Omit<HearingProfile, 'id'>): HearingProfile {
  const profiles = getAllProfiles();
  const newProfile: HearingProfile = {
    ...profile,
    id: generateId(),
  };
  
  profiles.push(newProfile);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  
  return newProfile;
}

/**
 * Update an existing profile
 */
export function updateProfile(id: string, updates: Partial<HearingProfile>): HearingProfile | null {
  const profiles = getAllProfiles();
  const index = profiles.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  profiles[index] = {
    ...profiles[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  return profiles[index];
}

/**
 * Delete a profile
 */
export function deleteProfile(id: string): boolean {
  const profiles = getAllProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  
  if (filtered.length === profiles.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Get the most recent profile
 */
export function getLatestProfile(): HearingProfile | null {
  const profiles = getAllProfiles();
  if (profiles.length === 0) return null;
  
  return profiles.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

/**
 * Export profiles as JSON for backup
 */
export function exportProfiles(): string {
  const profiles = getAllProfiles();
  return JSON.stringify(profiles, null, 2);
}

/**
 * Import profiles from JSON
 */
export function importProfiles(json: string): number {
  try {
    const imported = JSON.parse(json) as HearingProfile[];
    const existing = getAllProfiles();
    const existingIds = new Set(existing.map(p => p.id));
    
    // Only add profiles that don't already exist
    const newProfiles = imported.filter(p => !existingIds.has(p.id));
    const merged = [...existing, ...newProfiles];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return newProfiles.length;
  } catch {
    throw new Error('Invalid profile data');
  }
}
