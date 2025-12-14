/**
 * YourEar - Browser-based hearing assessment
 */

import './styles.css';
import { HearingTest, TestEventType } from './audio/hearing-test';
import { playCalibrationTone, stopTone } from './audio/tone-generator';
import { Audiogram, generateSummary } from './ui/audiogram';
import { saveProfile, getAllProfiles, getLatestProfile } from './storage/profile';
import { HearingProfile, QUICK_TEST_CONFIG } from './types';

let hearingTest: HearingTest | null = null;
let currentScreen: 'home' | 'calibration' | 'test' | 'results' = 'home';
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let userAge: number | undefined;
let testMode: 'full' | 'quick' = 'full';

const app = document.getElementById('app')!;
const announcer = document.getElementById('announcer');

// Screen reader announcement helper
function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    // Clear after announcement
    setTimeout(() => { announcer.textContent = ''; }, 1000);
  }
}

// Focus management helper
function focusMain(): void {
  setTimeout(() => {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
    }
  }, 100);
}

// Generate accessible text description of audiogram data
function generateAudiogramDescription(profile: HearingProfile): string {
  const lines: string[] = ['Audiogram results:'];
  
  profile.thresholds.forEach(t => {
    const freqLabel = t.frequency >= 1000 ? `${t.frequency / 1000} kilohertz` : `${t.frequency} hertz`;
    const parts: string[] = [];
    if (t.rightEar !== null) parts.push(`Right ear: ${t.rightEar} decibels`);
    if (t.leftEar !== null) parts.push(`Left ear: ${t.leftEar} decibels`);
    if (parts.length) {
      lines.push(`At ${freqLabel}: ${parts.join(', ')}.`);
    }
  });
  
  return lines.join(' ');
}

// Check for demo mode or seed data
function checkUrlParams(): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === 'true') {
    seedDemoProfile();
  }
}

