/**
 * Comparison screen - Compare multiple hearing test results over time
 */

import { getAppContainer, onClick, announce, focusMain } from '../utils/dom';
import { getAllProfiles } from '../storage/profile';
import { ComparisonAudiogram, calculatePTAChange } from '../ui/comparison-audiogram';
import { navigateTo } from '../state/app-state';
import { HearingProfile } from '../types';

// Track selected profiles for comparison
let selectedProfileIds: Set<string> = new Set();
let comparisonAudiogram: ComparisonAudiogram | null = null;

export function renderComparison(): void {
  const app = getAppContainer();
  const profiles = getAllProfiles().sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  );
  
  if (profiles.length < 2) {
    // Not enough profiles to compare
    app.innerHTML = `
      <main id="main-content" class="screen" tabindex="-1" aria-label="Profile Comparison">
        <header class="header" role="banner">
          <div class="header__logo" aria-hidden="true">📈</div>
          <h1 class="header__title">Compare Results</h1>
          <p class="header__subtitle">Track your hearing over time</p>
        </header>
        
        <section class="card">
          <h2 class="card__title"><span aria-hidden="true">ℹ️</span> Not Enough Data</h2>
          <p class="text-secondary-lg">You need at least 2 hearing tests to compare results over time.</p>
          <p class="text-muted-sm">Complete more tests to see how your hearing changes!</p>
          <button class="btn btn--primary mt-md" id="back-home">
            <span aria-hidden="true">←</span> Back to Home
          </button>
        </section>
      </main>
    `;
    
    onClick('back-home', () => navigateTo('home'));
    focusMain();
    return;
  }
  
  // Initialize selection with the two most recent profiles
  if (selectedProfileIds.size === 0) {
    selectedProfileIds = new Set([profiles[0].id, profiles[1].id]);
  }
  
  const selectedProfiles = profiles.filter(p => selectedProfileIds.has(p.id));
  
  app.innerHTML = `
    <main id="main-content" class="screen" tabindex="-1" aria-label="Profile Comparison">
      <header class="header" role="banner">
        <div class="header__logo" aria-hidden="true">📈</div>
        <h1 class="header__title">Compare Results</h1>
        <p class="header__subtitle">Track your hearing over time</p>
      </header>
      
      <section class="card">
        <h2 class="card__title"><span aria-hidden="true">📋</span> Select Tests to Compare</h2>
        <p class="text-muted-sm" style="margin-bottom: var(--spacing-md);">Select 2-5 tests to overlay on the audiogram</p>
        <div class="profiles__list" role="group" aria-label="Available tests">
          ${profiles.map(p => `
            <label class="profile-checkbox" data-id="${p.id}">
              <input type="checkbox" 
                     ${selectedProfileIds.has(p.id) ? 'checked' : ''} 
                     ${!selectedProfileIds.has(p.id) && selectedProfileIds.size >= 5 ? 'disabled' : ''}
                     aria-label="Select ${p.name || 'Hearing Test'} from ${p.createdAt.toLocaleDateString()}">
              <span class="profile-checkbox__info">
                <span class="profile-item__name">${p.name || 'Hearing Test'}${p.age ? ` (${p.age}y)` : ''}</span>
                <span class="profile-item__date">${p.createdAt.toLocaleDateString()}</span>
              </span>
            </label>
          `).join('')}
        </div>
      </section>
      
      <section class="card card--glow" aria-labelledby="comparison-title">
        <h2 class="card__title" id="comparison-title"><span aria-hidden="true">🎼</span> Comparison</h2>
        <figure class="audiogram-container" id="comparison-audiogram" role="img" aria-label="Comparison audiogram showing multiple test results">
        </figure>
        ${renderChangesSummary(selectedProfiles)}
      </section>
      
      <nav class="nav-buttons" aria-label="Navigation">
        <button class="btn btn--secondary" id="back-home" style="flex: 1;">
          <span aria-hidden="true">←</span> Home
        </button>
      </nav>
    </main>
  `;
  
  announce('Comparison view loaded. Select tests to compare on the audiogram.');
  
  // Render comparison audiogram
  const container = document.getElementById('comparison-audiogram');
  if (container) {
    comparisonAudiogram = new ComparisonAudiogram(container);
    comparisonAudiogram.setProfiles(selectedProfiles);
  }
  
  // Event bindings
  onClick('back-home', () => {
    selectedProfileIds.clear(); // Reset selection when leaving
    navigateTo('home');
  });
  
  // Checkbox handlers
  document.querySelectorAll('.profile-checkbox input').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const profileId = target.closest('.profile-checkbox')?.getAttribute('data-id');
      if (!profileId) return;
      
      if (target.checked) {
        if (selectedProfileIds.size < 5) {
          selectedProfileIds.add(profileId);
        }
      } else {
        if (selectedProfileIds.size > 2) {
          selectedProfileIds.delete(profileId);
        } else {
          // Don't allow less than 2 selections
          target.checked = true;
          return;
        }
      }
      
      // Re-render to update audiogram and summary
      renderComparison();
    });
  });
  
  focusMain();
}

