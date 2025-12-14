/**
 * YourEar - Browser-based hearing assessment
 * 
 * Application entry point
 */

import './styles.css';
import { getState, setRenderCallback } from './state/app-state';
import { setTestRenderCallback } from './services/test-runner';
import { renderHome } from './screens/home';
import { renderCalibration } from './screens/calibration';
import { renderTest, cleanupTestScreen } from './screens/test';
import { renderResults } from './screens/results';
import { renderComparison } from './screens/comparison';
import { renderTinnitus, cleanupTinnitusScreen } from './screens/tinnitus';
import { createProfile, getAllProfiles } from './storage/profile';

// ============================================
// Screen Router
// ============================================

/**
 * Main render function - routes to appropriate screen
 */
function render(): void {
  // Clean up screen-specific handlers when leaving
  const { screen } = getState();
  if (screen !== 'test') {
    cleanupTestScreen();
  }
  if (screen !== 'tinnitus') {
    cleanupTinnitusScreen();
  }
  
  switch (screen) {
    case 'home': 
      renderHome(); 
      break;
    case 'calibration': 
      renderCalibration(); 
      break;
    case 'test': 
      renderTest(); 
      break;
    case 'results': 
      renderResults(); 
      break;
    case 'comparison':
      renderComparison();
      break;
    case 'tinnitus':
      renderTinnitus();
      break;
  }
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

// Set up render callbacks
setRenderCallback(render);
setTestRenderCallback(render);

// Check for URL parameters (demo mode)
checkUrlParams();

// Initial render
render();
