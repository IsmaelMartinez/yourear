/**
 * Calibration screen - Age input and headphone testing before the test
 */

import { getAppContainer, onClick, onChange, announce, focusMain } from '../utils/dom';
import { playCalibrationTone, stopTone } from '../audio/tone-generator';
import { getState, navigateTo, setUserAge } from '../state/app-state';
import { startTest } from '../services/test-runner';

export function renderCalibration(): void {
  const app = getAppContainer();
  const { testMode, userAge } = getState();
  const isQuick = testMode === 'quick';
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="${isQuick ? 'Quick' : 'Full'} Test Setup">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">${isQuick ? '⚡' : '🔊'}</div>
        <h1 class="header__title">${isQuick ? 'Quick Test' : 'Full Test'} Setup</h1>
        <p class="header__subtitle">${isQuick ? '3 frequencies · ~2 minutes' : '6 frequencies · ~8 minutes'}</p>
      </header>
      
      <section class="card card--glow" aria-labelledby="age-section-title">
        <div class="calibration">
          <h2 class="card__title" id="age-section-title" style="justify-content: center;"><span aria-hidden="true">👤</span> Your Age</h2>
          <p id="age-description" class="text-center" style="color: var(--text-secondary);">
            Enter your age to compare your results with expected values for your age group.
          </p>
          
          <div style="display: flex; justify-content: center; align-items: center; margin: var(--spacing-lg) 0;">
            <label for="age-input" class="sr-only">Your age in years</label>
            <input type="number" id="age-input" min="5" max="120" value="${userAge || ''}" 
              placeholder="Age" 
              aria-describedby="age-description"
              autocomplete="off"
              style="
                width: 120px;
                padding: var(--spacing-md);
                font-size: 1.5rem;
                text-align: center;
                background: var(--bg-tertiary);
                border: 2px solid var(--border-color);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-family: var(--font-mono);
              "
            />
            <span style="padding: var(--spacing-md); font-size: 1.2rem; color: var(--text-muted);" aria-hidden="true">years</span>
          </div>
        </div>
      </section>
      
      <section class="card" aria-labelledby="headphone-section-title">
        <div class="calibration">
          <h2 class="card__title" id="headphone-section-title" style="justify-content: center;"><span aria-hidden="true">🎧</span> Test Your Headphones</h2>
          <p id="headphone-description" class="text-center" style="color: var(--text-secondary);">
            Click each button to play a test tone. Adjust your volume until comfortable.
          </p>
          
          <div class="calibration__ear-buttons" role="group" aria-label="Ear test buttons">
            <button class="btn btn--secondary" id="test-right" style="background: rgba(255, 107, 107, 0.1); border-color: var(--accent-right);" aria-describedby="headphone-description">
              <span aria-hidden="true">◯</span> Right Ear
            </button>
            <button class="btn btn--secondary" id="test-left" style="background: rgba(78, 205, 196, 0.1); border-color: var(--accent-left);" aria-describedby="headphone-description">
              <span aria-hidden="true">✕</span> Left Ear
            </button>
          </div>
          
          <p class="calibration__tip" role="note"><span aria-hidden="true">💡</span> Make sure both ears can hear the test tones!</p>
        </div>
      </section>
      
      <nav class="nav-buttons" aria-label="Test navigation">
        <button class="btn btn--secondary" id="back-home" style="flex: 1;">
          <span aria-hidden="true">←</span> Back
        </button>
        <button class="btn btn--primary btn--large" id="begin-test" style="flex: 2;">
          I'm ready - Begin Test <span aria-hidden="true">→</span>
        </button>
      </nav>
    </main>
  `;
  
  announce(`${isQuick ? 'Quick' : 'Full'} test setup. Enter your age and test your headphones before starting.`);
  
  // Track age changes
  onChange('age-input', (value) => {
    const val = parseInt(value);
    setUserAge((val >= 5 && val <= 120) ? val : undefined);
  });
  
  // Event bindings
  onClick('test-right', () => {
    playCalibrationTone('right');
    announce('Playing test tone in right ear');
  });
  onClick('test-left', () => {
    playCalibrationTone('left');
    announce('Playing test tone in left ear');
  });
  onClick('back-home', () => { 
    stopTone(); 
    navigateTo('home'); 
  });
  onClick('begin-test', () => { 
    stopTone();
    // Ensure age is captured from input
    const ageInput = document.getElementById('age-input') as HTMLInputElement;
    const val = parseInt(ageInput?.value || '');
    setUserAge((val >= 5 && val <= 120) ? val : undefined);
    startTest();
  });
  
  focusMain();
}

