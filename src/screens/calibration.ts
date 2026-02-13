/**
 * Calibration screen - Age input and headphone testing before the test
 */

import { getAppContainer, onClick, onChange, announce, focusMain } from '../utils/dom';
import { playCalibrationTone, stopTone } from '../audio/tone-generator';
import { getState, navigateTo, setUserAge } from '../state/app-state';
import { startTest } from '../services/test-runner';

const MODE_CONFIG = {
  quick:    { icon: '⚡', label: 'Quick Test',    subtitle: '3 frequencies · ~2 minutes' },
  full:     { icon: '🔊', label: 'Full Test',     subtitle: '6 frequencies · ~8 minutes' },
  detailed: { icon: '🔬', label: 'Detailed Test', subtitle: '11 frequencies · ~15 minutes' },
} as const;

export function renderCalibration(): void {
  const app = getAppContainer();
  const { testMode, userAge } = getState();
  const modeConfig = MODE_CONFIG[testMode];

  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="${modeConfig.label} Setup">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">${modeConfig.icon}</div>
        <h1 class="header__title">${modeConfig.label} Setup</h1>
        <p class="header__subtitle">${modeConfig.subtitle}</p>
      </header>
      
      <section class="card card--glow" aria-labelledby="age-section-title">
        <div class="calibration">
          <h2 class="card__title justify-center" id="age-section-title"><span aria-hidden="true">👤</span> Your Age</h2>
          <p id="age-description" class="text-center text-secondary">
            Enter your age to compare your results with expected values for your age group.
          </p>

          <div class="age-input-group">
            <label for="age-input" class="sr-only">Your age in years</label>
            <input type="number" id="age-input" class="age-input" min="5" max="120" value="${userAge || ''}"
              placeholder="Age"
              aria-describedby="age-description"
              autocomplete="off"
            />
            <span class="age-unit" aria-hidden="true">years</span>
          </div>
        </div>
      </section>

      <section class="card" aria-labelledby="headphone-section-title">
        <div class="calibration">
          <h2 class="card__title justify-center" id="headphone-section-title"><span aria-hidden="true">🎧</span> Test Your Headphones</h2>
          <p id="headphone-description" class="text-center text-secondary">
            Click each button to play a test tone. Adjust your volume until comfortable.
          </p>

          <div class="calibration__ear-buttons" role="group" aria-label="Ear test buttons">
            <button class="btn btn--secondary btn--right-ear" id="test-right" aria-describedby="headphone-description">
              <span aria-hidden="true">◯</span> Right Ear
            </button>
            <button class="btn btn--secondary btn--left-ear" id="test-left" aria-describedby="headphone-description">
              <span aria-hidden="true">✕</span> Left Ear
            </button>
          </div>

          <p class="calibration__tip" role="note"><span aria-hidden="true">💡</span> Make sure both ears can hear the test tones!</p>
        </div>
      </section>

      <nav class="nav-buttons" aria-label="Test navigation">
        <button class="btn btn--secondary flex-1" id="back-home">
          <span aria-hidden="true">←</span> Back
        </button>
        <button class="btn btn--primary btn--large flex-2" id="begin-test">
          I'm ready - Begin Test <span aria-hidden="true">→</span>
        </button>
      </nav>
    </main>
  `;
  
  announce(`${modeConfig.label} setup. Enter your age and test your headphones before starting.`);
  
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

