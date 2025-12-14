/**
 * Tinnitus Frequency Matcher screen
 * 
 * Allows users to match the frequency and loudness of their tinnitus
 * using adjustable sliders and a continuous tone.
 */

import { getAppContainer, onClick, announce, focusMain } from '../utils/dom';
import { navigateTo } from '../state/app-state';
import { formatFrequency } from '../types';
import {
  startTinnitusTone,
  stopTinnitusTone,
  setTinnitusFrequency,
  setTinnitusVolume,
  getTinnitusSettings,
  resetTinnitusSettings,
  TinnitusSettings,
} from '../audio/tinnitus-tone';

// Fine-tuning mode for precise matching
let fineMode = false;

export function renderTinnitus(): void {
  const app = getAppContainer();
  const settings = getTinnitusSettings();
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Tinnitus Frequency Matcher">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">🔔</div>
        <h1 class="header__title">Tinnitus Matcher</h1>
        <p class="header__subtitle">Find the frequency and loudness of your tinnitus</p>
      </header>
      
      <section class="card card--glow">
        <h2 class="card__title"><span aria-hidden="true">🎵</span> Match Your Tinnitus</h2>
        
        <div class="tinnitus-controls">
          <div class="tinnitus-slider-group">
            <label for="freq-slider" class="tinnitus-label">
              <span>Frequency</span>
              <span id="freq-value" class="tinnitus-value">${formatFrequency(settings.frequency, 'full')} Hz</span>
            </label>
            <input type="range" 
                   id="freq-slider" 
                   class="tinnitus-slider"
                   min="100" 
                   max="12000" 
                   value="${settings.frequency}"
                   step="${fineMode ? 10 : 100}"
                   aria-label="Frequency adjustment">
            <div class="tinnitus-range-labels">
              <span>100 Hz</span>
              <span>12 kHz</span>
            </div>
          </div>
          
          <div class="tinnitus-slider-group">
            <label for="vol-slider" class="tinnitus-label">
              <span>Loudness</span>
              <span id="vol-value" class="tinnitus-value">${settings.volume} dB</span>
            </label>
            <input type="range" 
                   id="vol-slider" 
                   class="tinnitus-slider"
                   min="0" 
                   max="60" 
                   value="${settings.volume}"
                   step="${fineMode ? 1 : 5}"
                   aria-label="Loudness adjustment">
            <div class="tinnitus-range-labels">
              <span>Quiet</span>
              <span>Loud</span>
            </div>
          </div>
          
          <div class="tinnitus-mode-toggle">
            <label class="toggle-label">
              <input type="checkbox" id="fine-mode" ${fineMode ? 'checked' : ''}>
              <span>Fine-tuning mode</span>
            </label>
            <span class="text-muted-sm">Smaller steps for precise matching</span>
          </div>
        </div>
        
        <div class="tinnitus-play-controls">
          <button class="btn ${settings.isPlaying ? 'btn--heard' : 'btn--primary'} btn--large" id="toggle-tone" style="min-width: 200px;">
            <span aria-hidden="true">${settings.isPlaying ? '⏹️' : '▶️'}</span>
            ${settings.isPlaying ? 'Stop Tone' : 'Play Tone'}
          </button>
        </div>
        
        <p class="text-muted-sm text-center" style="margin-top: var(--spacing-lg);">
          Adjust the sliders while the tone plays until it matches your tinnitus.<br>
          Use headphones for best results.
        </p>
      </section>
      
      ${renderResultsSection(settings)}
      
      <section class="card">
        <h2 class="card__title"><span aria-hidden="true">ℹ️</span> About Tinnitus Matching</h2>
        <div class="text-secondary-lg">
          <p><strong>What is this for?</strong> Identifying your tinnitus frequency can help with:</p>
          <ul style="margin: var(--spacing-md) 0; padding-left: var(--spacing-xl);">
            <li>Communicating with your doctor</li>
            <li>Finding effective masking sounds</li>
            <li>Tracking changes over time</li>
          </ul>
          <p class="mt-md"><strong>Tips:</strong></p>
          <ul style="margin: var(--spacing-md) 0; padding-left: var(--spacing-xl);">
            <li>Start with frequency - find the pitch first</li>
            <li>Then adjust loudness until volumes match</li>
            <li>Use fine-tuning mode for precision</li>
            <li>Your tinnitus may have multiple frequencies</li>
          </ul>
        </div>
        <div class="disclaimer" role="alert">
          <span aria-hidden="true">⚠️</span> This tool is for self-awareness only. 
          If you're experiencing tinnitus, please consult an audiologist or ENT specialist.
        </div>
      </section>
      
      <nav class="nav-buttons" aria-label="Navigation">
        <button class="btn btn--secondary" id="back-home">
          <span aria-hidden="true">←</span> Home
        </button>
        <button class="btn btn--secondary" id="reset-settings">
          <span aria-hidden="true">🔄</span> Reset
        </button>
      </nav>
    </main>
  `;
  
  announce('Tinnitus Frequency Matcher. Adjust sliders to match your tinnitus.');
  
  // Event bindings
  bindSliderEvents();
  bindButtonEvents();
  
  focusMain();
}

function renderResultsSection(settings: TinnitusSettings): string {
  return `
    <section class="card">
      <h2 class="card__title"><span aria-hidden="true">📊</span> Your Match</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); text-align: center;">
        <div>
          <div style="font-size: 2rem; font-family: var(--font-mono); color: var(--accent-primary);">
            ${formatFrequency(settings.frequency, 'short')}
          </div>
          <div style="color: var(--text-muted); font-size: 0.9rem;">Frequency</div>
        </div>
        <div>
          <div style="font-size: 2rem; font-family: var(--font-mono); color: var(--accent-left);">
            ${settings.volume} dB
          </div>
          <div style="color: var(--text-muted); font-size: 0.9rem;">Loudness</div>
        </div>
      </div>
      <p class="text-muted-sm text-center" style="margin-top: var(--spacing-md);">
        ${describeFrequency(settings.frequency)}
      </p>
    </section>
  `;
}

function describeFrequency(hz: number): string {
  if (hz < 500) return 'Low-pitched tinnitus (rumbling, humming)';
  if (hz < 2000) return 'Mid-range tinnitus (buzzing, moderate ringing)';
  if (hz < 6000) return 'High-pitched tinnitus (ringing, whistling)';
  return 'Very high-pitched tinnitus (hissing, electrical)';
}

function bindSliderEvents(): void {
  const freqSlider = document.getElementById('freq-slider') as HTMLInputElement;
  const volSlider = document.getElementById('vol-slider') as HTMLInputElement;
  const freqValue = document.getElementById('freq-value');
  const volValue = document.getElementById('vol-value');
  const fineModeCheckbox = document.getElementById('fine-mode') as HTMLInputElement;
  
  if (freqSlider) {
    freqSlider.addEventListener('input', () => {
      const hz = parseInt(freqSlider.value, 10);
      setTinnitusFrequency(hz);
      if (freqValue) {
        freqValue.textContent = `${formatFrequency(hz, 'full')} Hz`;
      }
      updateResultsDisplay();
    });
  }
  
  if (volSlider) {
    volSlider.addEventListener('input', () => {
      const db = parseInt(volSlider.value, 10);
      setTinnitusVolume(db);
      if (volValue) {
        volValue.textContent = `${db} dB`;
      }
      updateResultsDisplay();
    });
  }
  
  if (fineModeCheckbox) {
    fineModeCheckbox.addEventListener('change', () => {
      fineMode = fineModeCheckbox.checked;
      // Update slider steps
      if (freqSlider) freqSlider.step = fineMode ? '10' : '100';
      if (volSlider) volSlider.step = fineMode ? '1' : '5';
    });
  }
}

function bindButtonEvents(): void {
  onClick('toggle-tone', () => {
    const settings = getTinnitusSettings();
    if (settings.isPlaying) {
      stopTinnitusTone();
    } else {
      startTinnitusTone();
    }
    // Re-render to update button state
    renderTinnitus();
  });
  
  onClick('back-home', () => {
    stopTinnitusTone();
    navigateTo('home');
  });
  
  onClick('reset-settings', () => {
    resetTinnitusSettings();
    fineMode = false;
    renderTinnitus();
    announce('Settings reset to defaults.');
  });
}

function updateResultsDisplay(): void {
  const settings = getTinnitusSettings();
  const resultsSection = document.querySelector('.card:nth-of-type(2)');
  if (resultsSection) {
    // Update just the values without full re-render
    const freqDisplay = resultsSection.querySelector('div[style*="font-size: 2rem"]:first-of-type');
    const volDisplay = resultsSection.querySelector('div[style*="font-size: 2rem"]:last-of-type');
    const descDisplay = resultsSection.querySelector('.text-muted-sm');
    
    if (freqDisplay) freqDisplay.textContent = formatFrequency(settings.frequency, 'short');
    if (volDisplay) volDisplay.textContent = `${settings.volume} dB`;
    if (descDisplay) descDisplay.textContent = describeFrequency(settings.frequency);
  }
}

/**
 * Cleanup when leaving the screen
 */
export function cleanupTinnitusScreen(): void {
  stopTinnitusTone();
}

