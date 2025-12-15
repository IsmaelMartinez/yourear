/**
 * Calibration screen - Age input, noise check, reference calibration, headphone profile, and headphone testing
 */

import { getAppContainer, onClick, onChange, announce, focusMain } from '../utils/dom';
import { playCalibrationTone, stopTone } from '../audio/tone-generator';
import { checkAmbientNoise, getNoiseLevel, getNoiseLevelColor, MicrophoneAccessError, NoiseCheckResult } from '../audio/noise-detector';
import { 
  startCalibrationTone, 
  stopCalibrationTone, 
  updateCalibrationToneLevel,
  calculateCalibrationOffset,
  saveCalibrationOffset,
  loadCalibrationOffset,
  clearCalibrationOffset,
  getCalibrationInfo,
  DEFAULT_REFERENCE_LEVEL,
  MIN_REFERENCE_LEVEL,
  MAX_REFERENCE_LEVEL,
  LEVEL_STEP,
} from '../audio/reference-calibration';
import { renderHeadphoneSelector, bindHeadphoneSelector } from '../ui/headphone-selector';
import { getState, navigateTo, setUserAge } from '../state/app-state';
import { startTest } from '../services/test-runner';

/** Track noise check state */
let noiseCheckState: 'idle' | 'checking' | 'complete' | 'error' | 'skipped' = 'idle';
let noiseResult: NoiseCheckResult | null = null;
let noiseErrorMessage: string | null = null;

/** Track reference calibration state */
let refCalState: 'idle' | 'adjusting' | 'complete' = 'idle';
let currentRefLevel: number = DEFAULT_REFERENCE_LEVEL;
let refTonePlaying: boolean = false;

export function renderCalibration(): void {
  const app = getAppContainer();
  const { testMode, userAge } = getState();
  const modeConfig = getTestModeConfig(testMode);
  
  // Check for existing calibration
  const savedOffset = loadCalibrationOffset();
  if (refCalState === 'idle' && savedOffset !== null) {
    refCalState = 'complete';
  }
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="${modeConfig.title} Setup">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">${modeConfig.icon}</div>
        <h1 class="header__title">${modeConfig.title} Setup</h1>
        <p class="header__subtitle">${modeConfig.subtitle}</p>
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
      
      ${renderNoiseCheckSection()}
      ${renderReferenceCalibrationSection()}
      ${renderHeadphoneProfileSection()}
      
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
  
  announce(`${modeConfig.title} setup. Enter your age and test your headphones before starting.`);
  
  // Track age changes
  onChange('age-input', (value) => {
    const val = parseInt(value);
    setUserAge((val >= 5 && val <= 120) ? val : undefined);
  });
  
  // Event bindings
  onClick('test-right', () => {
    stopCalibrationTone();
    refTonePlaying = false;
    playCalibrationTone('right');
    announce('Playing test tone in right ear');
  });
  onClick('test-left', () => {
    stopCalibrationTone();
    refTonePlaying = false;
    playCalibrationTone('left');
    announce('Playing test tone in left ear');
  });
  onClick('back-home', () => { 
    stopTone(); 
    stopCalibrationTone();
    resetCalibrationState();
    navigateTo('home'); 
  });
  onClick('begin-test', () => { 
    stopTone();
    stopCalibrationTone();
    // Ensure age is captured from input
    const ageInput = document.getElementById('age-input') as HTMLInputElement;
    const val = parseInt(ageInput?.value || '');
    setUserAge((val >= 5 && val <= 120) ? val : undefined);
    startTest();
  });
  
  // Noise check button handlers
  onClick('check-noise', handleNoiseCheck);
  onClick('skip-noise-check', () => {
    noiseCheckState = 'skipped';
    renderCalibration();
  });
  onClick('recheck-noise', handleNoiseCheck);
  
  // Reference calibration handlers
  onClick('start-ref-cal', handleStartRefCalibration);
  onClick('skip-ref-cal', () => {
    refCalState = 'complete';
    renderCalibration();
  });
  onClick('ref-cal-play', handleToggleRefTone);
  onClick('ref-cal-quieter', handleRefQuieter);
  onClick('ref-cal-louder', handleRefLouder);
  onClick('ref-cal-done', handleRefCalDone);
  onClick('ref-cal-reset', handleRefCalReset);
  onClick('recalibrate', handleStartRefCalibration);
  
  // Slider for fine adjustment
  const slider = document.getElementById('ref-cal-slider') as HTMLInputElement;
  if (slider) {
    slider.addEventListener('input', () => {
      currentRefLevel = parseFloat(slider.value);
      if (refTonePlaying) {
        updateCalibrationToneLevel(currentRefLevel);
      }
      updateRefLevelDisplay();
    });
  }
  
  // Headphone profile selector
  bindHeadphoneSelector();
  
  focusMain();
}

