/**
 * Test screen - Active hearing test with tone playback and responses
 */

import { getAppContainer, onClick, announce } from '../utils/dom';
import { getState, navigateTo } from '../state/app-state';
import { TestState, formatFrequency } from '../types';
import { stopTest } from '../services/test-runner';

const MODE_ICONS = { quick: '⚡', full: '🎵', detailed: '🔬' } as const;
const MODE_LABELS = { quick: 'Quick', full: 'Full', detailed: 'Detailed' } as const;

// Keys a focused control handles natively (activation), which the shortcuts must not steal
const CONTROL_SELECTOR = 'button, input, select, textarea, a[href], [role="button"]';

// Global keydown handler reference
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
// Last rendered state, so each meaningful change is announced once
let lastRendered: Pick<TestState, 'isPlaying' | 'currentFrequency' | 'currentEar'> | null = null;
// Response confirmation to prefix onto the next announcement
let pendingConfirmation = '';

/**
 * Clean up keydown handler when leaving test screen
 */
export function cleanupTestScreen(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  lastRendered = null;
  pendingConfirmation = '';
}

export function renderTest(): void {
  const app = getAppContainer();
  const state = getState().hearingTest?.getState();

  if (!state) {
    // No active test - return to home
    navigateTo('home');
    return;
  }

  // Render the shell once; later state changes update it in place so focus survives
  if (!keydownHandler || !app.querySelector('[data-screen="test"]')) {
    cleanupTestScreen();
    renderShell(app);
  }
  updateTestDisplay(state);
}

function renderShell(app: HTMLElement): void {
  const { testMode } = getState();

  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Hearing Test in Progress" data-screen="test">
      <header class="header" role="banner" style="margin-bottom: var(--spacing-lg);">
        <h1 class="header__title" style="font-size: 1.5rem;"><span aria-hidden="true">${MODE_ICONS[testMode]}</span> ${MODE_LABELS[testMode]} Test</h1>
      </header>

      <section class="card card--glow" aria-labelledby="test-status-title">
        <h2 id="test-status-title" class="sr-only">Test Progress</h2>
        <div class="progress" id="test-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Test progress">
          <div class="progress__bar" id="test-progress-bar"></div>
        </div>
        <div class="progress__text" id="test-progress-text"></div>

        <div class="test-display" role="region" aria-label="Current test">
          <div class="test-display__info">
            <div class="test-display__frequency" id="test-frequency"></div>
            <div class="test-display__ear" id="test-ear"></div>
          </div>

          <div class="listening-state" id="listening-state" hidden>
            <div class="listening-state__icon" aria-hidden="true">🎧</div>
            <div class="sound-wave" aria-hidden="true">
              <div class="sound-wave__bar"></div>
              <div class="sound-wave__bar"></div>
              <div class="sound-wave__bar"></div>
              <div class="sound-wave__bar"></div>
              <div class="sound-wave__bar"></div>
            </div>
            <p class="listening-state__text">Listen carefully...</p>
            <p class="listening-state__hint">A tone may be playing now</p>
          </div>

          <div class="response-state">
            <p class="response-state__question" id="response-question">Did you hear a tone?</p>
            <div class="response-buttons" role="group" aria-labelledby="response-question">
              <button class="btn btn--heard" id="heard" aria-label="Yes, I heard the tone">
                <span aria-hidden="true">✓</span> Yes, I heard it
              </button>
              <button class="btn btn--not-heard" id="not-heard" aria-label="No, I did not hear the tone">
                <span aria-hidden="true">✗</span> No, I didn't
              </button>
            </div>
            <p class="response-state__hint">
              Press <kbd>Space</kbd> for yes, <kbd>N</kbd> for no
            </p>
          </div>
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
  onClick('heard', respondHeard);
  onClick('not-heard', respondNotHeard);
  onClick('stop-test', () => {
    stopTest();
    announce('Test stopped');
  });

  // Keyboard shortcuts
  keydownHandler = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const onControl = e.target instanceof Element && e.target.closest(CONTROL_SELECTOR) !== null;
    if (e.code === 'Space' || e.code === 'Enter') {
      // Let a focused button or link perform its own action
      if (onControl) return;
      e.preventDefault();
      respondHeard();
    }
    else if (e.code === 'KeyN' || e.code === 'Escape') {
      e.preventDefault();
      respondNotHeard();
    }
  };
  document.addEventListener('keydown', keydownHandler);

  // Start keyboard users on the "Yes" button unless they have already moved focus
  setTimeout(() => {
    if (document.activeElement === document.body || document.activeElement === null) {
      document.getElementById('heard')?.focus();
    }
  }, 100);
}

