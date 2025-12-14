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
    <div class="screen">
      <header class="header">
        <div class="header__logo">👂</div>
        <h1 class="header__title">YourEar</h1>
        <p class="header__subtitle">Discover your hearing capabilities</p>
      </header>
      
      <div class="card card--glow">
        <h2 class="card__title">🎧 Hearing Assessment</h2>
        <p>Test your hearing across different frequencies to create a personal audiogram.</p>
        
        <div class="instructions">
          <div class="instructions__title">📋 Before you begin</div>
          <ul class="instructions__list">
            <li>Use headphones for accurate results</li>
            <li>Find a quiet environment</li>
            <li>Set your device volume to about 50%</li>
            <li>The test takes approximately 5-10 minutes</li>
          </ul>
        </div>
        
        <div style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
          <button class="btn btn--primary btn--large" id="start-full-test" style="flex: 1; min-width: 200px;">
            🎵 Full Test
            <span style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">6 frequencies · ~8 min</span>
          </button>
          <button class="btn btn--secondary btn--large" id="start-quick-test" style="flex: 1; min-width: 200px;">
            ⚡ Quick Test
            <span style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">3 frequencies · ~2 min</span>
          </button>
        </div>
        
        <div class="disclaimer">
          ⚠️ <strong>Medical Disclaimer:</strong> This is a self-assessment tool for curiosity and general awareness only. 
          It is NOT a medical diagnosis. Always consult a qualified audiologist for professional hearing evaluation.
        </div>
      </div>
      
      ${latest ? `
        <div class="card">
          <h2 class="card__title">📊 Your Latest Result${latest.age ? ` (Age ${latest.age})` : ''}</h2>
          <div id="audiogram-preview"></div>
          <p style="color: var(--text-muted); margin-top: var(--spacing-md); font-size: 0.9rem;">
            Tested on ${latest.createdAt.toLocaleDateString()}
          </p>
          <button class="btn btn--secondary" id="view-latest" style="margin-top: var(--spacing-md);">
            View Details
          </button>
        </div>
      ` : ''}
      
      ${profiles.length > 1 ? `
        <div class="card">
          <h2 class="card__title">📁 Test History</h2>
          <div class="profiles__list">
            ${profiles.slice(0, 5).map(p => `
              <div class="profile-item" data-id="${p.id}">
                <span class="profile-item__name">${p.name || 'Hearing Test'}${p.age ? ` (${p.age}y)` : ''}</span>
                <span class="profile-item__date">${p.createdAt.toLocaleDateString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="card">
        <h2 class="card__title">🔬 About the Technology</h2>
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
      </div>
      
      <footer class="footer">
        <p>Open source project · <a href="https://github.com/ISMAELMARTINEZ/yourear" target="_blank">GitHub</a></p>
      </footer>
    </div>
  `;
  
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
  });
}

function renderCalibration(): void {
  const isQuick = testMode === 'quick';
  
  app.innerHTML = `
    <div class="screen">
      <header class="header">
        <div class="header__logo">${isQuick ? '⚡' : '🔊'}</div>
        <h1 class="header__title">${isQuick ? 'Quick Test' : 'Full Test'} Setup</h1>
        <p class="header__subtitle">${isQuick ? '3 frequencies · ~2 minutes' : '6 frequencies · ~8 minutes'}</p>
      </header>
      
      <div class="card card--glow">
        <div class="calibration">
          <h2 class="card__title" style="justify-content: center;">👤 Your Age</h2>
          <p style="color: var(--text-secondary); text-align: center;">
            Enter your age to compare your results with expected values for your age group.
          </p>
          
          <div style="display: flex; justify-content: center; margin: var(--spacing-lg) 0;">
            <input type="number" id="age-input" min="5" max="120" value="${userAge || ''}" 
              placeholder="Enter age" 
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
            <span style="padding: var(--spacing-md); font-size: 1.2rem; color: var(--text-muted);">years</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="calibration">
          <h2 class="card__title" style="justify-content: center;">🎧 Test Your Headphones</h2>
          <p style="color: var(--text-secondary); text-align: center;">
            Click each button to play a test tone. Adjust your volume until comfortable.
          </p>
          
          <div class="calibration__ear-buttons">
            <button class="btn btn--secondary" id="test-right" style="background: rgba(255, 107, 107, 0.1); border-color: var(--accent-right);">
              ◯ Right Ear
            </button>
            <button class="btn btn--secondary" id="test-left" style="background: rgba(78, 205, 196, 0.1); border-color: var(--accent-left);">
              ✕ Left Ear
            </button>
          </div>
          
          <p class="calibration__tip">💡 Make sure both ears can hear the test tones!</p>
        </div>
      </div>
      
      <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg);">
        <button class="btn btn--secondary" id="back-home" style="flex: 1;">← Back</button>
        <button class="btn btn--primary btn--large" id="begin-test" style="flex: 2;">I'm ready - Begin Test →</button>
      </div>
    </div>
  `;
  
  const ageInput = document.getElementById('age-input') as HTMLInputElement;
  ageInput?.addEventListener('change', () => {
    const val = parseInt(ageInput.value);
    userAge = (val >= 5 && val <= 120) ? val : undefined;
  });
  
  document.getElementById('test-right')?.addEventListener('click', () => playCalibrationTone('right'));
  document.getElementById('test-left')?.addEventListener('click', () => playCalibrationTone('left'));
  document.getElementById('back-home')?.addEventListener('click', () => { stopTone(); currentScreen = 'home'; render(); });
  document.getElementById('begin-test')?.addEventListener('click', () => { 
    stopTone(); 
    // Grab age value before starting
    const val = parseInt(ageInput?.value || '');
    userAge = (val >= 5 && val <= 120) ? val : undefined;
    startTest(); 
  });
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
  
  const isQuick = testMode === 'quick';
  
  app.innerHTML = `
    <div class="screen">
      <header class="header" style="margin-bottom: var(--spacing-lg);">
        <h1 class="header__title" style="font-size: 1.5rem;">${isQuick ? '⚡ Quick' : '🎵 Full'} Test</h1>
      </header>
      
      <div class="card card--glow">
        <div class="progress">
          <div class="progress__bar" style="width: ${progress}%"></div>
        </div>
        <div class="progress__text">${Math.round(progress)}% complete</div>
        
        <div class="test-display">
          <div class="test-display__info">
            <div class="test-display__frequency">${freqLabel}<span class="test-display__frequency-unit">${freqUnit}</span></div>
            <div class="test-display__ear test-display__ear--${state.currentEar}">
              ${state.currentEar === 'right' ? '◯' : '✕'} ${state.currentEar === 'right' ? 'Right' : 'Left'} Ear
            </div>
          </div>
          
          ${state.isPlaying ? `
            <div class="listening-state">
              <div class="listening-state__icon">🎧</div>
              <div class="sound-wave">
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
            <div class="response-state">
              <p class="response-state__question">Did you hear a tone?</p>
              <div class="response-buttons">
                <button class="btn btn--heard" id="heard">✓ Yes, I heard it</button>
                <button class="btn btn--not-heard" id="not-heard">✗ No, I didn't</button>
              </div>
              <p class="response-state__hint">Press <kbd>Space</kbd> for yes, <kbd>N</kbd> for no</p>
            </div>
          `}
        </div>
        
        <button class="btn btn--secondary" id="stop-test" style="margin-top: var(--spacing-xl); width: 100%;">Stop Test</button>
      </div>
      
      <div class="card">
        <h3 class="card__title">💡 Tips</h3>
        <ul class="instructions__list">
          <li>The tone will play, then you'll be asked if you heard it</li>
          <li>Even if very faint, click "Yes" if you heard anything</li>
          <li>If unsure or didn't hear, click "No" - the test will try again louder</li>
        </ul>
      </div>
    </div>
  `;
  
  document.getElementById('heard')?.addEventListener('click', () => hearingTest?.respondHeard());
  document.getElementById('not-heard')?.addEventListener('click', () => hearingTest?.respondNotHeard());
  document.getElementById('stop-test')?.addEventListener('click', () => { hearingTest?.stop(); currentScreen = 'home'; render(); });
  
  keydownHandler = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); hearingTest?.respondHeard(); }
    else if (e.code === 'KeyN' || e.code === 'Escape') { e.preventDefault(); hearingTest?.respondNotHeard(); }
  };
  document.addEventListener('keydown', keydownHandler);
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
  
  app.innerHTML = `
    <div class="screen">
      <header class="header">
        <div class="header__logo">📊</div>
        <h1 class="header__title">Your Results</h1>
        <p class="header__subtitle">${displayProfile.name || 'Hearing Assessment'}${displayProfile.age ? ` · Age ${displayProfile.age}` : ''}</p>
      </header>
      
      <div class="card card--glow">
        <h2 class="card__title">🎼 Your Audiogram</h2>
        <div class="audiogram-container" id="audiogram"></div>
        ${displayProfile.age ? `
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: var(--spacing-md); text-align: center;">
            <span style="color: var(--accent-warning);">- - -</span> Yellow dashed line = expected median for age ${displayProfile.age}<br>
            <span style="background: rgba(251, 191, 36, 0.3); padding: 2px 8px; border-radius: 4px;">Shaded area</span> = typical range for your age
          </p>
        ` : ''}
      </div>
      
      <div class="card">
        <h2 class="card__title">📋 Summary</h2>
        <div class="summary">${generateSummary(displayProfile)}</div>
      </div>
      
      <div class="card">
        <h2 class="card__title">📖 Understanding Your Results</h2>
        <div style="color: var(--text-secondary); line-height: 1.8;">
          <p><strong>The audiogram</strong> shows your hearing thresholds - the quietest sounds you can hear at each frequency. Lower values (toward the top) mean better hearing.</p>
          <p style="margin-top: var(--spacing-md);"><strong>Normal hearing</strong> is generally considered to be thresholds of 20 dB HL or better (shown in the teal tinted area).</p>
          ${displayProfile.age ? `
            <p style="margin-top: var(--spacing-md);"><strong>Age comparison</strong>: The yellow area shows the typical range for people your age. If your results are within or above this area, your hearing is normal for your age.</p>
          ` : ''}
          <p style="margin-top: var(--spacing-md);"><strong>Symbols:</strong> ◯ = Right ear (red) · ✕ = Left ear (teal)</p>
        </div>
        <div class="disclaimer">⚠️ Remember: This is a self-assessment for curiosity only. Consult an audiologist for professional evaluation.</div>
      </div>
      
      <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg);">
        <button class="btn btn--secondary" id="back-home" style="flex: 1;">← Home</button>
        <button class="btn btn--primary" id="new-test" style="flex: 1;">🎵 New Test</button>
      </div>
      
      <footer class="footer">
        <p>Open source project · <a href="https://github.com/ISMAELMARTINEZ/yourear" target="_blank">GitHub</a></p>
      </footer>
    </div>
  `;
  
  const container = document.getElementById('audiogram');
  if (container) new Audiogram(container).setProfile(displayProfile);
  
  document.getElementById('back-home')?.addEventListener('click', () => { currentScreen = 'home'; render(); });
  document.getElementById('new-test')?.addEventListener('click', () => { currentScreen = 'calibration'; render(); });
}

// Initialize
checkUrlParams();
render();
