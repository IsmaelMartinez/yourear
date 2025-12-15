/**
 * Headphone Profile Selector Component
 * 
 * Allows users to select their headphone model for frequency response compensation.
 */

import { 
  getProfilesByBrand, 
  getSelectedProfile, 
  saveSelectedProfile, 
  HeadphoneProfile,
  loadSelectedProfileId,
} from '../audio/headphone-profiles';

/**
 * Render the headphone profile selector HTML
 */
export function renderHeadphoneSelector(): string {
  const profilesByBrand = getProfilesByBrand();
  const selectedId = loadSelectedProfileId();
  
  // Build options grouped by brand
  const options: string[] = ['<option value="">-- Select your headphones --</option>'];
  
  for (const [brand, profiles] of profilesByBrand) {
    options.push(`<optgroup label="${brand}">`);
    for (const profile of profiles) {
      const selected = profile.id === selectedId ? 'selected' : '';
      options.push(
        `<option value="${profile.id}" ${selected}>${profile.model} (${profile.type})</option>`
      );
    }
    options.push('</optgroup>');
  }
  
  const currentProfile = getSelectedProfile();
  const statusMessage = currentProfile 
    ? `Using ${currentProfile.brand} ${currentProfile.model} compensation`
    : 'No headphone selected - using default settings';
  
  return `
    <div class="headphone-selector">
      <label for="headphone-select" class="sr-only">Select your headphone model</label>
      <select id="headphone-select" class="speech-select" style="margin-bottom: var(--spacing-sm);">
        ${options.join('')}
      </select>
      <p id="headphone-status" style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">
        ${statusMessage}
      </p>
      ${currentProfile?.notes ? `
        <p style="color: var(--text-muted); font-size: 0.8rem; font-style: italic; text-align: center; margin-top: var(--spacing-xs);">
          ${currentProfile.notes}
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Bind event handler to the headphone selector
 * Call this after rendering the selector
 * 
 * @param onChangeCallback - Optional callback when selection changes
 */
export function bindHeadphoneSelector(onChangeCallback?: (profile: HeadphoneProfile | null) => void): void {
  const select = document.getElementById('headphone-select') as HTMLSelectElement;
  const status = document.getElementById('headphone-status');
  
  if (select) {
    select.addEventListener('change', () => {
      const profileId = select.value;
      
      if (profileId) {
        saveSelectedProfile(profileId);
        const profile = getSelectedProfile();
        
        if (status && profile) {
          status.textContent = `Using ${profile.brand} ${profile.model} compensation`;
        }
        
        onChangeCallback?.(profile);
      } else {
        // Clear selection
        saveSelectedProfile('');
        if (status) {
          status.textContent = 'No headphone selected - using default settings';
        }
        onChangeCallback?.(null);
      }
    });
  }
}

/**
 * Get a short summary of the current headphone compensation
 */
export function getHeadphoneCompensationSummary(): string {
  const profile = getSelectedProfile();
  
  if (!profile || profile.id === 'flat-reference') {
    return 'No headphone compensation applied';
  }
  
  return `${profile.brand} ${profile.model} compensation applied`;
}