/**
 * Reset all calibration state when leaving screen
 */
function resetCalibrationState(): void {
  noiseCheckState = 'idle';
  noiseResult = null;
  noiseErrorMessage = null;
  refCalState = 'idle';
  currentRefLevel = DEFAULT_REFERENCE_LEVEL;
  refTonePlaying = false;
}

/**
 * Get configuration for test mode display
 */
function getTestModeConfig(testMode: string): { title: string; subtitle: string; icon: string } {
  switch (testMode) {
    case 'quick':
      return { title: 'Quick Test', subtitle: '3 frequencies · ~2 minutes', icon: '⚡' };
    case 'detailed':
      return { title: 'Detailed Test', subtitle: '11 frequencies · ~15 minutes', icon: '🔬' };
    default:
      return { title: 'Full Test', subtitle: '6 frequencies · ~8 minutes', icon: '🔊' };
  }
}

// ============================================
// Noise Check Handlers
// ============================================

async function handleNoiseCheck(): Promise<void> {
  noiseCheckState = 'checking';
  noiseResult = null;
  noiseErrorMessage = null;
  renderCalibration();
  
  announce('Checking ambient noise level. Please stay quiet for 3 seconds.');
  
  try {
    noiseResult = await checkAmbientNoise();
    noiseCheckState = 'complete';
    announce(noiseResult.recommendation);
  } catch (error) {
    noiseCheckState = 'error';
    if (error instanceof MicrophoneAccessError) {
      noiseErrorMessage = error.message;
    } else {
      noiseErrorMessage = 'An error occurred while checking noise level.';
    }
    announce(noiseErrorMessage);
  }
  
  renderCalibration();
}

function renderNoiseCheckSection(): string {
  return `
    <section class="card" aria-labelledby="noise-section-title">
      <div class="calibration">
        <h2 class="card__title" id="noise-section-title" style="justify-content: center;"><span aria-hidden="true">🔇</span> Check Room Noise</h2>
        <p id="noise-description" class="text-center" style="color: var(--text-secondary);">
          For accurate results, test in a quiet environment. We can check your room's noise level.
        </p>
        ${renderNoiseCheckContent()}
      </div>
    </section>
  `;
}

