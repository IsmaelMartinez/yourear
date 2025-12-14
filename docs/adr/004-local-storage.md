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

function saveProfile(profile: HearingProfile): void {
  const profiles = getAllProfiles();
  profiles.push({ ...profile, id: generateId() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}
```

## Future Considerations
- Add export/import JSON for backup
- Consider IndexedDB if storing audio recordings
- Optional account system for cross-device sync