// Seed demo profile for testing (based on your results!)
function seedDemoProfile(): void {
  const existing = getAllProfiles();
  const hasDemo = existing.some(p => p.name?.includes('Demo'));
  
  if (!hasDemo) {
    saveProfile({
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

function render(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  
  switch (currentScreen) {
    case 'home': renderHome(); break;
    case 'calibration': renderCalibration(); break;
    case 'test': renderTest(); break;
    case 'results': renderResults(); break;
  }
}

function renderHome(): void {
  const profiles = getAllProfiles();
  const latest = getLatestProfile();
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="YourEar Home">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">👂</div>
        <h1 class="header__title">YourEar</h1>
        <p class="header__subtitle">Discover your hearing capabilities</p>
      </header>
      
      <section class="card card--glow" aria-labelledby="assessment-title">
        <h2 class="card__title" id="assessment-title"><span aria-hidden="true">🎧</span> Hearing Assessment</h2>
        <p>Test your hearing across different frequencies to create a personal audiogram.</p>
        
        <div class="instructions" role="region" aria-labelledby="instructions-title">
          <div class="instructions__title" id="instructions-title"><span aria-hidden="true">📋</span> Before you begin</div>
          <ul class="instructions__list" role="list">
            <li>Use headphones for accurate results</li>
            <li>Find a quiet environment</li>
            <li>Set your device volume to about 50%</li>
            <li>The test takes approximately 5-10 minutes</li>
          </ul>
        </div>
        
        <div style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;" role="group" aria-label="Test options">
          <button class="btn btn--primary btn--large" id="start-full-test" style="flex: 1; min-width: 200px;" aria-describedby="full-test-desc">
            <span aria-hidden="true">🎵</span> Full Test
            <span id="full-test-desc" style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">6 frequencies · ~8 min</span>
          </button>
          <button class="btn btn--secondary btn--large" id="start-quick-test" style="flex: 1; min-width: 200px;" aria-describedby="quick-test-desc">
            <span aria-hidden="true">⚡</span> Quick Test
            <span id="quick-test-desc" style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">3 frequencies · ~2 min</span>
          </button>
        </div>
        
        <div class="disclaimer" role="alert">
          <span aria-hidden="true">⚠️</span> <strong>Medical Disclaimer:</strong> This is a self-assessment tool for curiosity and general awareness only. 
          It is NOT a medical diagnosis. Always consult a qualified audiologist for professional hearing evaluation.
        </div>
      </section>
      
      ${latest ? `
        <section class="card" aria-labelledby="latest-result-title">
          <h2 class="card__title" id="latest-result-title"><span aria-hidden="true">📊</span> Your Latest Result${latest.age ? ` (Age ${latest.age})` : ''}</h2>
          <div id="audiogram-preview" role="img" aria-label="Audiogram showing your latest hearing test results"></div>
          <p style="color: var(--text-muted); margin-top: var(--spacing-md); font-size: 0.9rem;">
            Tested on <time datetime="${latest.createdAt.toISOString()}">${latest.createdAt.toLocaleDateString()}</time>
          </p>
          <button class="btn btn--secondary" id="view-latest" style="margin-top: var(--spacing-md);">
            View Details
          </button>
        </section>
      ` : ''}
      
      ${profiles.length > 1 ? `
        <section class="card" aria-labelledby="history-title">
          <h2 class="card__title" id="history-title"><span aria-hidden="true">📁</span> Test History</h2>
          <nav class="profiles__list" aria-label="Previous test results">
            ${profiles.slice(0, 5).map(p => `
              <button class="profile-item" data-id="${p.id}" type="button" aria-label="View ${p.name || 'Hearing Test'}${p.age ? `, age ${p.age}` : ''}, from ${p.createdAt.toLocaleDateString()}">
                <span class="profile-item__name">${p.name || 'Hearing Test'}${p.age ? ` (${p.age}y)` : ''}</span>
                <span class="profile-item__date" aria-hidden="true">${p.createdAt.toLocaleDateString()}</span>
              </button>
            `).join('')}
          </nav>
        </section>
      ` : ''}
      
      <section class="card" aria-labelledby="about-title">
        <h2 class="card__title" id="about-title"><span aria-hidden="true">🔬</span> About the Technology</h2>
        <p style="color: var(--text-secondary); line-height: 1.8;">
          YourEar uses the <strong>Web Audio API</strong> to generate precise pure tones 
          across the standard audiometric frequencies (250 Hz to 8000 Hz). The test follows 
          a simplified <strong>Hughson-Westlake procedure</strong> to find your hearing thresholds.
        </p>
        <p style="color: var(--text-muted); margin-top: var(--spacing-md); font-size: 0.9rem;">
          <strong>Note:</strong> Due to hardware limitations of consumer devices, this tool cannot 
          test ultrasonic frequencies (>20 kHz) used by bats or infrasonic frequencies (<20 Hz) 
          used by elephants. That would require specialized microphones and speakers!
        </p>
      </section>
      
      <footer class="footer" role="contentinfo">
        <p>Open source project · <a href="https://github.com/ISMAELMARTINEZ/yourear" target="_blank" rel="noopener noreferrer">GitHub <span class="sr-only">(opens in new tab)</span></a></p>
      </footer>
    </main>
  `;
  
  announce('Home screen loaded. Start a hearing test or view your previous results.');
  
  document.getElementById('start-full-test')?.addEventListener('click', () => {
    testMode = 'full';
    currentScreen = 'calibration';
    render();
  });
  
  document.getElementById('start-quick-test')?.addEventListener('click', () => {
    testMode = 'quick';
    currentScreen = 'calibration';
    render();
  });
  
  document.getElementById('view-latest')?.addEventListener('click', () => {
    if (latest) showResults(latest);
  });
  
  if (latest) {
    const container = document.getElementById('audiogram-preview');
    if (container) new Audiogram(container, 500, 350).setProfile(latest);
  }
  
  document.querySelectorAll('.profile-item').forEach(item => {
    item.addEventListener('click', () => {
      const profile = profiles.find(p => p.id === item.getAttribute('data-id'));
      if (profile) showResults(profile);
    });
    // Handle keyboard activation for profile items
    item.addEventListener('keydown', (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault();
        const profile = profiles.find(p => p.id === item.getAttribute('data-id'));
        if (profile) showResults(profile);
      }
    });
  });
  
  focusMain();
}

function renderCalibration(): void {
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
          <p id="age-description" style="color: var(--text-secondary); text-align: center;">
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
          <p id="headphone-description" style="color: var(--text-secondary); text-align: center;">
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
      
      <nav style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg);" aria-label="Test navigation">
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
  
  const ageInput = document.getElementById('age-input') as HTMLInputElement;
  ageInput?.addEventListener('change', () => {
    const val = parseInt(ageInput.value);
    userAge = (val >= 5 && val <= 120) ? val : undefined;
  });
  
  document.getElementById('test-right')?.addEventListener('click', () => {
    playCalibrationTone('right');
    announce('Playing test tone in right ear');
  });
  document.getElementById('test-left')?.addEventListener('click', () => {
    playCalibrationTone('left');
    announce('Playing test tone in left ear');
  });
  document.getElementById('back-home')?.addEventListener('click', () => { stopTone(); currentScreen = 'home'; render(); });
  document.getElementById('begin-test')?.addEventListener('click', () => { 
    stopTone(); 
    // Grab age value before starting
    const val = parseInt(ageInput?.value || '');
    userAge = (val >= 5 && val <= 120) ? val : undefined;
    startTest(); 
  });
  
  focusMain();
}

function startTest(): void {
  const config = testMode === 'quick' ? QUICK_TEST_CONFIG : undefined;
  hearingTest = new HearingTest(config);
  hearingTest.on((event: TestEventType) => {
    if (event === 'stateChange') render();
    if (event === 'testComplete') handleTestComplete();
  });
  currentScreen = 'test';
  render();
  hearingTest.start();
}

function renderTest(): void {
  const state = hearingTest?.getState();
  const progress = hearingTest?.getProgress() ?? 0;
  if (!state) return;
  
  const freqLabel = state.currentFrequency >= 1000 ? `${state.currentFrequency / 1000}` : String(state.currentFrequency);
  const freqUnit = state.currentFrequency >= 1000 ? 'kHz' : 'Hz';
  const freqSpoken = state.currentFrequency >= 1000 ? `${state.currentFrequency / 1000} kilohertz` : `${state.currentFrequency} hertz`;
  
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
          
          ${state.isPlaying ? `
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
          ` : `
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
          `}
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
  
  document.getElementById('heard')?.addEventListener('click', () => {
    hearingTest?.respondHeard();
    announce('Response recorded: heard');
  });
  document.getElementById('not-heard')?.addEventListener('click', () => {
    hearingTest?.respondNotHeard();
    announce('Response recorded: not heard');
  });
  document.getElementById('stop-test')?.addEventListener('click', () => { 
    hearingTest?.stop(); 
    currentScreen = 'home'; 
    announce('Test stopped'); 
    render(); 
  });
  
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
  const testState = hearingTest?.getState();
  if (testState?.isPlaying) {
    announce('Listening phase. A tone may be playing. Listen carefully.', 'assertive');
  } else {
    announce('Did you hear a tone? Press Space for yes, N for no.', 'assertive');
    // Focus on the "Yes" button for keyboard users
    setTimeout(() => document.getElementById('heard')?.focus(), 100);
  }
}

function handleTestComplete(): void {
  const results = hearingTest?.getResults();
  if (!results) return;
  const testLabel = testMode === 'quick' ? 'Quick Test' : 'Full Test';
  showResults(saveProfile({ 
    ...results, 
    name: `${testLabel} - ${new Date().toLocaleDateString()}`,
    age: userAge,
  }));
}

function showResults(profile: HearingProfile): void {
  currentScreen = 'results';
  renderResults(profile);
}

function renderResults(profile?: HearingProfile): void {
  const displayProfile = profile || getLatestProfile();
  if (!displayProfile) { currentScreen = 'home'; render(); return; }
  
  // Generate text description for audiogram
  const audiogramDescription = generateAudiogramDescription(displayProfile);
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Hearing Test Results">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">📊</div>
        <h1 class="header__title">Your Results</h1>
        <p class="header__subtitle">${displayProfile.name || 'Hearing Assessment'}${displayProfile.age ? ` · Age ${displayProfile.age}` : ''}</p>
      </header>
      
      <section class="card card--glow" aria-labelledby="audiogram-title">
        <h2 class="card__title" id="audiogram-title"><span aria-hidden="true">🎼</span> Your Audiogram</h2>
        <figure class="audiogram-container" id="audiogram" role="img" aria-label="Audiogram chart showing hearing thresholds">
          <figcaption class="sr-only">${audiogramDescription}</figcaption>
        </figure>
        ${displayProfile.age ? `
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: var(--spacing-md); text-align: center;" aria-hidden="true">
            <span style="color: var(--accent-warning);">- - -</span> Yellow dashed line = expected median for age ${displayProfile.age}<br>
            <span style="background: rgba(251, 191, 36, 0.3); padding: 2px 8px; border-radius: 4px;">Shaded area</span> = typical range for your age
          </p>
        ` : ''}
      </section>
      
      <section class="card" aria-labelledby="summary-title">
        <h2 class="card__title" id="summary-title"><span aria-hidden="true">📋</span> Summary</h2>
        <div class="summary" role="region" aria-label="Test results summary">${generateSummary(displayProfile)}</div>
      </section>
      
      <section class="card" aria-labelledby="understanding-title">
        <h2 class="card__title" id="understanding-title"><span aria-hidden="true">📖</span> Understanding Your Results</h2>
        <div style="color: var(--text-secondary); line-height: 1.8;">
          <p><strong>The audiogram</strong> shows your hearing thresholds - the quietest sounds you can hear at each frequency. Lower values (toward the top) mean better hearing.</p>
          <p style="margin-top: var(--spacing-md);"><strong>Normal hearing</strong> is generally considered to be thresholds of 20 dB HL or better (shown in the teal tinted area).</p>
          ${displayProfile.age ? `
            <p style="margin-top: var(--spacing-md);"><strong>Age comparison</strong>: The yellow area shows the typical range for people your age. If your results are within or above this area, your hearing is normal for your age.</p>
          ` : ''}
          <p style="margin-top: var(--spacing-md);"><strong>Symbols:</strong> <span aria-hidden="true">◯</span> Circle = Right ear (red) · <span aria-hidden="true">✕</span> X = Left ear (teal)</p>
        </div>
        <div class="disclaimer" role="alert"><span aria-hidden="true">⚠️</span> Remember: This is a self-assessment for curiosity only. Consult an audiologist for professional evaluation.</div>
      </section>
      
      <nav style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg);" aria-label="Result actions">
        <button class="btn btn--secondary" id="back-home" style="flex: 1;">
          <span aria-hidden="true">←</span> Home
        </button>
        <button class="btn btn--primary" id="new-test" style="flex: 1;">
          <span aria-hidden="true">🎵</span> New Test
        </button>
      </nav>
      
      <footer class="footer" role="contentinfo">
        <p>Open source project · <a href="https://github.com/ISMAELMARTINEZ/yourear" target="_blank" rel="noopener noreferrer">GitHub <span class="sr-only">(opens in new tab)</span></a></p>
      </footer>
    </main>
  `;
  
  announce('Test results loaded. Your audiogram and summary are now displayed.');
  
  const container = document.getElementById('audiogram');
  if (container) new Audiogram(container).setProfile(displayProfile);
  
  document.getElementById('back-home')?.addEventListener('click', () => { currentScreen = 'home'; render(); });
  document.getElementById('new-test')?.addEventListener('click', () => { currentScreen = 'calibration'; render(); });
  
  focusMain();
}

// Initialize
checkUrlParams();
render();