function renderNoiseCheckContent(): string {
  switch (noiseCheckState) {
    case 'idle':
      return `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-md); margin-top: var(--spacing-lg); align-items: center;">
          <button class="btn btn--secondary" id="check-noise" style="width: 100%; max-width: 300px;">
            <span aria-hidden="true">🎤</span> Check Noise Level
          </button>
          <button class="btn" id="skip-noise-check" style="background: transparent; color: var(--text-muted); font-size: 0.9rem;">
            Skip this check
          </button>
        </div>
        <p class="calibration__tip" role="note" style="margin-top: var(--spacing-md);">
          <span aria-hidden="true">ℹ️</span> Requires microphone permission (optional)
        </p>
      `;
    
    case 'checking':
      return `
        <div style="text-align: center; padding: var(--spacing-xl) 0;">
          <div class="sound-wave" aria-hidden="true">
            <div class="sound-wave__bar"></div>
            <div class="sound-wave__bar"></div>
            <div class="sound-wave__bar"></div>
            <div class="sound-wave__bar"></div>
            <div class="sound-wave__bar"></div>
          </div>
          <p style="color: var(--text-primary); font-size: 1.1rem; margin-top: var(--spacing-md);">
            Listening to room noise...
          </p>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Please stay quiet for a moment
          </p>
        </div>
      `;
    
    case 'complete':
      if (!noiseResult) return '';
      const level = getNoiseLevel(noiseResult.averageDb);
      const color = getNoiseLevelColor(level);
      const icon = getNoiseIcon(level);
      
      return `
        <div style="text-align: center; padding: var(--spacing-lg) 0;">
          ${renderNoiseMeter(level, color)}
          <div style="margin-top: var(--spacing-lg);">
            <p style="font-size: 1.5rem; margin-bottom: var(--spacing-sm);">
              <span aria-hidden="true">${icon}</span>
            </p>
            <p style="color: ${color}; font-weight: 500; font-size: 1.1rem;">
              ${getNoiseLabel(level)}
            </p>
            <p style="color: var(--text-secondary); margin-top: var(--spacing-sm); max-width: 400px; margin-left: auto; margin-right: auto;">
              ${noiseResult.recommendation}
            </p>
          </div>
          <button class="btn btn--secondary" id="recheck-noise" style="margin-top: var(--spacing-lg);">
            <span aria-hidden="true">🔄</span> Check Again
          </button>
        </div>
      `;
    
    case 'error':
      return `
        <div style="text-align: center; padding: var(--spacing-lg) 0;">
          <p style="font-size: 2rem; margin-bottom: var(--spacing-md);" aria-hidden="true">🎤</p>
          <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto var(--spacing-lg);">
            ${noiseErrorMessage}
          </p>
          <div style="display: flex; gap: var(--spacing-md); justify-content: center;">
            <button class="btn btn--secondary" id="recheck-noise">
              <span aria-hidden="true">🔄</span> Try Again
            </button>
          </div>
        </div>
      `;
    
    case 'skipped':
      return `
        <div style="text-align: center; padding: var(--spacing-md) 0;">
          <p style="color: var(--text-muted);">
            <span aria-hidden="true">⏭️</span> Noise check skipped
          </p>
          <button class="btn" id="check-noise" style="background: transparent; color: var(--accent-primary); font-size: 0.9rem; margin-top: var(--spacing-sm);">
            Check anyway
          </button>
        </div>
      `;
    
    default:
      return '';
  }
}

function renderNoiseMeter(level: 0 | 1 | 2 | 3 | 4, activeColor: string): string {
  const bars = [0, 1, 2, 3, 4].map(i => {
    const isActive = i <= level;
    const barColor = isActive ? activeColor : 'var(--bg-tertiary)';
    const height = 20 + (i * 10);
    return `<div style="
      width: 20px;
      height: ${height}px;
      background: ${barColor};
      border-radius: var(--radius-sm);
      transition: background var(--transition-base);
    "></div>`;
  }).join('');
  
  return `
    <div style="display: flex; align-items: flex-end; justify-content: center; gap: var(--spacing-sm); height: 70px;" 
         role="img" aria-label="Noise level indicator showing ${getNoiseLabel(level)}">
      ${bars}
    </div>
  `;
}

function getNoiseIcon(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 0: return '🤫';
    case 1: return '✅';
    case 2: return '⚠️';
    case 3: return '🔊';
    case 4: return '📢';
  }
}

function getNoiseLabel(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 0: return 'Very Quiet';
    case 1: return 'Quiet';
    case 2: return 'Moderate Noise';
    case 3: return 'Loud';
    case 4: return 'Very Loud';
  }
}

// ============================================
// Reference Calibration Handlers
// ============================================

async function handleStartRefCalibration(): Promise<void> {
  refCalState = 'adjusting';
  currentRefLevel = DEFAULT_REFERENCE_LEVEL;
  refTonePlaying = false;
  stopTone(); // Stop any ear test tones
  renderCalibration();
  announce('Reference calibration started. Play the tone and adjust until it sounds like normal conversation volume.');
}

