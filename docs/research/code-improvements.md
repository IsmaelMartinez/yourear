# Code Improvements & Simplifications

## Overview

This document captures findings from three comprehensive reviews of the YourEar codebase, identifying improvements and simplifications across architecture, code quality, and performance.

**Review Date:** December 2024  
**Codebase Size:** ~1,500 lines of TypeScript/CSS  
**Status:** ✅ **ALL PHASES COMPLETED**

---

## 📊 Review Summary

| Category | Issues Found | Priority Items | Est. Effort |
|----------|--------------|----------------|-------------|
| Architecture | 8 | 3 | ~6-8 hours |
| Code Quality | 12 | 5 | ~4-6 hours |
| Simplifications | 10 | 4 | ~3-4 hours |
| **Total** | **30** | **12** | **~13-18 hours** |

---

## 🔍 Pass 1: Architecture & Structure

> **Note:** This section documents issues as they were BEFORE the refactoring. All items marked ✅ have been resolved.

### 1.1 ~~`main.ts` Is Too Large (555 lines)~~ ✅ RESOLVED

**Problem (was):** Single file handled all UI screens, event binding, state management, and navigation.

**Previous state:**
- 4 render functions with inline HTML templates
- Event handlers mixed with rendering logic
- Global state variables scattered at top

**Solution implemented:** ✅ Extracted into focused modules:

```
src/
├── main.ts           # App bootstrap only (85 lines)
├── screens/
│   ├── home.ts       # Home screen
│   ├── calibration.ts # Calibration/setup screen
│   ├── test.ts       # Active test screen
│   └── results.ts    # Results display
├── state/
│   └── app-state.ts  # Centralized state management
├── services/
│   └── test-runner.ts # Test lifecycle management
└── utils/
    └── dom.ts        # DOM & accessibility helpers
```

**Status:** ✅ COMPLETED

---

### 1.2 Inline HTML Templates

**Problem:** HTML is embedded in TypeScript strings, making it hard to maintain and losing IDE support.

**Current pattern:**
```typescript
app.innerHTML = `
  <main id="main-content" class="screen">
    <header class="header">
      <!-- 100+ lines of HTML -->
    </header>
  </main>
`;
```

**Options:**
1. **Keep as-is** - Works fine for this size project
2. **Template literals with tagged functions** - Better syntax highlighting
3. **Lit-html or similar** - Lightweight templating (~3KB)

**Recommendation:** Keep current approach but extract templates to separate functions for readability.

**Impact:** Medium  
**Effort:** 2-3 hours  
**Priority:** ⭐⭐

---

### 1.3 No State Management Pattern

**Problem:** State is scattered across:
- `let currentScreen` (module-level)
- `let hearingTest` (module-level)  
- `let userAge` (module-level)
- `hearingTest.getState()` (class state)

**Recommendation:** Simple state object:

```typescript
interface AppState {
  screen: 'home' | 'calibration' | 'test' | 'results';
  testMode: 'full' | 'quick';
  userAge?: number;
  currentProfile?: HearingProfile;
}

const state: AppState = { screen: 'home', testMode: 'full' };
```

**Impact:** Medium  
**Effort:** 2 hours  
**Priority:** ⭐⭐

---

### 1.4 Missing Error Boundaries

**Problem:** No error handling for:
- AudioContext failures (user permission denied)
- LocalStorage quota exceeded
- Canvas rendering failures

**Recommendation:** Add try-catch with user-friendly error messages.

**Impact:** Medium  
**Effort:** 1-2 hours  
**Priority:** ⭐⭐

---

### 1.5 README Project Structure Outdated

**Problem:** README mentions `src/audio/context.ts` which doesn't exist.

```markdown
# Current README (incorrect):
├── audio/
│   ├── context.ts       # AudioContext management  <-- doesn't exist
│   ├── tone-generator.ts
│   └── hearing-test.ts
```

**Impact:** Low  
**Effort:** 15 minutes  
**Priority:** ⭐

---

## 🔍 Pass 2: Code Quality & DRY Violations

