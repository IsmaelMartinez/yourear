/**
 * Test screen - Active hearing test with tone playback and responses
 */

import { getAppContainer, onClick, announce } from '../utils/dom';
import { getState, navigateTo } from '../state/app-state';
import { formatFrequency } from '../types';

// Global keydown handler reference
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

/**
 * Clean up keydown handler when leaving test screen
 */
export function cleanupTestScreen(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
}

export function renderTest(): void {
  const app = getAppContainer();
  const { hearingTest, testMode } = getState();
  
  // Clean up previous handler
  cleanupTestScreen();
  
  const state = hearingTest?.getState();
  const progress = hearingTest?.getProgress() ?? 0;
  
  if (!state) {
    // No active test - return to home
    navigateTo('home');
    return;
  }
  
  // Format: "4" + "kHz" or "250" + "Hz" for display, "4 kilohertz" for screen readers
  const freqLabel = state.currentFrequency >= 1000 
    ? String(state.currentFrequency / 1000) 
    : String(state.currentFrequency);
  const freqUnit = state.currentFrequency >= 1000 ? 'kHz' : 'Hz';
  const freqSpoken = formatFrequency(state.currentFrequency, 'spoken');
  
  const isQuick = testMode === 'quick';
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Hearing Test in Progress">
      <header class="header" role="banner" style="margin-bottom: var(--spacing-lg);">
        <h1 class="header__title" style="font-size: 1.5rem;"><span aria-hidden="true">${isQuick ? '⚡' : '🎵'}</span> ${isQuick ? 'Quick' : 'Full'} Test</h1>
      </header>
      
      <section class="card card--glow" aria-labelledby="test-status-title">
        <h2 id="test-status-title" class="sr-only">Test Progress</h2>
        <div class="progress" role="progressbar" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100" aria-label="Test progress">
          <div class="progress__bar" style="width: ${progress}%"></div>
        </div>
        <div class="progress__text" aria-live="polite">${Math.round(progress)}% complete</div>
        
        <div class="test-display" role="region" aria-label="Current test">
          <div class="test-display__info">
            <div class="test-display__frequency" aria-label="Testing frequency: ${freqSpoken}">${freqLabel}<span class="test-display__frequency-unit" aria-hidden="true">${freqUnit}</span></div>
            <div class="test-display__ear test-display__ear--${state.currentEar}" aria-label="Testing ${state.currentEar} ear">
              <span aria-hidden="true">${state.currentEar === 'right' ? '◯' : '✕'}</span> ${state.currentEar === 'right' ? 'Right' : 'Left'} Ear
            </div>
          </div>
          
          ${state.isPlaying ? renderListeningState() : renderResponseState()}
        </div>
        
        <button class="btn btn--secondary" id="stop-test" style="margin-top: var(--spacing-xl); width: 100%;" aria-label="Stop the hearing test and return to home">Stop Test</button>
      </section>
      
      <section class="card" aria-labelledby="tips-title">
        <h3 class="card__title" id="tips-title"><span aria-hidden="true">💡</span> Tips</h3>
        <ul class="instructions__list" role="list">
          <li>The tone will play, then you'll be asked if you heard it</li>
          <li>Even if very faint, click "Yes" if you heard anything</li>
          <li>If unsure or didn't hear, click "No" - the test will try again louder</li>
        </ul>
      </section>
    </main>
  `;
  
  // Event bindings
  onClick('heard', () => {
    hearingTest?.respondHeard();
    announce('Response recorded: heard');
  });
  onClick('not-heard', () => {
    hearingTest?.respondNotHeard();
    announce('Response recorded: not heard');
  });
  onClick('stop-test', () => { 
    hearingTest?.stop(); 
    announce('Test stopped'); 
    navigateTo('home'); 
  });
  
  // Keyboard shortcuts
  keydownHandler = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') { 
      e.preventDefault(); 
      hearingTest?.respondHeard();
      announce('Response recorded: heard');
    }
    else if (e.code === 'KeyN' || e.code === 'Escape') { 
      e.preventDefault(); 
      hearingTest?.respondNotHeard();
      announce('Response recorded: not heard');
    }
  };
  document.addEventListener('keydown', keydownHandler);
  
  // Announce state and focus appropriately
  if (state.isPlaying) {
    announce('Listening phase. A tone may be playing. Listen carefully.', 'assertive');
  } else {
    announce('Did you hear a tone? Press Space for yes, N for no.', 'assertive');
    // Focus on the "Yes" button for keyboard users
    setTimeout(() => document.getElementById('heard')?.focus(), 100);
  }
}

function renderListeningState(): string {
  return `
    <div class="listening-state" role="status" aria-live="polite" aria-label="Listening phase - a tone may be playing">
      <div class="listening-state__icon" aria-hidden="true">🎧</div>
      <div class="sound-wave" aria-hidden="true" role="presentation">
        <div class="sound-wave__bar"></div>
        <div class="sound-wave__bar"></div>
        <div class="sound-wave__bar"></div>
        <div class="sound-wave__bar"></div>
        <div class="sound-wave__bar"></div>
      </div>
      <p class="listening-state__text">Listen carefully...</p>
      <p class="listening-state__hint">A tone may be playing now</p>
    </div>
  `;
}

function renderResponseState(): string {
  return `
    <div class="response-state" role="region" aria-label="Response required">
      <p class="response-state__question" id="response-question">Did you hear a tone?</p>
      <div class="response-buttons" role="group" aria-labelledby="response-question">
        <button class="btn btn--heard" id="heard" aria-label="Yes, I heard the tone">
          <span aria-hidden="true">✓</span> Yes, I heard it
        </button>
        <button class="btn btn--not-heard" id="not-heard" aria-label="No, I did not hear the tone">
          <span aria-hidden="true">✗</span> No, I didn't
        </button>
      </div>
      <p class="response-state__hint" aria-label="Keyboard shortcuts: Press Space or Enter for yes, N or Escape for no">
        Press <kbd aria-label="Space key">Space</kbd> for yes, <kbd aria-label="N key">N</kbd> for no
      </p>
    </div>
  `;
}

