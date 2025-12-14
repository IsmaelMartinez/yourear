/**
 * Home screen - Landing page with test options and history
 */

import { getAppContainer, onClick, announce, focusMain } from '../utils/dom';
import { getAllProfiles, getLatestProfile } from '../storage/profile';
import { Audiogram } from '../ui/audiogram';
import { navigateTo } from '../state/app-state';
import { HearingProfile } from '../types';

export function renderHome(): void {
  const app = getAppContainer();
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
        
        <div class="flex-buttons" role="group" aria-label="Test options">
          <button class="btn btn--primary btn--large" id="start-full-test" aria-describedby="full-test-desc">
            <span aria-hidden="true">🎵</span> Full Test
            <span id="full-test-desc" style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">6 frequencies · ~8 min</span>
          </button>
          <button class="btn btn--secondary btn--large" id="start-quick-test" aria-describedby="quick-test-desc">
            <span aria-hidden="true">⚡</span> Quick Test
            <span id="quick-test-desc" style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">3 frequencies · ~2 min</span>
          </button>
        </div>
        <button class="btn btn--secondary mt-md" id="start-detailed-test" aria-describedby="detailed-test-desc" style="width: 100%;">
          <span aria-hidden="true">🔬</span> Detailed Test
          <span id="detailed-test-desc" style="display: inline; font-size: 0.75rem; opacity: 0.8; font-weight: normal; margin-left: 0.5rem;">11 frequencies incl. inter-octave · ~15 min</span>
        </button>
        
        <div class="disclaimer" role="alert">
          <span aria-hidden="true">⚠️</span> <strong>Medical Disclaimer:</strong> This is a self-assessment tool for curiosity and general awareness only. 
          It is NOT a medical diagnosis. Always consult a qualified audiologist for professional hearing evaluation.
        </div>
      </section>
      
      ${latest ? renderLatestResult(latest) : ''}
      ${profiles.length > 1 ? renderTestHistory(profiles) : ''}
      ${renderToolsSection()}
      ${renderAboutSection()}
      ${renderFooter()}
    </main>
  `;
  
  announce('Home screen loaded. Start a hearing test or view your previous results.');
  
  // Event bindings
  onClick('start-full-test', () => navigateTo('calibration', { mode: 'full' }));
  onClick('start-quick-test', () => navigateTo('calibration', { mode: 'quick' }));
  onClick('start-detailed-test', () => navigateTo('calibration', { mode: 'detailed' }));
  onClick('view-latest', () => { if (latest) navigateTo('results', { profile: latest }); });
  onClick('compare-tests', () => navigateTo('comparison'));
  onClick('tinnitus-matcher', () => navigateTo('tinnitus'));
  onClick('speech-noise-test', () => navigateTo('speech-noise'));
  
  // Render audiogram preview (wider for better readability)
  if (latest) {
    const container = document.getElementById('audiogram-preview');
    if (container) new Audiogram(container, 600, 400).setProfile(latest);
  }
  
  // Profile history click handlers
  bindProfileClickHandlers(profiles);
  
  focusMain();
}

function renderLatestResult(latest: HearingProfile): string {
  return `
    <section class="card" aria-labelledby="latest-result-title">
      <h2 class="card__title" id="latest-result-title"><span aria-hidden="true">📊</span> Your Latest Result${latest.age ? ` (Age ${latest.age})` : ''}</h2>
      <div id="audiogram-preview" class="audiogram-container" role="img" aria-label="Audiogram showing your latest hearing test results"></div>
      <p class="text-muted-sm">
        Tested on <time datetime="${latest.createdAt.toISOString()}">${latest.createdAt.toLocaleDateString()}</time>
      </p>
      <button class="btn btn--secondary mt-md" id="view-latest">
        View Details
      </button>
    </section>
  `;
}

function renderTestHistory(profiles: HearingProfile[]): string {
  return `
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
      ${profiles.length >= 2 ? `
        <button class="btn btn--secondary mt-md" id="compare-tests" style="width: 100%;">
          <span aria-hidden="true">📈</span> Compare Tests Over Time
        </button>
      ` : ''}
    </section>
  `;
}

function renderToolsSection(): string {
  return `
    <section class="card" aria-labelledby="tools-title">
      <h2 class="card__title" id="tools-title"><span aria-hidden="true">🛠️</span> Other Tools</h2>
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        <button class="btn btn--secondary" id="speech-noise-test" style="width: 100%;">
          <span aria-hidden="true">🗣️</span> Speech-in-Noise Test
          <span style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">Test hearing in noisy environments · ~4 min</span>
        </button>
        <button class="btn btn--secondary" id="tinnitus-matcher" style="width: 100%;">
          <span aria-hidden="true">🔔</span> Tinnitus Frequency Matcher
          <span style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">Identify your tinnitus frequency</span>
        </button>
      </div>
    </section>
  `;
}

function renderAboutSection(): string {
  return `
    <section class="card" aria-labelledby="about-title">
      <h2 class="card__title" id="about-title"><span aria-hidden="true">🔬</span> About the Technology</h2>
      <p class="text-secondary-lg">
        YourEar uses the <strong>Web Audio API</strong> to generate precise pure tones 
        across the standard audiometric frequencies (250 Hz to 8000 Hz). The test follows 
        a simplified <strong>Hughson-Westlake procedure</strong> to find your hearing thresholds.
      </p>
      <p class="text-muted-sm">
        <strong>Note:</strong> Due to hardware limitations of consumer devices, this tool cannot 
        test ultrasonic frequencies (>20 kHz) used by bats or infrasonic frequencies (<20 Hz) 
        used by elephants. That would require specialized microphones and speakers!
      </p>
    </section>
  `;
}

function renderFooter(): string {
  return `
    <footer class="footer" role="contentinfo">
      <p>Open source project · <a href="https://github.com/ISMAELMARTINEZ/yourear" target="_blank" rel="noopener noreferrer">GitHub <span class="sr-only">(opens in new tab)</span></a></p>
    </footer>
  `;
}

function bindProfileClickHandlers(profiles: HearingProfile[]): void {
  document.querySelectorAll('.profile-item').forEach(item => {
    const handler = () => {
      const profile = profiles.find(p => p.id === item.getAttribute('data-id'));
      if (profile) navigateTo('results', { profile });
    };
    
    item.addEventListener('click', handler);
    item.addEventListener('keydown', (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault();
        handler();
      }
    });
  });
}