> **Note:** This section documents issues as they were BEFORE the refactoring. All items marked ✅ have been resolved.

### 2.1 ~~Repetitive Event Listener Patterns~~ ✅ RESOLVED

**Problem:** Same pattern repeated 15+ times:

```typescript
document.getElementById('start-full-test')?.addEventListener('click', () => {
  testMode = 'full';
  currentScreen = 'calibration';
  render();
});

document.getElementById('start-quick-test')?.addEventListener('click', () => {
  testMode = 'quick';
  currentScreen = 'calibration';
  render();
});
```

**Recommendation:** Extract helper function:

```typescript
function onClick(id: string, handler: () => void): void {
  document.getElementById(id)?.addEventListener('click', handler);
}

// Or data-driven:
const actions = {
  'start-full-test': () => navigateTo('calibration', { mode: 'full' }),
  'start-quick-test': () => navigateTo('calibration', { mode: 'quick' }),
};
```

**Impact:** Medium  
**Effort:** 1 hour  
**Priority:** ⭐⭐

---

### 2.2 Repeated Inline Styles

**Problem:** Same styles appear multiple times in HTML templates:

```typescript
// Appears 5+ times:
style="color: var(--text-muted); margin-top: var(--spacing-md); font-size: 0.9rem;"
```

**Recommendation:** Create CSS utility classes:

```css
.text-muted-small {
  color: var(--text-muted);
  margin-top: var(--spacing-md);
  font-size: 0.9rem;
}
```

**Impact:** Low  
**Effort:** 30 minutes  
**Priority:** ⭐

---

### 2.3 Duplicated Frequency Formatting

**Problem:** Frequency formatting logic appears in multiple places:

```typescript
// In main.ts:
const freqLabel = state.currentFrequency >= 1000 
  ? `${state.currentFrequency / 1000}` : String(state.currentFrequency);

// In audiogram.ts:
const label = freq >= 1000 ? `${freq / 1000}k` : String(freq);
```

**Recommendation:** Create shared utility:

```typescript
export function formatFrequency(hz: number, style: 'short' | 'spoken' = 'short'): string {
  if (style === 'spoken') {
    return hz >= 1000 ? `${hz / 1000} kilohertz` : `${hz} hertz`;
  }
  return hz >= 1000 ? `${hz / 1000}k` : String(hz);
}
```

**Impact:** Low  
**Effort:** 30 minutes  
**Priority:** ⭐

---

### 2.4 Magic Numbers in Audiogram

**Problem:** Several magic numbers without explanation:

```typescript
const REFERENCE_DB = -60;  // Why -60? No comment
const rampTime = 0.02;     // 20ms - could be named constant
```

**Recommendation:** Add constants with documentation:

```typescript
/** 
 * Reference level: 0 dB HL maps to approximately -60 dB relative to full scale.
 * This provides headroom for testing up to 90+ dB HL without clipping.
 */
const REFERENCE_DB_FS = -60;
```

**Impact:** Low  
**Effort:** 30 minutes  
**Priority:** ⭐

---

### 2.5 Unused CSS Classes

**Problem:** Several CSS classes appear to be unused:
- `.btn--full`
- `.sound-wave--inactive`
- `.screen--hidden`
- `.pulse` (animation defined but class not used)

**Recommendation:** Remove or mark as intentionally kept for future use.

**Impact:** Low  
**Effort:** 15 minutes  
**Priority:** ⭐

---

### 2.6 ~~Test Coverage Gaps~~ ✅ PARTIALLY RESOLVED

**Problem (was):** Some modules lacked comprehensive tests:
- `audiogram.ts` - 0 tests (canvas rendering)
- `tone-generator.ts` - 0 tests (mocked in hearing-test.test.ts)

**Solution:** Added `audiogram.test.ts` with 12 tests for `generateSummary()`. Canvas rendering and tone-generator remain untested (acceptable for now).

**Status:** ✅ RESOLVED for `generateSummary()`

---

### 2.7 Inconsistent Error Handling

**Problem:** Some functions silently fail:

