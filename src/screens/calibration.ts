/**
 * Calibration screen - Age input and headphone testing before the test
 */

import { getAppContainer, onClick, onChange, announce, focusMain } from '../utils/dom';
import { playCalibrationTone, stopTone } from '../audio/tone-generator';
import {
  startNoiseMeter,
  NOISE_WARNING_THRESHOLD_DB,
  type NoiseMeterHandle,
} from '../audio/noise-meter';
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

      <section class="card" aria-labelledby="noise-section-title">
        <div class="calibration">
          <h2 class="card__title justify-center" id="noise-section-title"><span aria-hidden="true">🎙️</span> Environmental Noise</h2>
          <p id="noise-description" class="text-center text-secondary">
            Background noise can raise your thresholds. This quick check uses your microphone to estimate how quiet your room is.
          </p>

          <button class="btn btn--secondary" id="noise-check" aria-describedby="noise-description">
            <span aria-hidden="true">🎙️</span> Check Ambient Noise
          </button>

          <div id="noise-status" class="noise-meter" hidden>
            <div class="noise-meter__readout">
              <span class="noise-meter__value" id="noise-value">--</span>
              <span class="noise-meter__unit" aria-hidden="true">dB</span>
            </div>
            <p class="noise-meter__message" id="noise-message"></p>
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

  let noiseMeter: NoiseMeterHandle | null = null;
  const stopNoiseMeter = () => {
    noiseMeter?.stop();
    noiseMeter = null;
  };

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
  onClick('noise-check', async () => {
    const button = document.getElementById('noise-check') as HTMLButtonElement | null;
    const status = document.getElementById('noise-status');
    const value = document.getElementById('noise-value');
    const message = document.getElementById('noise-message');
    if (!button || !status || !value || !message) return;

    if (noiseMeter) {
      stopNoiseMeter();
      button.innerHTML = '<span aria-hidden="true">🎙️</span> Check Ambient Noise';
      status.hidden = true;
      announce('Noise check stopped');
      return;
    }

    button.disabled = true;
    button.innerHTML = '<span aria-hidden="true">⏳</span> Requesting microphone…';
    try {
      let lastNoisy: boolean | null = null;
      noiseMeter = await startNoiseMeter((sample) => {
        const dbStr = sample.db.toFixed(0);
        if (value.textContent !== dbStr) value.textContent = dbStr;

        const peakStr = sample.peakDb.toFixed(0);
        const noisy = sample.peakDb > NOISE_WARNING_THRESHOLD_DB;
        const newMessage = noisy
          ? `Peak ${peakStr} dB — louder than recommended. Try a quieter room for more reliable results.`
          : `Peak ${peakStr} dB — quiet enough for testing.`;

        if (message.textContent !== newMessage) {
          message.textContent = newMessage;
          status.classList.toggle('noise-meter--warning', noisy);
          if (lastNoisy === null || noisy !== lastNoisy) {
            lastNoisy = noisy;
            announce(newMessage);
          }
        }
      });
      status.hidden = false;
      button.innerHTML = '<span aria-hidden="true">⏹</span> Stop Noise Check';
      button.disabled = false;
      announce('Measuring ambient noise');
    } catch (error) {
      noiseMeter = null;
      status.hidden = false;
      status.classList.add('noise-meter--warning');
      value.textContent = '--';
      message.textContent = error instanceof Error
        ? error.message
        : 'Could not access microphone.';
      button.innerHTML = '<span aria-hidden="true">🎙️</span> Check Ambient Noise';
      button.disabled = false;
      announce('Could not access microphone');
    }
  });
  onClick('back-home', () => {
    stopTone();
    stopNoiseMeter();
    navigateTo('home');
  });
  onClick('begin-test', () => {
    stopTone();
    stopNoiseMeter();
    // Ensure age is captured from input
    const ageInput = document.getElementById('age-input') as HTMLInputElement;
    const val = parseInt(ageInput?.value || '');
    setUserAge((val >= 5 && val <= 120) ? val : undefined);
    startTest();
  });
  
  focusMain();
}

