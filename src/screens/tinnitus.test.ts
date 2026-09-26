import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function fakeParam() {
  return { value: 0, setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn() };
}

vi.mock('../audio/audio-context', () => ({
  ensureRunning: vi.fn(async () => ({
    currentTime: 0,
    destination: {},
    createOscillator: () => ({
      type: 'sine',
      frequency: fakeParam(),
      connect: (n: unknown) => n,
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createGain: () => ({ gain: fakeParam(), connect: (n: unknown) => n, disconnect: vi.fn() }),
  })),
}));

import { renderTinnitus, cleanupTinnitusScreen } from './tinnitus';
import { resetTinnitusSettings } from '../audio/tinnitus-tone';

function toggleButton(): HTMLButtonElement {
  return document.getElementById('toggle-tone') as HTMLButtonElement;
}

function slide(id: string, value: number): void {
  const slider = document.getElementById(id) as HTMLInputElement;
  slider.value = String(value);
  slider.dispatchEvent(new Event('input'));
}

describe('tinnitus screen', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    resetTinnitusSettings();
    renderTinnitus();
  });

  afterEach(() => {
    cleanupTinnitusScreen();
  });

  it('shows "Stop Tone" once the tone has started and "Play Tone" after stopping', async () => {
    expect(toggleButton().textContent).toContain('Play Tone');
    toggleButton().click();
    await vi.waitFor(() => expect(toggleButton().textContent).toContain('Stop Tone'));
    toggleButton().click();
    await vi.waitFor(() => expect(toggleButton().textContent).toContain('Play Tone'));
  });

  it('updates the match loudness live from the loudness slider', () => {
    slide('vol-slider', 45);
    expect(document.getElementById('match-volume')?.textContent).toBe('45 dB');
  });

  it('updates the match frequency and description live from the frequency slider', () => {
    slide('freq-slider', 300);
    expect(document.getElementById('match-frequency')?.textContent).toBe('300');
    expect(document.getElementById('match-description')?.textContent).toContain('Low-pitched');
  });
});
