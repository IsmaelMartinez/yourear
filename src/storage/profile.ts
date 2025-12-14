/**
 * Local storage for hearing profiles
 */

import { HearingProfile } from '../types';

const STORAGE_KEY = 'yourear_profiles';

function generateId(): string {
  return crypto.randomUUID();
}

export function getAllProfiles(): HearingProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    return (JSON.parse(data) as HearingProfile[]).map(p => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  } catch {
    return [];
  }
}

export function saveProfile(profile: Omit<HearingProfile, 'id'>): HearingProfile {
  const profiles = getAllProfiles();
  const newProfile: HearingProfile = { ...profile, id: generateId() };
  profiles.push(newProfile);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  return newProfile;
}

export function getLatestProfile(): HearingProfile | null {
  const profiles = getAllProfiles();
  if (profiles.length === 0) return null;
  return profiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}