function awaitingResponse(): boolean {
  const state = getState().hearingTest?.getState();
  return state !== undefined && !state.isPlaying;
}

function respondHeard(): void {
  if (!awaitingResponse()) return;
  pendingConfirmation = 'Response recorded: heard. ';
  getState().hearingTest?.respondHeard();
}

function respondNotHeard(): void {
  if (!awaitingResponse()) return;
  pendingConfirmation = 'Response recorded: not heard. ';
  getState().hearingTest?.respondNotHeard();
}

function updateTestDisplay(state: TestState): void {
  const progress = Math.round(getState().hearingTest?.getProgress() ?? 0);
  document.getElementById('test-progress')?.setAttribute('aria-valuenow', String(progress));
  const bar = document.getElementById('test-progress-bar');
  if (bar) bar.style.width = `${progress}%`;
  setText('test-progress-text', `${progress}% complete`);

  // Format: "4" + "kHz" or "250" + "Hz" for display, "4 kilohertz" for screen readers
  const freqLabel = state.currentFrequency >= 1000
    ? String(state.currentFrequency / 1000)
    : String(state.currentFrequency);
  const freqUnit = state.currentFrequency >= 1000 ? 'kHz' : 'Hz';
  const freqSpoken = formatFrequency(state.currentFrequency, 'spoken');
  const earLabel = state.currentEar === 'right' ? 'Right' : 'Left';

  const frequency = document.getElementById('test-frequency');
  if (frequency) {
    frequency.setAttribute('aria-label', `Testing frequency: ${freqSpoken}`);
    frequency.innerHTML = `${freqLabel}<span class="test-display__frequency-unit" aria-hidden="true">${freqUnit}</span>`;
  }
  const ear = document.getElementById('test-ear');
  if (ear) {
    ear.className = `test-display__ear test-display__ear--${state.currentEar}`;
    ear.innerHTML = `<span aria-hidden="true">${state.currentEar === 'right' ? '◯' : '✕'}</span> ${earLabel} Ear`;
  }

  const listening = document.getElementById('listening-state');
  if (listening) listening.hidden = !state.isPlaying;
  const question = document.getElementById('response-question');
  if (question) question.hidden = state.isPlaying;
  // aria-disabled (not disabled) keeps a focused button focused while the tone plays
  for (const id of ['heard', 'not-heard']) {
    document.getElementById(id)?.setAttribute('aria-disabled', String(state.isPlaying));
  }

  announceChange(state, freqSpoken, earLabel);
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function announceChange(state: TestState, freqSpoken: string, earLabel: string): void {
  const previous = lastRendered;
  lastRendered = { isPlaying: state.isPlaying, currentFrequency: state.currentFrequency, currentEar: state.currentEar };
  if (previous && previous.isPlaying === state.isPlaying
    && previous.currentFrequency === state.currentFrequency && previous.currentEar === state.currentEar) {
    return;
  }

  const moved = !previous || previous.currentFrequency !== state.currentFrequency || previous.currentEar !== state.currentEar;
  const where = moved ? `Now testing ${freqSpoken}, ${earLabel.toLowerCase()} ear. ` : '';
  const phase = state.isPlaying
    ? 'Listen carefully, a tone may be playing.'
    : 'Did you hear a tone? Press Space for yes, N for no.';
  announce(`${pendingConfirmation}${where}${phase}`, 'assertive');
  pendingConfirmation = '';
}
