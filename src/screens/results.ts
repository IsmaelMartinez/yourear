/**
 * Results screen - Display audiogram and summary
 */

import { getAppContainer, onClick, announce, focusMain } from '../utils/dom';
import { getLatestProfile } from '../storage/profile';
import { Audiogram, generateSummary } from '../ui/audiogram';
import { getState, navigateTo } from '../state/app-state';
import { HearingProfile, formatFrequency } from '../types';
import { exportToPDF } from '../services/pdf-export';

// Store audiogram instance for PDF export
let currentAudiogram: Audiogram | null = null;

export function renderResults(): void {
  const app = getAppContainer();
  const { viewingProfile } = getState();
  const displayProfile = viewingProfile || getLatestProfile();
  
  if (!displayProfile) { 
    navigateTo('home'); 
    return; 
  }
  
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
        ${displayProfile.age ? renderAgeLegend(displayProfile.age) : ''}
      </section>
      
      <section class="card" aria-labelledby="summary-title">
        <h2 class="card__title" id="summary-title"><span aria-hidden="true">📋</span> Summary</h2>
        <div class="summary" role="region" aria-label="Test results summary">${generateSummary(displayProfile)}</div>
      </section>
      
      ${renderUnderstandingSection(displayProfile)}
      
      <nav class="nav-buttons" aria-label="Result actions">
        <button class="btn btn--secondary" id="back-home">
          <span aria-hidden="true">←</span> Home
        </button>
        <button class="btn btn--secondary" id="export-pdf">
          <span aria-hidden="true">📄</span> Export PDF
        </button>
        <button class="btn btn--primary" id="new-test">
          <span aria-hidden="true">🎵</span> New Test
        </button>
      </nav>
      
      <footer class="footer" role="contentinfo">
        <p>Open source project · <a href="https://github.com/ISMAELMARTINEZ/yourear" target="_blank" rel="noopener noreferrer">GitHub <span class="sr-only">(opens in new tab)</span></a></p>
      </footer>
    </main>
  `;
  
  announce('Test results loaded. Your audiogram and summary are now displayed.');
  
  // Render audiogram
  const container = document.getElementById('audiogram');
  if (container) {
    currentAudiogram = new Audiogram(container);
    currentAudiogram.setProfile(displayProfile);
  }
  
  // Event bindings
  onClick('back-home', () => navigateTo('home'));
  onClick('new-test', () => navigateTo('calibration'));
  onClick('export-pdf', () => handleExportPDF(displayProfile));
  
  focusMain();
}

function renderAgeLegend(age: number): string {
  return `
    <p class="text-muted-sm text-center" aria-hidden="true">
      <span style="color: var(--accent-warning);">- - -</span> Yellow dashed line = expected median for age ${age}<br>
      <span style="background: rgba(251, 191, 36, 0.3); padding: 2px 8px; border-radius: 4px;">Shaded area</span> = typical range for your age
    </p>
  `;
}

function renderUnderstandingSection(profile: HearingProfile): string {
  return `
    <section class="card" aria-labelledby="understanding-title">
      <h2 class="card__title" id="understanding-title"><span aria-hidden="true">📖</span> Understanding Your Results</h2>
      <div class="text-secondary-lg">
        <p><strong>The audiogram</strong> shows your hearing thresholds - the quietest sounds you can hear at each frequency. Lower values (toward the top) mean better hearing.</p>
        ${profile.age ? `
          <p class="mt-md"><strong>Age comparison</strong>: The yellow area shows the typical range for people your age. If your results are within or above this area, your hearing is normal for your age.</p>
        ` : `
          <p class="mt-md"><strong>Normal hearing</strong> is generally considered to be thresholds of 20 dB HL or better, though this varies by frequency and age.</p>
        `}
        <p class="mt-md"><strong>Symbols:</strong> <span aria-hidden="true">◯</span> Circle = Right ear (red) · <span aria-hidden="true">✕</span> X = Left ear (teal)</p>
      </div>
      <div class="disclaimer" role="alert"><span aria-hidden="true">⚠️</span> Remember: This is a self-assessment for curiosity only. Consult an audiologist for professional evaluation.</div>
    </section>
  `;
}

/**
 * Handle PDF export button click
 */
async function handleExportPDF(profile: HearingProfile): Promise<void> {
  if (!currentAudiogram) {
    console.error('Audiogram not available for export');
    return;
  }
  
  const button = document.getElementById('export-pdf');
  if (button) {
    button.setAttribute('disabled', 'true');
    button.innerHTML = '<span aria-hidden="true">⏳</span> Exporting...';
  }
  
  try {
    const audiogramDataUrl = currentAudiogram.toDataURL();
    await exportToPDF(profile, audiogramDataUrl);
    announce('PDF exported successfully. Check your downloads folder.');
  } catch (error) {
    console.error('PDF export failed:', error);
    announce('PDF export failed. Please try again.');
  } finally {
    if (button) {
      button.removeAttribute('disabled');
      button.innerHTML = '<span aria-hidden="true">📄</span> Export PDF';
    }
  }
}

/**
 * Generate accessible text description of audiogram data for screen readers
 */
function generateAudiogramDescription(profile: HearingProfile): string {
  const lines: string[] = ['Audiogram results:'];
  
  profile.thresholds.forEach(t => {
    const parts: string[] = [];
    if (t.rightEar !== null) parts.push(`Right ear: ${t.rightEar} decibels`);
    if (t.leftEar !== null) parts.push(`Left ear: ${t.leftEar} decibels`);
    if (parts.length) {
      lines.push(`At ${formatFrequency(t.frequency, 'spoken')}: ${parts.join(', ')}.`);
    }
  });
  
  return lines.join(' ');
}

