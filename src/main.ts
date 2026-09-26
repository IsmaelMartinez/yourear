/**
 * YourEar - Browser-based hearing assessment
 * 
 * Application entry point
 */

import './styles.css';
import { getState, setRenderCallback, type Screen } from './state/app-state';
import { renderHome } from './screens/home';
import { renderCalibration, cleanupCalibrationScreen } from './screens/calibration';
import { renderTest, cleanupTestScreen } from './screens/test';
import { renderResults } from './screens/results';
import { renderComparison } from './screens/comparison';
import { renderTinnitus, cleanupTinnitusScreen } from './screens/tinnitus';
import { renderSpeechNoise, cleanupSpeechNoiseScreen } from './screens/speech-noise';
import { createProfile, getAllProfiles } from './storage/profile';

// ============================================
// Screen Router
// ============================================

const SCREENS: Record<Screen, { render: () => void; cleanup?: () => void }> = {
  home: { render: renderHome },
  calibration: { render: renderCalibration, cleanup: cleanupCalibrationScreen },
  test: { render: renderTest, cleanup: cleanupTestScreen },
  results: { render: renderResults },
  comparison: { render: renderComparison },
  tinnitus: { render: renderTinnitus, cleanup: cleanupTinnitusScreen },
  'speech-noise': { render: renderSpeechNoise, cleanup: cleanupSpeechNoiseScreen },
};

/**
 * Main render function - cleans up every other screen, then renders the current one
 */
function render(): void {
  const { screen } = getState();
  for (const [name, { cleanup }] of Object.entries(SCREENS)) {
    if (name !== screen) cleanup?.();
  }
  SCREENS[screen].render();
}

// ============================================
// Demo Mode
// ============================================

/**
 * Check for demo mode URL parameter
 */
function checkUrlParams(): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === 'true') {
    seedDemoProfile();
  }
}

/**
 * Seed demo profile for testing
 */
function seedDemoProfile(): void {
  const existing = getAllProfiles();
  const hasDemo = existing.some(p => p.name?.includes('Demo'));
  
  if (!hasDemo) {
    createProfile({
      name: 'Demo - Age 43',
      age: 43,
      createdAt: new Date(),
      updatedAt: new Date(),
      thresholds: [
        { frequency: 250, rightEar: 5, leftEar: 10 },
        { frequency: 500, rightEar: 10, leftEar: 10 },
        { frequency: 1000, rightEar: 10, leftEar: 0 },
        { frequency: 2000, rightEar: 15, leftEar: 25 },
        { frequency: 4000, rightEar: 35, leftEar: 25 },
        { frequency: 8000, rightEar: 30, leftEar: 45 },
      ],
    });
  }
}

// ============================================
// Initialize Application
// ============================================

// Set up render callback
setRenderCallback(render);

// Check for URL parameters (demo mode)
checkUrlParams();

// Initial render
render();
