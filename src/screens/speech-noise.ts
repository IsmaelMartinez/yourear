/**
 * Speech-in-Noise Test Screen
 * 
 * Tests ability to understand speech with background noise at various SNR levels.
 */

import { getAppContainer, onClick, announce, focusMain } from '../utils/dom';
import { navigateTo } from '../state/app-state';
import {
  startNoise,
  stopNoise,
  speakWord,
  getRandomWord,
  WORD_LISTS,
  SNR_LEVELS,
  SNRLevel,
  calculateSNR50,
  interpretSNR50,
  WordListType,
} from '../audio/speech-noise';

interface TestState {
  phase: 'intro' | 'testing' | 'results';
  currentSNR: SNRLevel;
  currentWord: string;
  usedWords: string[];
  wordListType: WordListType;
  trialsPerSNR: number;
  currentTrial: number;
  results: Map<SNRLevel, { correct: number; total: number }>;
  waitingForResponse: boolean;
}

let state: TestState = createInitialState();

function createInitialState(): TestState {
  return {
    phase: 'intro',
    currentSNR: 10,
    currentWord: '',
    usedWords: [],
    wordListType: 'numbers',
    trialsPerSNR: 4,
    currentTrial: 0,
    results: new Map(SNR_LEVELS.map(snr => [snr, { correct: 0, total: 0 }])),
    waitingForResponse: false,
  };
}

export function renderSpeechNoise(): void {
  const app = getAppContainer();
  
  switch (state.phase) {
    case 'intro':
      renderIntro(app);
      break;
    case 'testing':
      renderTesting(app);
      break;
    case 'results':
      renderResults(app);
      break;
  }
}

function renderIntro(app: HTMLElement): void {
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Speech in Noise Test">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">🗣️</div>
        <h1 class="header__title">Speech in Noise</h1>
        <p class="header__subtitle">Test your ability to understand speech with background noise</p>
      </header>
      
      <section class="card card--glow">
        <h2 class="card__title"><span aria-hidden="true">📋</span> How It Works</h2>
        <div class="text-secondary-lg">
          <p>This test measures how well you understand speech when there's background noise - like a restaurant or busy street.</p>
          <ol style="margin: var(--spacing-lg) 0; padding-left: var(--spacing-xl); line-height: 2;">
            <li>You'll hear a word spoken with background noise</li>
            <li>Type or select what you heard</li>
            <li>The noise level will change to find your threshold</li>
            <li>Results show your "SNR-50" - the noise level where you get 50% correct</li>
          </ol>
        </div>
        
        <div class="instructions">
          <div class="instructions__title"><span aria-hidden="true">🎧</span> Before you begin</div>
          <ul class="instructions__list">
            <li>Use headphones for accurate results</li>
            <li>Find a quiet environment</li>
            <li>The test takes about 3-4 minutes</li>
          </ul>
        </div>
        
        <div style="margin-top: var(--spacing-xl);">
          <label style="display: block; margin-bottom: var(--spacing-sm); font-weight: 500;">Word List:</label>
          <select id="word-list" class="speech-select">
            <option value="numbers" selected>Numbers (one, two, three...)</option>
            <option value="colors">Colors (red, blue, green...)</option>
            <option value="animals">Animals (cat, dog, bird...)</option>
          </select>
        </div>
        
        <button class="btn btn--primary btn--large mt-md" id="start-test" style="width: 100%;">
          <span aria-hidden="true">▶️</span> Start Test
        </button>
      </section>
      
      <nav class="nav-buttons">
        <button class="btn btn--secondary" id="back-home">
          <span aria-hidden="true">←</span> Home
        </button>
      </nav>
    </main>
  `;
  
  announce('Speech in Noise test. Press Start Test to begin.');
  
  onClick('start-test', () => {
    const select = document.getElementById('word-list') as HTMLSelectElement;
    state.wordListType = (select?.value || 'numbers') as WordListType;
    state.phase = 'testing';
    state.currentSNR = SNR_LEVELS[0];
    state.currentTrial = 0;
    state.results = new Map(SNR_LEVELS.map(snr => [snr, { correct: 0, total: 0 }]));
    state.usedWords = [];
    startNoise(getSpeechLevelForSNR(state.currentSNR));
    renderSpeechNoise();
    playNextWord();
  });
  
  onClick('back-home', () => {
    stopNoise();
    state = createInitialState();
    navigateTo('home');
  });
  
  focusMain();
}

function renderTesting(app: HTMLElement): void {
  const progress = calculateProgress();
  const words = WORD_LISTS[state.wordListType];
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Speech in Noise Test - Testing">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">🗣️</div>
        <h1 class="header__title">Listen Carefully</h1>
        <p class="header__subtitle">SNR: ${state.currentSNR > 0 ? '+' : ''}${state.currentSNR} dB</p>
      </header>
      
      <section class="card card--glow">
        <div class="progress" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress__bar" style="width: ${progress}%;"></div>
        </div>
        <p class="progress__text">${Math.round(progress)}% complete</p>
        
        <div class="speech-test-display">
          ${state.waitingForResponse ? `
            <p class="speech-question">What word did you hear?</p>
            <div class="speech-options" role="group" aria-label="Word options">
              ${words.map(word => `
                <button class="btn btn--secondary speech-option" data-word="${word}">
                  ${word}
                </button>
              `).join('')}
            </div>
            <button class="btn btn--secondary mt-md" id="replay-word" style="width: 100%;">
              <span aria-hidden="true">🔁</span> Replay Word
            </button>
          ` : `
            <div class="speech-listening">
              <div class="speech-listening__icon">👂</div>
              <p>Playing word...</p>
            </div>
          `}
        </div>
      </section>
      
      <nav class="nav-buttons">
        <button class="btn btn--secondary" id="cancel-test">
          <span aria-hidden="true">✕</span> Cancel Test
        </button>
      </nav>
    </main>
  `;
  
  if (state.waitingForResponse) {
    // Bind word selection handlers
    document.querySelectorAll('.speech-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedWord = btn.getAttribute('data-word') || '';
        handleResponse(selectedWord);
      });
    });
    
    onClick('replay-word', () => {
      speakWord(state.currentWord);
    });
  }
  
  onClick('cancel-test', () => {
    stopNoise();
    state = createInitialState();
    navigateTo('home');
  });
  
  focusMain();
}

