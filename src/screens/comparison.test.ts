import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HearingProfile } from '../types';

function stubCanvas() {
  const ctx = new Proxy({}, { get: () => () => undefined, set: () => true });
  return vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
}

const base = (name: string, date: string, right: number, left: number): Omit<HearingProfile, 'id'> => ({
  name,
  createdAt: new Date(date),
  updatedAt: new Date(date),
  thresholds: [
    { frequency: 500, rightEar: right, leftEar: left },
    { frequency: 2000, rightEar: right + 5, leftEar: left + 5 },
  ],
});

describe('comparison screen accessibility', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    stubCanvas();
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  async function load() {
    const { createProfile } = await import('../storage/profile');
    createProfile(base('Older', '2024-01-01', 10, 20));
    createProfile(base('Newer', '2024-06-01', 15, 25));
    createProfile(base('Newest', '2024-09-01', 30, 30));
    const { renderComparison } = await import('./comparison');
    renderComparison();
  }

  it('exposes each selected profile\'s thresholds in a labelled data table', async () => {
    await load();
    const figure = document.getElementById('comparison-audiogram')!;
    expect(figure.getAttribute('role')).toBeNull();

    const table = figure.querySelector('table')!;
    const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent?.trim());
    expect(headers[0]).toBe('Frequency');
    expect(headers.some(h => h?.includes('Newest') && h.includes('right ear'))).toBe(true);
    expect(headers.some(h => h?.includes('Newer') && h.includes('left ear'))).toBe(true);
    // Line style names let people tell series apart without colour.
    expect(headers.some(h => /solid|dashed|dotted/.test(h ?? ''))).toBe(true);

    const rows = [...table.querySelectorAll('tbody tr')].map(tr => tr.querySelector('th')?.textContent?.trim());
    expect(rows).toEqual(['500 Hz', '2000 Hz']);
  });

  it('keeps focus on the toggled checkbox after the view updates', async () => {
    await load();
    await vi.advanceTimersByTimeAsync(200); // let the initial focusMain() settle
    const boxes = () => [...document.querySelectorAll<HTMLInputElement>('.profile-checkbox input')];
    const third = boxes()[2];
    third.focus();
    third.checked = true;
    third.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(200);

    const active = document.activeElement as HTMLElement;
    expect(active.tagName).toBe('INPUT');
    expect(active.closest('.profile-checkbox')?.getAttribute('data-id'))
      .toBe(third.closest('.profile-checkbox')?.getAttribute('data-id'));
  });
});