```typescript
export function getAllProfiles(): HearingProfile[] {
  try {
    // ...
  } catch {
    return [];  // Silent failure - user doesn't know if data was lost
  }
}
```

**Recommendation:** Log errors at minimum, consider user notification for critical failures.

**Impact:** Medium  
**Effort:** 1 hour  
**Priority:** ⭐⭐

---

## 🔍 Pass 3: Simplification Opportunities

> **Note:** This section documents issues as they were BEFORE the refactoring. Items marked ✅ have been resolved.

### 3.1 Simplify Profile Storage API (Deferred)

**Problem:** `saveProfile` takes profile without ID but adds one, which is confusing:

```typescript
export function saveProfile(profile: Omit<HearingProfile, 'id'>): HearingProfile
```

**Recommendation:** Rename to `createProfile` for clarity, or:

```typescript
export function saveProfile(profile: HearingProfile): HearingProfile;
export function createProfile(data: Omit<HearingProfile, 'id'>): HearingProfile;
```

**Impact:** Low  
**Effort:** 15 minutes  
**Priority:** ⭐

---

### 3.2 Remove Redundant State Spreading

**Problem:** `getState()` creates new objects unnecessarily:

```typescript
getState(): Readonly<TestState> {
  return { ...this.state };  // Creates shallow copy every call
}
```

