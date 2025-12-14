/**
 * Centralized application state management
 * 
 * Simple state object pattern - no external dependencies needed
 * for an app this size.
 */

import { HearingProfile } from '../types';
import { HearingTest } from '../audio/hearing-test';

export type Screen = 'home' | 'calibration' | 'test' | 'results';
export type TestMode = 'full' | 'quick';

export interface AppState {
  /** Current active screen */
  screen: Screen;
  /** Full or quick test mode */
  testMode: TestMode;
  /** User's age (optional, for comparison) */
  userAge?: number;
  /** Active hearing test instance */
  hearingTest: HearingTest | null;
  /** Profile being viewed in results */
  viewingProfile?: HearingProfile;
}

/**
 * Create initial application state
 */
export function createInitialState(): AppState {
  return {
    screen: 'home',
    testMode: 'full',
    userAge: undefined,
    hearingTest: null,
    viewingProfile: undefined,
  };
}

// Global state singleton
let state: AppState = createInitialState();

// Render callback - set by main.ts
let renderCallback: (() => void) | null = null;

/**
 * Set the render callback function
 */
export function setRenderCallback(callback: () => void): void {
  renderCallback = callback;
}

/**
 * Get current application state (read-only)
 */
export function getState(): Readonly<AppState> {
  return state;
}

/**
 * Update application state and trigger re-render
 */
export function setState(updates: Partial<AppState>): void {
  state = { ...state, ...updates };
  renderCallback?.();
}

/**
 * Navigate to a different screen
 */
export function navigateTo(screen: Screen, options?: { 
  mode?: TestMode;
  profile?: HearingProfile;
}): void {
  setState({
    screen,
    ...(options?.mode && { testMode: options.mode }),
    ...(options?.profile && { viewingProfile: options.profile }),
  });
}

/**
 * Set user age
 */
export function setUserAge(age: number | undefined): void {
  setState({ userAge: age });
}

/**
 * Set the active hearing test instance
 */
export function setHearingTest(test: HearingTest | null): void {
  setState({ hearingTest: test });
}

/**
 * Reset state to initial values
 */
export function resetState(): void {
  state = createInitialState();
}

