/**
 * Home screen - Landing page with test options and history
 */

import { getAppContainer, onClick, announce, focusMain, escapeHtml, renderHeader, renderFooter } from '../utils/dom';
import { getAllProfiles } from '../storage/profile';
import { Audiogram } from '../ui/audiogram';
import { navigateTo } from '../state/app-state';
import { HearingProfile, TEST_MODES, TestMode } from '../types';

export function renderHome(): void {
  const app = getAppContainer();
  const profiles = getAllProfiles().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const latest = profiles[0];
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="YourEar Home">
      ${renderHeader('👂', 'YourEar', 'Discover your hearing capabilities')}
      
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
          ${renderModeButton('full', 'btn--primary btn--large')}
          ${renderModeButton('quick', 'btn--secondary btn--large')}
        </div>
        ${renderModeButton('detailed', 'btn--secondary mt-md w-full')}
        
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
  for (const mode of Object.keys(TEST_MODES) as TestMode[]) {
    onClick(`start-${mode}-test`, () => navigateTo('calibration', { mode }));
  }
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

function renderModeButton(mode: TestMode, classes: string): string {
  const { icon, label, config, minutes, note } = TEST_MODES[mode];
  return `
    <button class="btn ${classes}" id="start-${mode}-test" aria-describedby="${mode}-test-desc">
      <span aria-hidden="true">${icon}</span> ${label}
      <span id="${mode}-test-desc" class="btn__sublabel">${config.frequencies.length} frequencies${note ? ` ${note}` : ''} · ~${minutes} min</span>
    </button>
  `;
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
          <button class="profile-item" data-id="${escapeHtml(p.id)}" type="button" aria-label="View ${escapeHtml(p.name || 'Hearing Test')}${p.age ? `, age ${p.age}` : ''}, from ${p.createdAt.toLocaleDateString()}">
            <span class="profile-item__name">${escapeHtml(p.name || 'Hearing Test')}${p.age ? ` (${p.age}y)` : ''}</span>
            <span class="profile-item__date" aria-hidden="true">${p.createdAt.toLocaleDateString()}</span>
          </button>
        `).join('')}
      </nav>
      <button class="btn btn--secondary mt-md w-full" id="compare-tests">
        <span aria-hidden="true">📈</span> Compare Tests Over Time
      </button>
    </section>
  `;
}

function renderToolsSection(): string {
  return `
    <section class="card" aria-labelledby="tools-title">
      <h2 class="card__title" id="tools-title"><span aria-hidden="true">🛠️</span> Other Tools</h2>
      <div class="flex-col-gap">
        <button class="btn btn--secondary w-full" id="speech-noise-test">
          <span aria-hidden="true">🗣️</span> Speech-in-Noise Test
          <span class="btn__sublabel">Test hearing in noisy environments · ~4 min</span>
        </button>
        <button class="btn btn--secondary w-full" id="tinnitus-matcher">
          <span aria-hidden="true">🔔</span> Tinnitus Frequency Matcher
          <span class="btn__sublabel">Identify your tinnitus frequency</span>
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

function bindProfileClickHandlers(profiles: HearingProfile[]): void {
  document.querySelectorAll('.profile-item').forEach(item => {
    item.addEventListener('click', () => {
      const profile = profiles.find(p => p.id === item.getAttribute('data-id'));
      if (profile) navigateTo('results', { profile });
    });
  });
}

