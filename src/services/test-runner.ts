/**
 * Test runner service - manages hearing test lifecycle
 */

import { getState, setState, navigateTo, rerender } from '../state/app-state';
import { createProfile } from '../storage/profile';
import { HearingTest, TestEventType } from '../audio/hearing-test';
import { AudioInitError } from '../audio/audio-context';
import { TEST_MODES } from '../types';
import { announce } from '../utils/dom';

/**
 * Start the hearing test
 */
export function startTest(): void {
  const { testMode, userAge } = getState();
  const hearingTest = new HearingTest(TEST_MODES[testMode].config);
  
  // Setup event handlers, ignoring a test that has since been stopped
  hearingTest.on((event: TestEventType) => {
    if (getState().hearingTest !== hearingTest) return;
    if (event === 'stateChange') {
      rerender();
    }
    if (event === 'testComplete') {
      handleTestComplete(hearingTest, userAge);
    }
  });
  
  // Store test instance, navigate to test screen and start
  setState({ hearingTest, screen: 'test' });
  hearingTest.start().catch((error: unknown) => {
    if (getState().hearingTest !== hearingTest) return;
    stopTest();
    const reason = error instanceof AudioInitError ? error.message : 'Audio could not be started.';
    announce(`Could not start the test. ${reason}`, 'assertive');
  });
}

/**
 * Stop the active hearing test and return to home
 */
export function stopTest(): void {
  const { hearingTest } = getState();
  setState({ hearingTest: null, screen: 'home' });
  hearingTest?.stop();
}

/**
 * Handle test completion - save results and show them
 */
function handleTestComplete(hearingTest: HearingTest, userAge?: number): void {
  const results = hearingTest.getResults();
  const profile = createProfile({
    ...results,
    name: `${TEST_MODES[getState().testMode].label} - ${new Date().toLocaleDateString()}`,
    age: userAge,
  });
  
  navigateTo('results', { profile });
}

