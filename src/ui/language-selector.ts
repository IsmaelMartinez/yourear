/**
 * Language Selector Component
 * 
 * Dropdown to select the application language
 */

import { AVAILABLE_LOCALES, getLocale, setLocale, SupportedLocale } from '../i18n';

/**
 * Render the language selector HTML
 */
export function renderLanguageSelector(): string {
  const currentLocale = getLocale();
  
  const options = AVAILABLE_LOCALES.map(locale => 
    `<option value="${locale.code}" ${locale.code === currentLocale ? 'selected' : ''}>
      ${locale.nativeName}
    </option>`
  ).join('');
  
  return `
    <div class="language-selector" role="region" aria-label="Language selection">
      <label for="language-select" class="sr-only">Select language</label>
      <select id="language-select" class="language-select" aria-label="Select language">
        ${options}
      </select>
    </div>
  `;
}

/**
 * Bind event handler to the language selector
 * Call this after rendering the selector
 */
export function bindLanguageSelector(): void {
  const select = document.getElementById('language-select') as HTMLSelectElement;
  if (select) {
    select.addEventListener('change', () => {
      const newLocale = select.value as SupportedLocale;
      setLocale(newLocale);
    });
  }
}

