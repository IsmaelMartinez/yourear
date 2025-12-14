/**
 * Test runner service - manages hearing test lifecycle
 */

import { getState, setHearingTest, navigateTo } from '../state/app-state';
import { saveProfile } from '../storage/profile';
import { HearingTest, TestEventType } from '../audio/hearing-test';
import { QUICK_TEST_CONFIG } from '../types';

// Render callback - set by main.ts
let renderCallback: (() => void) | null = null;

/**
 * Set the render callback function (called by main.ts)
 */
export function setTestRenderCallback(callback: () => void): void {
  renderCallback = callback;
}

/**
 * Start the hearing test
 */
export function startTest(): void {
  const { testMode, userAge } = getState();
  const config = testMode === 'quick' ? QUICK_TEST_CONFIG : undefined;
  const hearingTest = new HearingTest(config);
  
  // Store test instance
  setHearingTest(hearingTest);
  
  // Setup event handlers
  hearingTest.on((event: TestEventType) => {
    if (event === 'stateChange') {
      renderCallback?.();
    }
    if (event === 'testComplete') {
      handleTestComplete(hearingTest, userAge);
    }
  });
  
  // Navigate to test screen and start
  navigateTo('test');
  hearingTest.start();
}

/**
 * Handle test completion - save results and show them
 */
function handleTestComplete(hearingTest: HearingTest, userAge?: number): void {
  const results = hearingTest.getResults();
  const { testMode } = getState();
  const testLabel = testMode === 'quick' ? 'Quick Test' : 'Full Test';
  
  const profile = saveProfile({ 
    ...results, 
    name: `${testLabel} - ${new Date().toLocaleDateString()}`,
    age: userAge,
  });
  
  navigateTo('results', { profile });
}

