import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function stubCanvas() {
  const ctx = new Proxy({}, { get: () => () => undefined, set: () => true });
  return vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
}

describe('home screen history', () => {
  beforeEach(() => {
    vi.resetModules();
    stubCanvas();
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('lists the newest five tests, newest first', async () => {
    const { createProfile } = await import('../storage/profile');
    // Saved out of date order so insertion order differs from createdAt order
    for (const month of [3, 1, 7, 5, 2, 6, 4]) {
      const date = new Date(2024, month - 1, 1);
      createProfile({ name: `Test ${month}`, createdAt: date, updatedAt: date, thresholds: [] });
    }
    const { renderHome } = await import('./home');
    renderHome();

    const names = [...document.querySelectorAll('.profile-item__name')].map(el => el.textContent);
    expect(names).toEqual(['Test 7', 'Test 6', 'Test 5', 'Test 4', 'Test 3']);
    expect(document.querySelector('#latest-result-title')?.textContent).toContain('Latest Result');
    expect(document.getElementById('compare-tests')).not.toBeNull();
  });
});
