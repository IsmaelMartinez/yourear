import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HearingProfile } from '../types';

// jsdom has no canvas; the audiogram only needs a 2D context that accepts calls.
function stubCanvas() {
  const ctx = new Proxy({}, { get: () => () => undefined, set: () => true });
  return vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
}

const profile: HearingProfile = {
  id: 'p1',
  name: 'Full Test',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  thresholds: [
    { frequency: 250, rightEar: 5, leftEar: 10 },
    { frequency: 1000, rightEar: 15, leftEar: 0 },
    { frequency: 4000, rightEar: 35, leftEar: null },
  ],
};

describe('results screen accessibility', () => {
  beforeEach(() => {
    vi.resetModules();
    stubCanvas();
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not hide the audiogram caption behind role="img"', async () => {
    const appState = await import('../state/app-state');
    const { renderResults } = await import('./results');
    appState.setState({ viewingProfile: profile, screen: 'results' });
    renderResults();

    const figure = document.getElementById('audiogram')!;
    expect(figure.getAttribute('role')).toBeNull();
    expect(figure.querySelector('figcaption')?.textContent?.trim()).not.toBe('');
  });

  it('lists every tested frequency with right and left values in a data table', async () => {
    const appState = await import('../state/app-state');
    const { renderResults } = await import('./results');
    appState.setState({ viewingProfile: profile, screen: 'results' });
    renderResults();

    const table = document.querySelector('#audiogram table')!;
    expect(table).not.toBeNull();
    const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent?.trim());
    expect(headers).toEqual(['Frequency', 'Right ear', 'Left ear']);

    const rows = [...table.querySelectorAll('tbody tr')].map(tr =>
      [...tr.querySelectorAll('th, td')].map(c => c.textContent?.trim()));
    expect(rows).toEqual([
      ['250 Hz', '5 dB HL', '10 dB HL'],
      ['1000 Hz', '15 dB HL', '0 dB HL'],
      ['4000 Hz', '35 dB HL', 'No response'],
    ]);
  });
});
