/**
 * Home screen - Landing page with test options and history
 */

import { getAppContainer, onClick, announce, focusMain } from '../utils/dom';
import { getAllProfiles, getLatestProfile } from '../storage/profile';
import { Audiogram } from '../ui/audiogram';
import { navigateTo } from '../state/app-state';
import { HearingProfile } from '../types';
import { renderLanguageSelector, bindLanguageSelector } from '../ui/language-selector';
import { t } from '../i18n';

export function renderHome(): void {
  const app = getAppContainer();
  const profiles = getAllProfiles();
  const latest = getLatestProfile();
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="${t('home.title')} Home" style="position: relative;">
      ${renderLanguageSelector()}
      
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">👂</div>
        <h1 class="header__title">${t('home.title')}</h1>
        <p class="header__subtitle">${t('home.subtitle')}</p>
      </header>
      
      <section class="card card--glow" aria-labelledby="assessment-title">
        <h2 class="card__title" id="assessment-title"><span aria-hidden="true">🎧</span> ${t('home.assessment.title')}</h2>
        <p>${t('home.assessment.description')}</p>
        
        <div class="instructions" role="region" aria-labelledby="instructions-title">
          <div class="instructions__title" id="instructions-title"><span aria-hidden="true">📋</span> ${t('home.assessment.beforeYouBegin')}</div>
          <ul class="instructions__list" role="list">
            <li>${t('home.assessment.instructions.headphones')}</li>
            <li>${t('home.assessment.instructions.quiet')}</li>
            <li>${t('home.assessment.instructions.volume')}</li>
            <li>${t('home.assessment.instructions.time')}</li>
          </ul>
        </div>
        
        <div class="flex-buttons" role="group" aria-label="Test options">
          <button class="btn btn--primary btn--large" id="start-full-test" aria-describedby="full-test-desc">
            <span aria-hidden="true">🎵</span> ${t('home.assessment.fullTest')}
            <span id="full-test-desc" style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">${t('home.assessment.fullTestDesc')}</span>
          </button>
          <button class="btn btn--secondary btn--large" id="start-quick-test" aria-describedby="quick-test-desc">
            <span aria-hidden="true">⚡</span> ${t('home.assessment.quickTest')}
            <span id="quick-test-desc" style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">${t('home.assessment.quickTestDesc')}</span>
          </button>
        </div>
        <button class="btn btn--secondary mt-md" id="start-detailed-test" aria-describedby="detailed-test-desc" style="width: 100%;">
          <span aria-hidden="true">🔬</span> ${t('home.assessment.detailedTest')}
          <span id="detailed-test-desc" style="display: inline; font-size: 0.75rem; opacity: 0.8; font-weight: normal; margin-left: 0.5rem;">${t('home.assessment.detailedTestDesc')}</span>
        </button>
        
        <div class="disclaimer" role="alert">
          <span aria-hidden="true">⚠️</span> <strong>${t('home.disclaimer.title')}</strong> ${t('home.disclaimer.text')}
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
  
  // Bind language selector
  bindLanguageSelector();
  
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
      <h2 class="card__title" id="latest-result-title"><span aria-hidden="true">📊</span> ${t('home.latestResult.title')}${latest.age ? ` (${latest.age} ${t('common.years')})` : ''}</h2>
      <div id="audiogram-preview" class="audiogram-container" role="img" aria-label="Audiogram showing your latest hearing test results"></div>
      <p class="text-muted-sm">
        ${t('home.latestResult.testedOn')} <time datetime="${latest.createdAt.toISOString()}">${latest.createdAt.toLocaleDateString()}</time>
      </p>
      <button class="btn btn--secondary mt-md" id="view-latest">
        ${t('common.viewDetails')}
      </button>
    </section>
  `;
}

function renderTestHistory(profiles: HearingProfile[]): string {
  return `
    <section class="card" aria-labelledby="history-title">
      <h2 class="card__title" id="history-title"><span aria-hidden="true">📁</span> ${t('home.history.title')}</h2>
      <nav class="profiles__list" aria-label="Previous test results">
        ${profiles.slice(0, 5).map(p => `
          <button class="profile-item" data-id="${p.id}" type="button" aria-label="View ${p.name || 'Hearing Test'}${p.age ? `, age ${p.age}` : ''}, from ${p.createdAt.toLocaleDateString()}">
            <span class="profile-item__name">${p.name || 'Hearing Test'}${p.age ? ` (${p.age}${t('common.years')})` : ''}</span>
            <span class="profile-item__date" aria-hidden="true">${p.createdAt.toLocaleDateString()}</span>
          </button>
        `).join('')}
      </nav>
      ${profiles.length >= 2 ? `
        <button class="btn btn--secondary mt-md" id="compare-tests" style="width: 100%;">
          <span aria-hidden="true">📈</span> ${t('home.history.compare')}
        </button>
      ` : ''}
    </section>
  `;
}

function renderToolsSection(): string {
  return `
    <section class="card" aria-labelledby="tools-title">
      <h2 class="card__title" id="tools-title"><span aria-hidden="true">🛠️</span> ${t('home.tools.title')}</h2>
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        <button class="btn btn--secondary" id="speech-noise-test" style="width: 100%;">
          <span aria-hidden="true">🗣️</span> ${t('home.tools.speechNoise')}
          <span style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">${t('home.tools.speechNoiseDesc')}</span>
        </button>
        <button class="btn btn--secondary" id="tinnitus-matcher" style="width: 100%;">
          <span aria-hidden="true">🔔</span> ${t('home.tools.tinnitus')}
          <span style="display: block; font-size: 0.75rem; opacity: 0.8; font-weight: normal;">${t('home.tools.tinnitusDesc')}</span>
        </button>
      </div>
    </section>
  `;
}

function renderAboutSection(): string {
  return `
    <section class="card" aria-labelledby="about-title">
      <h2 class="card__title" id="about-title"><span aria-hidden="true">🔬</span> ${t('home.about.title')}</h2>
      <p class="text-secondary-lg">
        ${t('home.about.description')}
      </p>
      <p class="text-muted-sm">
        <strong>Note:</strong> ${t('home.about.limitations')}
      </p>
    </section>
  `;
}

function renderFooter(): string {
  return `
    <footer class="footer" role="contentinfo">
      <p>${t('home.footer.openSource')} · <a href="https://github.com/ISMAELMARTINEZ/yourear" target="_blank" rel="noopener noreferrer">GitHub <span class="sr-only">(opens in new tab)</span></a></p>
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

