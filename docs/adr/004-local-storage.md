# ADR 004: LocalStorage for Profile Persistence

## Status
Accepted

## Context
Need to store hearing profiles for users to track changes over time. Options:
1. No persistence (session only)
2. LocalStorage (browser-based)
3. IndexedDB (browser-based, more capacity)
4. Backend database (requires server)

## Decision
Use **LocalStorage** with JSON serialization.

## Rationale
- **No account required** - Privacy-friendly, zero friction
- **Works offline** - No network dependency
- **Simple API** - `getItem`/`setItem` with JSON
- **Sufficient capacity** - ~5MB limit, audiograms are tiny (~1KB each)
- **Cross-session** - Persists between browser sessions

## Consequences
### Positive
- Zero setup for users
- No backend infrastructure needed
- Fast read/write
- GDPR-friendly (data stays on user's device)

### Negative
- Lost if user clears browser data
- Not shared across devices
- No backup/sync capability

## Implementation
```typescript
const STORAGE_KEY = 'yourear_profiles';
const BACKUP_KEY = 'yourear_profiles_backup';

function createProfile(profile: Omit<HearingProfile, 'id'>): HearingProfile {
  const newProfile: HearingProfile = { ...profile, id: generateId() };

  try {
    // Invalid entries are skipped one at a time; `unreadable` holds the raw value
    // when it was unparseable, not an array, or had entries skipped
    const { profiles, unreadable } = readProfiles();
    if (unreadable !== null) localStorage.setItem(BACKUP_KEY, unreadable);
    profiles.push(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    // e.g. QuotaExceededError: log and still return the profile so results can be shown
    console.error('[YourEar] Failed to save profile to localStorage:', error);
  }

  return newProfile;
}
```

If the backup write fails, the main key is left untouched. Profile names and ids are passed through `escapeHtml` before being interpolated into `innerHTML`, because the `github.io` origin (and its localStorage) is shared with other Pages sites.

## Future Considerations
- Add export/import JSON for backup
- Consider IndexedDB if storing audio recordings
- Optional account system for cross-device sync

