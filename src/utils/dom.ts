/**
 * DOM utility helpers
 */

const announcer = document.getElementById('announcer');

/**
 * Screen reader announcement helper
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    // Clear after announcement
    setTimeout(() => { announcer.textContent = ''; }, 1000);
  }
}

/**
 * Focus management helper - moves focus to main content area
 */
export function focusMain(): void {
  setTimeout(() => {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
    }
  }, 100);
}

/**
 * Bind click event to an element by ID
 */
export function onClick(id: string, handler: () => void): void {
  document.getElementById(id)?.addEventListener('click', handler);
}

/**
 * Bind change event to an input element by ID
 */
export function onChange(id: string, handler: (value: string) => void): void {
  const element = document.getElementById(id) as HTMLInputElement | null;
  element?.addEventListener('change', () => handler(element.value));
}

/**
 * Get the app container element
 */
export function getAppContainer(): HTMLElement {
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('App container not found');
  }
  return app;
}

