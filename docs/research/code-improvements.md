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

### 1.2 Inline HTML Templates (Intentionally Unchanged)

**Analysis:** HTML is embedded in TypeScript strings.

**Decision:** Keep as-is. For this size project, template literals work well. The refactoring to separate screen files already improved readability significantly.

**Status:** ⏸️ DEFERRED (acceptable as-is)

---

### 1.3 ~~No State Management Pattern~~ ✅ RESOLVED

**Problem (was):** State was scattered across:
- `let currentScreen` (module-level)
- `let hearingTest` (module-level)  
- `let userAge` (module-level)
- `hearingTest.getState()` (class state)

**Solution implemented:** Created `src/state/app-state.ts` with centralized state management.

**Status:** ✅ COMPLETED

---

### 1.4 ~~Missing Error Boundaries~~ ✅ PARTIALLY RESOLVED

**Problem (was):** No error handling for:
- AudioContext failures (user permission denied)
- LocalStorage quota exceeded
- Canvas rendering failures

**Solution implemented:** Added `AudioInitError` class in `tone-generator.ts` for AudioContext errors. LocalStorage and Canvas errors remain unhandled (acceptable for now).

**Status:** ✅ PARTIALLY COMPLETED

---

### 1.5 ~~README Project Structure Outdated~~ ✅ RESOLVED

**Problem (was):** README mentioned `src/audio/context.ts` which didn't exist.

**Solution:** README updated with accurate project structure including new directories: `screens/`, `state/`, `services/`, `utils/`.

**Status:** ✅ COMPLETED

---

## 🔍 Pass 2: Code Quality & DRY Violations

> **Note:** This section documents issues as they were BEFORE the refactoring. All items marked ✅ have been resolved.

### 2.1 ~~Repetitive Event Listener Patterns~~ ✅ RESOLVED

**Problem (was):** Same pattern repeated 15+ times:

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

### 2.2 ~~Repeated Inline Styles~~ ✅ RESOLVED

**Problem (was):** Same styles appeared multiple times in HTML templates.

**Solution:** Created CSS utility classes in `styles.css`: `.text-muted-sm`, `.text-secondary-lg`, `.flex-buttons`, `.nav-buttons`, `.text-center`, `.mt-md`.

**Status:** ✅ COMPLETED

---

### 2.3 ~~Duplicated Frequency Formatting~~ ✅ RESOLVED

**Problem (was):** Frequency formatting logic appeared in multiple places.

**Solution:** Created `formatFrequency()` utility in `types/index.ts` with 'short', 'full', and 'spoken' styles. Added 5 tests. Now used consistently across `audiogram.ts`, `screens/test.ts`, and `screens/results.ts`.

**Status:** ✅ COMPLETED

---

### 2.4 ~~Magic Numbers in Audiogram~~ ✅ RESOLVED

**Problem (was):** Several magic numbers without explanation.

**Solution:** Added comprehensive JSDoc documentation to `tone-generator.ts` including `REFERENCE_DB_FS`, `MIN_GAIN_DB`, `MAX_GAIN_DB`, and `RAMP_TIME_SEC` with explanations.

**Status:** ✅ COMPLETED

---

### 2.5 Unused CSS Classes (Deferred)

**Analysis:** Several CSS classes may be unused:
- `.btn--full`
- `.sound-wave--inactive`
- `.screen--hidden`
- `.pulse` (animation defined but class not used)

**Decision:** Deferred - low impact. May be useful for future features.

**Status:** ⏸️ DEFERRED

---

### 2.6 ~~Test Coverage Gaps~~ ✅ PARTIALLY RESOLVED

**Problem (was):** Some modules lacked comprehensive tests:
- `audiogram.ts` - 0 tests (canvas rendering)
- `tone-generator.ts` - 0 tests (mocked in hearing-test.test.ts)

**Solution:** Added `audiogram.test.ts` with 12 tests for `generateSummary()`. Canvas rendering and tone-generator remain untested (acceptable for now).

**Status:** ✅ RESOLVED for `generateSummary()`

---

### 2.7 Inconsistent Error Handling (Deferred)

**Analysis:** Some functions silently fail (e.g., `getAllProfiles()` returns empty array on error).

**Decision:** Acceptable for now. The app gracefully degrades - losing saved profiles is unfortunate but not catastrophic.

**Status:** ⏸️ DEFERRED

---

## 🔍 Pass 3: Simplification Opportunities

> **Note:** This section documents issues as they were BEFORE the refactoring. Items marked ✅ have been resolved.

### 3.1 Simplify Profile Storage API (Deferred)

**Analysis:** `saveProfile` naming could be clearer (it always creates new profiles, never updates).

**Decision:** Low priority. The API works correctly, naming is minor issue.

**Status:** ⏸️ DEFERRED

---

### 3.2 Remove Redundant State Spreading (Deferred)

**Analysis:** `getState()` in `HearingTest` creates shallow copies each call.

**Decision:** Very low impact. The defensive copy prevents accidental state mutation.

**Status:** ⏸️ DEFERRED

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

### 3.4 Simplify Audiogram Color Definitions (Deferred)

**Analysis:** Colors are defined in both CSS and TypeScript (Canvas API requires JS colors).

**Decision:** Acceptable duplication. Canvas cannot read CSS variables. Adding a comment would help maintainability.

**Status:** ⏸️ DEFERRED (with note for future)

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

### 3.6 Threshold Drawing Logic (No Action Needed)

**Analysis:** `drawThresholds` iterates thresholds twice (collect points, then draw symbols).

**Decision:** Correct behavior. Lines must be drawn before symbols for proper layering. Performance is not a concern for 6-12 data points.

**Status:** ✅ NO CHANGE NEEDED

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