**Recommendation:** For read-only access, just return the object (TypeScript's Readonly is compile-time only anyway):

```typescript
getState(): Readonly<TestState> {
  return this.state;
}
```

**Impact:** Very Low  
**Effort:** 5 minutes  
**Priority:** ⭐

---

### 3.3 ~~Consolidate Test Configurations~~ ✅ RESOLVED

**Problem (was):** `QUICK_TEST_CONFIG` duplicated most of `DEFAULT_TEST_CONFIG`:

```typescript
export const QUICK_TEST_CONFIG: TestConfig = {
  frequencies: QUICK_TEST_FREQUENCIES,
  startLevel: 40,        // Same as DEFAULT
  minLevel: -10,         // Same as DEFAULT
  maxLevel: 90,          // Same as DEFAULT
  stepUp: 5,             // Same as DEFAULT
  stepDown: 10,          // Same as DEFAULT
  toneDuration: 1000,    // Different
  responseDuration: 2500, // Different
};
```

**Recommendation:** Use spread operator:

```typescript
export const QUICK_TEST_CONFIG: TestConfig = {
  ...DEFAULT_TEST_CONFIG,
  frequencies: QUICK_TEST_FREQUENCIES,
  toneDuration: 1000,
  responseDuration: 2500,
};
```

**Impact:** Low  
**Effort:** 5 minutes  
**Priority:** ⭐⭐

---

### 3.4 Simplify Audiogram Color Definitions

**Problem:** Colors are defined in both CSS and TypeScript:

```css
/* styles.css */
--accent-right: #ff6b6b;
--accent-left: #4ecdc4;
```

```typescript
/* audiogram.ts */
const COLORS = {
  rightEar: '#ff6b6b',
  leftEar: '#4ecdc4',
};
```

**Options:**
1. Read CSS variables in JS (adds complexity)
2. Single source of truth in JS, inject to CSS (over-engineering)
3. Accept duplication with comment (pragmatic)

**Recommendation:** Add comment noting duplication:

```typescript
// Note: These colors are duplicated in styles.css as CSS variables
// Keep them in sync when changing
const COLORS = { /* ... */ };
```

**Impact:** Very Low  
**Effort:** 5 minutes  
**Priority:** ⭐

---

### 3.5 ~~Remove generateId String Concatenation~~ ✅ RESOLVED

**Problem (was):** `generateId()` used deprecated `substr`:

```typescript
function generateId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

**Recommendation:** Use modern API:

```typescript
function generateId(): string {
  return `profile_${Date.now()}_${crypto.randomUUID().slice(0, 9)}`;
}
```

Or simpler:
```typescript
function generateId(): string {
  return crypto.randomUUID();
}
```

**Impact:** Low  
**Effort:** 5 minutes  
**Priority:** ⭐⭐

---

### 3.6 Simplify Threshold Drawing Logic

**Problem:** `drawThresholds` iterates thresholds twice (once for points, once for symbols):

```typescript
// First pass - collect points
thresholds.forEach(t => {
  if (t.rightEar !== null) rightPoints.push({ x, y });
  if (t.leftEar !== null) leftPoints.push({ x, y });
});

// Draw lines
this.drawLine(rightPoints, COLORS.rightEar);
this.drawLine(leftPoints, COLORS.leftEar);

// Second pass - draw symbols
thresholds.forEach(t => {
  if (t.rightEar !== null) this.drawCircle(...);
  if (t.leftEar !== null) this.drawX(...);
});
```

**Recommendation:** Acceptable as-is for clarity. Lines should be drawn before symbols (correct layering). Could merge into single pass if performance matters (it doesn't for 6-12 points).

**Impact:** None  
**Effort:** N/A  
**Priority:** - (no action)

---

### 3.7 ~~Dead Code: Demo Mode Under-Documented~~ ✅ RESOLVED

**Problem (was):** `?demo=true` URL parameter existed but was not documented:

```typescript
function checkUrlParams(): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === 'true') {
    seedDemoProfile();
  }
}
```

**Recommendation:** Either document in README or remove if not needed.

**Impact:** Very Low  
**Effort:** 10 minutes  
**Priority:** ⭐

---

## 🎯 Action Plan

### ✅ Phase 1: Quick Wins (COMPLETED)

| # | Task | Status |
|---|------|--------|
| 1 | Consolidate QUICK_TEST_CONFIG with spread | ✅ Done |
| 2 | Fix deprecated `substr` → `crypto.randomUUID` | ✅ Done |
| 3 | Update README project structure | ✅ Done |
| 4 | Document demo mode in README | ✅ Done |
| 5 | Add missing constant documentation | ✅ Done |
| 6 | Create `formatFrequency` utility + tests | ✅ Done |

---

### ✅ Phase 2: Code Quality (COMPLETED)

| # | Task | Status |
|---|------|--------|
| 1 | Extract `onClick()` and `navigateTo()` helpers | ✅ Done |
| 2 | Add CSS utility classes (`.text-muted-sm`, `.flex-buttons`, etc.) | ✅ Done |
| 3 | Add `AudioInitError` class + error handling | ✅ Done |
| 4 | Add 12 tests for `generateSummary()` | ✅ Done |

---

### ✅ Phase 3: Architecture (COMPLETED)

| # | Task | Status |
|---|------|--------|
| 1 | Extract screens to `screens/` directory (4 modules) | ✅ Done |
| 2 | Create centralized state in `state/app-state.ts` | ✅ Done |
| 3 | Create DOM utilities in `utils/dom.ts` | ✅ Done |
| 4 | Create test runner service in `services/test-runner.ts` | ✅ Done |

---

## 📈 Metrics After Improvements

| Metric | Before | After |
|--------|--------|-------|
| `main.ts` lines | 555 | **85** |
| Screen modules | 0 | **4** (~100 lines each) |
| Test count | 42 | **59** (+17 tests) |
| Test files | 3 | **4** (+audiogram.test.ts) |
| Helper functions | 2 | **8** (onClick, navigateTo, formatFrequency, etc.) |
| State management | Scattered globals | **Centralized AppState** |
| Documented constants | ~50% | **~95%** |

---

## 🚫 What NOT to Change

Some things were considered but intentionally left as-is:

1. **No framework migration** - The app is small enough that vanilla TS/JS is appropriate
2. **No build tool changes** - Vite works well for this project
3. **No CSS-in-JS** - Plain CSS with variables is sufficient
4. **No state management library** - Simple state object is enough
5. **Canvas for audiogram** - Works well, no need for SVG or charting library

---

## References

- [Original Future Features](./future-features.md)
- [ADR-001: Web Audio API](../adr/001-web-audio-api.md)
- [ADR-007: Accessibility](../adr/007-accessibility.md)