async function handleToggleRefTone(): Promise<void> {
  if (refTonePlaying) {
    stopCalibrationTone();
    refTonePlaying = false;
  } else {
    await startCalibrationTone(currentRefLevel);
    refTonePlaying = true;
  }
  updateRefPlayButton();
}

function handleRefQuieter(): void {
  currentRefLevel = Math.max(MIN_REFERENCE_LEVEL, currentRefLevel - LEVEL_STEP);
  if (refTonePlaying) {
    updateCalibrationToneLevel(currentRefLevel);
  }
  updateRefLevelDisplay();
  updateRefSlider();
}

function handleRefLouder(): void {
  currentRefLevel = Math.min(MAX_REFERENCE_LEVEL, currentRefLevel + LEVEL_STEP);
  if (refTonePlaying) {
    updateCalibrationToneLevel(currentRefLevel);
  }
  updateRefLevelDisplay();
  updateRefSlider();
}

function handleRefCalDone(): void {
  stopCalibrationTone();
  refTonePlaying = false;
  
  const offset = calculateCalibrationOffset(currentRefLevel);
  saveCalibrationOffset(offset);
  
  refCalState = 'complete';
  renderCalibration();
  
  const info = getCalibrationInfo();
  announce(`Calibration saved. ${info.message}`);
}

function handleRefCalReset(): void {
  clearCalibrationOffset();
  refCalState = 'idle';
  currentRefLevel = DEFAULT_REFERENCE_LEVEL;
  refTonePlaying = false;
  renderCalibration();
  announce('Calibration cleared.');
}

function updateRefLevelDisplay(): void {
  const display = document.getElementById('ref-level-display');
  if (display) {
    const relativeDb = currentRefLevel - DEFAULT_REFERENCE_LEVEL;
    const sign = relativeDb >= 0 ? '+' : '';
    display.textContent = `${sign}${relativeDb} dB`;
  }
}

function updateRefPlayButton(): void {
  const btn = document.getElementById('ref-cal-play');
  if (btn) {
    btn.innerHTML = refTonePlaying 
      ? '<span aria-hidden="true">⏸️</span> Pause'
      : '<span aria-hidden="true">▶️</span> Play Tone';
  }
}

function updateRefSlider(): void {
  const slider = document.getElementById('ref-cal-slider') as HTMLInputElement;
  if (slider) {
    slider.value = String(currentRefLevel);
  }
}

function renderReferenceCalibrationSection(): string {
  return `
    <section class="card" aria-labelledby="ref-cal-section-title">
      <div class="calibration">
        <h2 class="card__title" id="ref-cal-section-title" style="justify-content: center;">
          <span aria-hidden="true">🎚️</span> Volume Calibration
        </h2>
        <p id="ref-cal-description" class="text-center" style="color: var(--text-secondary);">
          Improve accuracy by calibrating to your device's volume level.
        </p>
        ${renderRefCalContent()}
      </div>
    </section>
  `;
}