function renderChangesSummary(profiles: HearingProfile[]): string {
  if (profiles.length < 2) return '';
  
  // Sort by date (oldest first)
  const sorted = [...profiles].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];
  
  const daysBetween = Math.round((newest.createdAt.getTime() - oldest.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const change = calculatePTAChange(oldest, newest);
  
  // Check if profiles have standard PTA frequencies (500, 1000, 2000 Hz)
  const ptaFreqs = [500, 1000, 2000];
  const hasStandardPTA = (profile: HearingProfile) => {
    const freqs = profile.thresholds.map(t => t.frequency);
    return ptaFreqs.filter(f => freqs.includes(f)).length >= 2;
  };
  const usingStandardPTA = hasStandardPTA(oldest) && hasStandardPTA(newest);
  
  const formatChange = (val: number | null): string => {
    if (val === null || isNaN(val)) return 'N/A';
    const sign = val > 0 ? '+' : '';
    const emoji = val <= -5 ? '📈' : val >= 5 ? '📉' : '➡️';
    return `${emoji} ${sign}${val.toFixed(0)} dB`;
  };
  
  const getInterpretation = (val: number | null): string => {
    if (val === null || isNaN(val)) return '';
    if (val <= -5) return '(improved)';
    if (val >= 5) return '(declined)';
    return '(stable)';
  };
  
  const label = usingStandardPTA ? 'PTA' : 'Avg';
  const footnote = usingStandardPTA 
    ? 'PTA = Pure Tone Average (500, 1000, 2000 Hz). Changes ≤5 dB are typically within test variability.'
    : 'Avg = Average of tested frequencies (Quick Test uses 1000, 4000, 8000 Hz). For accurate PTA, use Full or Detailed Test.';
  
  return `
    <div class="comparison-summary" style="margin-top: var(--spacing-lg); padding: var(--spacing-lg); background: var(--bg-tertiary); border-radius: var(--radius-md);">
      <h3 style="font-size: 1rem; margin-bottom: var(--spacing-md);"><span aria-hidden="true">📊</span> Change Over ${daysBetween} Days</h3>
      <p style="color: var(--text-secondary);">
        Comparing ${oldest.createdAt.toLocaleDateString()} to ${newest.createdAt.toLocaleDateString()}
      </p>
      <div style="margin-top: var(--spacing-md); display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
        <div>
          <strong>Right Ear ${label}:</strong><br>
          ${formatChange(change.right)} <span style="color: var(--text-muted); font-size: 0.85rem;">${getInterpretation(change.right)}</span>
        </div>
        <div>
          <strong>Left Ear ${label}:</strong><br>
          ${formatChange(change.left)} <span style="color: var(--text-muted); font-size: 0.85rem;">${getInterpretation(change.left)}</span>
        </div>
      </div>
      <p class="text-muted-sm" style="margin-top: var(--spacing-md); font-size: 0.8rem;">
        ${footnote}
      </p>
    </div>
  `;
}

