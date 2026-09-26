/**
 * Speech-in-Noise Test Screen
 * 
 * Tests ability to understand speech with background noise at various SNR levels.
 */

import { getAppContainer, onClick, announce, focusMain, renderHeader } from '../utils/dom';
import { navigateTo } from '../state/app-state';
import {
  startNoise,
  stopNoise,
  setNoiseLevel,
  speakWord,
  stopSpeech,
  getRandomWord,
  WORD_LISTS,
  SNR_LEVELS,
  SNRLevel,
  SNRResults,
  advanceTrial,
  createEmptyResults,
  noiseLevelDbfsForSNR,
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
  results: SNRResults;
  waitingForResponse: boolean;
}

let state: TestState = createInitialState();
/** Bumped on cleanup so an in-flight playNextWord stops after its next await */
let runToken = 0;

function createInitialState(): TestState {
  return {
    phase: 'intro',
    currentSNR: 10,
    currentWord: '',
    usedWords: [],
    wordListType: 'numbers',
    trialsPerSNR: 4,
    currentTrial: 0,
    results: createEmptyResults(),
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
      ${renderHeader('🗣️', 'Speech in Noise', 'Test your ability to understand speech with background noise')}
      
      <section class="card card--glow">
        <h2 class="card__title"><span aria-hidden="true">📋</span> How It Works</h2>
        <div class="text-secondary-lg">
          <p>This test measures how well you understand speech when there's background noise - like a restaurant or busy street.</p>
          <ol class="bullet-list bullet-list--spaced">
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
        
        <div class="mt-xl">
          <label class="field-label">Word List:</label>
          <select id="word-list" class="speech-select">
            <option value="numbers" selected>Numbers (one, two, three...)</option>
            <option value="colors">Colors (red, blue, green...)</option>
            <option value="animals">Animals (cat, dog, bird...)</option>
          </select>
        </div>
        
        <button class="btn btn--primary btn--large mt-md w-full" id="start-test">
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
    state.results = createEmptyResults();
    state.usedWords = [];
    startNoise(noiseLevelDbfsForSNR(state.currentSNR));
    playNextWord();
  });
  
  onClick('back-home', () => navigateTo('home'));
  
  focusMain();
}

function renderTesting(app: HTMLElement): void {
  const progress = calculateProgress();
  const words = WORD_LISTS[state.wordListType];
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Speech in Noise Test - Testing">
      ${renderHeader('🗣️', 'Listen Carefully', `SNR: ${state.currentSNR > 0 ? '+' : ''}${state.currentSNR} dB`)}
      
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
            <button class="btn btn--secondary mt-md w-full" id="replay-word">
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
  
  onClick('cancel-test', () => navigateTo('home'));
  
  if (state.waitingForResponse) {
    // Put keyboard users straight onto the word choices rather than the page top
    document.querySelector<HTMLElement>('.speech-option')?.focus();
    announce('What word did you hear? Choose from the options.');
  } else {
    focusMain();
  }
}

function renderResults(app: HTMLElement): void {
  const snr50 = calculateSNR50(state.results);
  const interpretation = snr50 !== null ? interpretSNR50(snr50) : null;
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Speech in Noise Results">
      ${renderHeader('📊', 'Your Results', 'Speech-in-Noise Test Complete')}
      
      <section class="card card--glow">
        <h2 class="card__title"><span aria-hidden="true">🎯</span> SNR-50 Score</h2>
        ${snr50 !== null ? `
          <div class="snr-score">
            <div class="snr-score__value">
              ${snr50 > 0 ? '+' : ''}${snr50.toFixed(1)} dB
            </div>
            <div class="snr-score__grade">
              ${interpretation?.grade}
            </div>
            <p class="text-secondary mt-md">
              ${interpretation?.description}
            </p>
          </div>
        ` : `
          <p class="text-center text-muted">
            Unable to calculate SNR-50 - not enough data points.
          </p>
        `}
        
        <div class="mt-xl">
          <h3 class="subheading">Detailed Results</h3>
          <table class="snr-table">
            <thead>
              <tr>
                <th>SNR Level</th>
                <th>Correct</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              ${SNR_LEVELS.map(snr => {
                const data = state.results.get(snr) || { correct: 0, total: 0 };
                const percent = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                return `
                  <tr>
                    <td>${snr > 0 ? '+' : ''}${snr} dB</td>
                    <td>${data.correct}/${data.total}</td>
                    <td class="${percent >= 50 ? 'text-success' : 'text-muted'}">
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
          <ul class="bullet-list">
            <li><strong>Lower is better</strong> - you can understand speech with more background noise</li>
            <li><strong>0 dB SNR</strong> means speech and noise are equally loud</li>
            <li><strong>Negative values</strong> mean you can understand even when noise is louder</li>
          </ul>
          <table class="snr-scale">
            <tr><td>≤ -5 dB</td><td class="text-success">Excellent</td></tr>
            <tr><td>-5 to 0 dB</td><td class="text-left-ear">Good</td></tr>
            <tr><td>0 to 5 dB</td><td class="text-secondary">Average</td></tr>
            <tr><td>5 to 10 dB</td><td class="text-warning">Below Average</td></tr>
            <tr><td>> 10 dB</td><td class="text-right-ear">Difficulty</td></tr>
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
  
  onClick('back-home', () => navigateTo('home'));
  
  onClick('retry-test', () => {
    state = createInitialState();
    renderSpeechNoise();
  });
  
  focusMain();
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
  const token = runToken;
  state.waitingForResponse = false;
  renderSpeechNoise();
  
  // Get a new word
  state.currentWord = getRandomWord(state.wordListType, state.usedWords);
  state.usedWords.push(state.currentWord);
  
  // Limit used words to prevent running out
  if (state.usedWords.length > 6) {
    state.usedWords.shift();
  }
  
  // Wait a moment, then speak
  await new Promise(resolve => setTimeout(resolve, 500));
  if (token !== runToken) return;
  
  try {
    await speakWord(state.currentWord);
  } catch (e) {
    console.error('Word playback failed:', e);
  }
  if (token !== runToken) return;
  
  // Wait a moment after speech, then show options
  await new Promise(resolve => setTimeout(resolve, 300));
  if (token !== runToken) return;
  
  state.waitingForResponse = true;
  renderSpeechNoise();
}

function handleResponse(selectedWord: string): void {
  const isCorrect = selectedWord.toLowerCase() === state.currentWord.toLowerCase();
  const previousSNR = state.currentSNR;
  const next = advanceTrial(state, isCorrect, state.trialsPerSNR);
  state.results = next.results;
  state.currentSNR = next.currentSNR;
  state.currentTrial = next.currentTrial;

  if (next.done) {
    stopNoise();
    state.phase = 'results';
    renderSpeechNoise();
    return;
  }
  if (state.currentSNR !== previousSNR) {
    setNoiseLevel(noiseLevelDbfsForSNR(state.currentSNR));
  }
  playNextWord();
}

/**
 * Cleanup when leaving the screen
 */
export function cleanupSpeechNoiseScreen(): void {
  runToken++;
  stopSpeech();
  stopNoise();
  state = createInitialState();
}