function renderRefCalContent(): string {
  switch (refCalState) {
    case 'idle':
      return `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-md); margin-top: var(--spacing-lg); align-items: center;">
          <button class="btn btn--secondary" id="start-ref-cal" style="width: 100%; max-width: 300px;">
            <span aria-hidden="true">🎚️</span> Calibrate Volume
          </button>
          <button class="btn" id="skip-ref-cal" style="background: transparent; color: var(--text-muted); font-size: 0.9rem;">
            Skip calibration
          </button>
        </div>
        <p class="calibration__tip" role="note" style="margin-top: var(--spacing-md);">
          <span aria-hidden="true">ℹ️</span> Takes about 30 seconds (optional but recommended)
        </p>
      `;
    
    case 'adjusting':
      const relativeDb = currentRefLevel - DEFAULT_REFERENCE_LEVEL;
      const sign = relativeDb >= 0 ? '+' : '';
      
      return `
        <div style="padding: var(--spacing-lg) 0;">
          <div style="background: var(--bg-tertiary); border-radius: var(--radius-md); padding: var(--spacing-lg); margin-bottom: var(--spacing-lg);">
            <p style="color: var(--text-primary); text-align: center; margin-bottom: var(--spacing-md);">
              <strong>Instructions:</strong> Play the 1000 Hz tone and adjust until it sounds like 
              <em>normal conversation volume</em> (as if someone is speaking at arm's length).
            </p>
          </div>
          
          <div style="display: flex; justify-content: center; margin-bottom: var(--spacing-lg);">
            <button class="btn btn--primary" id="ref-cal-play" style="min-width: 150px;">
              <span aria-hidden="true">${refTonePlaying ? '⏸️' : '▶️'}</span> ${refTonePlaying ? 'Pause' : 'Play Tone'}
            </button>
          </div>
          
          <div style="max-width: 400px; margin: 0 auto;">
            <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
              <button class="btn btn--secondary" id="ref-cal-quieter" style="padding: var(--spacing-md); font-size: 1.5rem; line-height: 1;" aria-label="Make quieter">
                −
              </button>
              <div style="flex: 1;">
                <input type="range" 
                  id="ref-cal-slider" 
                  min="${MIN_REFERENCE_LEVEL}" 
                  max="${MAX_REFERENCE_LEVEL}" 
                  step="${LEVEL_STEP}" 
                  value="${currentRefLevel}"
                  class="tinnitus-slider"
                  aria-label="Volume adjustment"
                />
              </div>
              <button class="btn btn--secondary" id="ref-cal-louder" style="padding: var(--spacing-md); font-size: 1.5rem; line-height: 1;" aria-label="Make louder">
                +
              </button>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
              <span>Quieter</span>
              <span id="ref-level-display" style="font-family: var(--font-mono); color: var(--accent-primary);">${sign}${relativeDb} dB</span>
              <span>Louder</span>
            </div>
          </div>
          
          <div style="display: flex; gap: var(--spacing-md); justify-content: center; margin-top: var(--spacing-xl);">
            <button class="btn btn--secondary" id="ref-cal-reset">
              <span aria-hidden="true">↺</span> Reset
            </button>
            <button class="btn btn--primary" id="ref-cal-done">
              <span aria-hidden="true">✓</span> Done
            </button>
          </div>
        </div>
      `;
    
    case 'complete':
      const info = getCalibrationInfo();
      const statusIcon = info.isCalibrated ? '✅' : '⏭️';
      const statusColor = info.isCalibrated ? 'var(--accent-success)' : 'var(--text-muted)';
      
      return `
        <div style="text-align: center; padding: var(--spacing-lg) 0;">
          <p style="font-size: 1.5rem; margin-bottom: var(--spacing-sm);" aria-hidden="true">${statusIcon}</p>
          <p style="color: ${statusColor}; font-weight: 500;">
            ${info.isCalibrated ? 'Calibrated' : 'Skipped'}
          </p>
          <p style="color: var(--text-secondary); margin-top: var(--spacing-sm); font-size: 0.9rem;">
            ${info.message}
          </p>
          <button class="btn" id="recalibrate" style="background: transparent; color: var(--accent-primary); font-size: 0.9rem; margin-top: var(--spacing-md);">
            ${info.isCalibrated ? 'Recalibrate' : 'Calibrate now'}
          </button>
        </div>
      `;
    
    default:
      return '';
  }
}

// ============================================
// Headphone Profile Section
// ============================================

function renderHeadphoneProfileSection(): string {
  return `
    <section class="card" aria-labelledby="headphone-profile-section-title">
      <div class="calibration">
        <h2 class="card__title" id="headphone-profile-section-title" style="justify-content: center;">
          <span aria-hidden="true">🎧</span> Headphone Profile
        </h2>
        <p id="headphone-profile-description" class="text-center" style="color: var(--text-secondary);">
          Select your headphone model for improved accuracy. We'll compensate for known frequency response differences.
        </p>
        <div style="margin-top: var(--spacing-lg);">
          ${renderHeadphoneSelector()}
        </div>
        <p class="calibration__tip" role="note" style="margin-top: var(--spacing-md);">
          <span aria-hidden="true">ℹ️</span> Don't see your headphones? Choose "Flat Response" or leave unselected.
        </p>
      </div>
    </section>
  `;
}