function renderResults(app: HTMLElement): void {
  const snr50 = calculateSNR50(state.results);
  const interpretation = snr50 !== null ? interpretSNR50(snr50) : null;
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Speech in Noise Results">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">📊</div>
        <h1 class="header__title">Your Results</h1>
        <p class="header__subtitle">Speech-in-Noise Test Complete</p>
      </header>
      
      <section class="card card--glow">
        <h2 class="card__title"><span aria-hidden="true">🎯</span> SNR-50 Score</h2>
        ${snr50 !== null ? `
          <div style="text-align: center; margin: var(--spacing-xl) 0;">
            <div style="font-size: 3rem; font-family: var(--font-mono); color: var(--accent-primary);">
              ${snr50 > 0 ? '+' : ''}${snr50.toFixed(1)} dB
            </div>
            <div style="font-size: 1.2rem; color: var(--accent-left); margin-top: var(--spacing-sm);">
              ${interpretation?.grade}
            </div>
            <p style="color: var(--text-secondary); margin-top: var(--spacing-md);">
              ${interpretation?.description}
            </p>
          </div>
        ` : `
          <p style="text-align: center; color: var(--text-muted);">
            Unable to calculate SNR-50 - not enough data points.
          </p>
        `}
        
        <div style="margin-top: var(--spacing-xl);">
          <h3 style="font-size: 1rem; margin-bottom: var(--spacing-md);">Detailed Results</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <th style="padding: var(--spacing-sm); text-align: left;">SNR Level</th>
                <th style="padding: var(--spacing-sm); text-align: center;">Correct</th>
                <th style="padding: var(--spacing-sm); text-align: right;">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              ${SNR_LEVELS.map(snr => {
                const data = state.results.get(snr) || { correct: 0, total: 0 };
                const percent = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                return `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: var(--spacing-sm); font-family: var(--font-mono);">${snr > 0 ? '+' : ''}${snr} dB</td>
                    <td style="padding: var(--spacing-sm); text-align: center;">${data.correct}/${data.total}</td>
                    <td style="padding: var(--spacing-sm); text-align: right; color: ${percent >= 50 ? 'var(--accent-success)' : 'var(--text-muted)'};">
                      ${percent.toFixed(0)}%
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>
      
      <section class="card">
        <h2 class="card__title"><span aria-hidden="true">ℹ️</span> Understanding Your Score</h2>
        <div class="text-secondary-lg">
          <p><strong>SNR-50</strong> is the Signal-to-Noise Ratio where you correctly identify 50% of words.</p>
          <ul style="margin: var(--spacing-md) 0; padding-left: var(--spacing-xl);">
            <li><strong>Lower is better</strong> - you can understand speech with more background noise</li>
            <li><strong>0 dB SNR</strong> means speech and noise are equally loud</li>
            <li><strong>Negative values</strong> mean you can understand even when noise is louder</li>
          </ul>
          <table style="width: 100%; margin-top: var(--spacing-md);">
            <tr><td style="padding: 4px;">≤ -5 dB</td><td style="color: var(--accent-success);">Excellent</td></tr>
            <tr><td style="padding: 4px;">-5 to 0 dB</td><td style="color: var(--accent-left);">Good</td></tr>
            <tr><td style="padding: 4px;">0 to 5 dB</td><td style="color: var(--text-secondary);">Average</td></tr>
            <tr><td style="padding: 4px;">5 to 10 dB</td><td style="color: var(--accent-warning);">Below Average</td></tr>
            <tr><td style="padding: 4px;">> 10 dB</td><td style="color: var(--accent-right);">Difficulty</td></tr>
          </table>
        </div>
        <div class="disclaimer" role="alert">
          <span aria-hidden="true">⚠️</span> This is a screening tool only. 
          Results can vary based on audio quality and environment.
        </div>
      </section>
      
      <nav class="nav-buttons">
        <button class="btn btn--secondary" id="back-home">
          <span aria-hidden="true">←</span> Home
        </button>
        <button class="btn btn--primary" id="retry-test">
          <span aria-hidden="true">🔄</span> Try Again
        </button>
      </nav>
    </main>
  `;
  
  announce(`Test complete. Your SNR-50 score is ${snr50?.toFixed(1) || 'unavailable'} decibels.`);
  
  onClick('back-home', () => {
    state = createInitialState();
    navigateTo('home');
  });
  
  onClick('retry-test', () => {
    state = createInitialState();
    renderSpeechNoise();
  });
  
  focusMain();
}

function getSpeechLevelForSNR(snr: SNRLevel): number {
  // Base noise level at 0dB, adjust relative to speech
  // Negative SNR = speech quieter than noise
  return -snr;
}

function calculateProgress(): number {
  let completed = 0;
  const totalTrials = SNR_LEVELS.length * state.trialsPerSNR;
  
  state.results.forEach(data => {
    completed += data.total;
  });
  
  return (completed / totalTrials) * 100;
}

async function playNextWord(): Promise<void> {
  state.waitingForResponse = false;
  renderSpeechNoise();
  
  // Get a new word
  state.currentWord = getRandomWord(state.wordListType, state.usedWords);
  state.usedWords.push(state.currentWord);
  
  // Limit used words to prevent running out
  if (state.usedWords.length > 6) {
    state.usedWords.shift();
  }
  
  // Update noise level for current SNR
  startNoise(getSpeechLevelForSNR(state.currentSNR));
  
  // Wait a moment, then speak
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    await speakWord(state.currentWord);
  } catch (e) {
    console.error('Speech synthesis failed:', e);
  }
  
  // Wait a moment after speech, then show options
  await new Promise(resolve => setTimeout(resolve, 300));
  
  state.waitingForResponse = true;
  renderSpeechNoise();
}

function handleResponse(selectedWord: string): void {
  const isCorrect = selectedWord.toLowerCase() === state.currentWord.toLowerCase();
  
  // Record result
  const snrResults = state.results.get(state.currentSNR)!;
  snrResults.total++;
  if (isCorrect) snrResults.correct++;
  
  state.currentTrial++;
  
  // Check if we need to move to next SNR level
  if (state.currentTrial >= state.trialsPerSNR) {
    state.currentTrial = 0;
    
    // Move to next SNR level
    const currentIndex = SNR_LEVELS.indexOf(state.currentSNR);
    if (currentIndex < SNR_LEVELS.length - 1) {
      state.currentSNR = SNR_LEVELS[currentIndex + 1];
      playNextWord();
    } else {
      // Test complete
      stopNoise();
      state.phase = 'results';
      renderSpeechNoise();
    }
  } else {
    playNextWord();
  }
}

/**
 * Cleanup when leaving the screen
 */
export function cleanupSpeechNoiseScreen(): void {
  stopNoise();
  state = createInitialState();
}

