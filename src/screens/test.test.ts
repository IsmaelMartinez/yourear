import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TestState } from '../types';

function createFakeTest() {
  const state: TestState = {
    currentFrequency: 1000,
    currentEar: 'right',
    currentLevel: 40,
    isPlaying: false,
    responses: new Map(),
    phase: 'testing',
  };
  return {
    state,
    getState: () => ({ ...state }),
    getProgress: () => 10,
    respondHeard: vi.fn(),
    respondNotHeard: vi.fn(),
  };
}

async function loadScreen() {
  const appState = await import('../state/app-state');
  const screen = await import('./test');
  const fake = createFakeTest();
  appState.setRenderCallback(() => {
    if (appState.getState().screen === 'test') screen.renderTest();
    else screen.cleanupTestScreen();
  });
  appState.setState({ hearingTest: fake as never, screen: 'test' });
  return { appState, screen, fake };
}

function keydown(target: EventTarget, code: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('test screen keyboard and focus', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="announcer" aria-live="polite"></div><div id="app"></div>';
  });

  afterEach(async () => {
    const screen = await import('./test');
    screen.cleanupTestScreen();
    vi.useRealTimers();
  });

  it('lets Enter on a focused "No" button run its own click instead of recording heard', async () => {
    const { fake } = await loadScreen();
    const no = document.getElementById('not-heard')!;
    no.focus();

    const event = keydown(no, 'Enter');
    expect(event.defaultPrevented).toBe(false);
    expect(fake.respondHeard).not.toHaveBeenCalled();

    // The browser turns an unprevented Enter on a button into a click.
    no.click();
    expect(fake.respondNotHeard).toHaveBeenCalledTimes(1);
    expect(fake.respondHeard).not.toHaveBeenCalled();
  });

  it('does not hijack Space or Enter on the Stop button', async () => {
    const { fake } = await loadScreen();
    const stop = document.getElementById('stop-test')!;
    expect(keydown(stop, 'Space').defaultPrevented).toBe(false);
    expect(keydown(stop, 'Enter').defaultPrevented).toBe(false);
    expect(fake.respondHeard).not.toHaveBeenCalled();
  });

  it('records heard for Space when focus is not on a control', async () => {
    const { fake } = await loadScreen();
    const event = keydown(document.body, 'Space');
    expect(event.defaultPrevented).toBe(true);
    expect(fake.respondHeard).toHaveBeenCalledTimes(1);
  });

  it('keeps the N shortcut for not heard', async () => {
    const { fake } = await loadScreen();
    keydown(document.body, 'KeyN');
    expect(fake.respondNotHeard).toHaveBeenCalledTimes(1);
  });

  it('ignores auto-repeated key events', async () => {
    const { fake } = await loadScreen();
    keydown(document.body, 'Space', { repeat: true });
    keydown(document.body, 'KeyN', { repeat: true });
    expect(fake.respondHeard).not.toHaveBeenCalled();
    expect(fake.respondNotHeard).not.toHaveBeenCalled();
  });

  it('keeps focus on the same response button across state updates', async () => {
    const { appState, fake } = await loadScreen();
    const no = document.getElementById('not-heard')!;
    no.focus();

    fake.state.isPlaying = true;
    appState.rerender();
    fake.state.isPlaying = false;
    fake.state.currentFrequency = 2000;
    fake.state.currentEar = 'left';
    appState.rerender();
    await vi.advanceTimersByTimeAsync(500);

    expect(document.getElementById('not-heard')).toBe(no);
    expect(document.activeElement).toBe(no);
    expect(document.querySelector('.test-display__frequency')?.textContent).toContain('2');
    expect(document.querySelector('.test-display__ear')?.textContent).toContain('Left');
  });

  it('uses a single persistent live region across updates', async () => {
    const { appState, fake } = await loadScreen();
    const regions = () => document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
    expect(regions()).toHaveLength(1);

    fake.state.isPlaying = true;
    appState.rerender();
    expect(regions()).toHaveLength(1);
    expect(document.getElementById('announcer')?.textContent).toMatch(/listen/i);

    fake.state.isPlaying = false;
    appState.rerender();
    expect(regions()).toHaveLength(1);
    expect(document.getElementById('announcer')?.textContent).toMatch(/did you hear/i);
  });

  it('ignores response clicks while the tone is playing', async () => {
    const { appState, fake } = await loadScreen();
    fake.state.isPlaying = true;
    appState.rerender();
    const yes = document.getElementById('heard')!;
    expect(yes.getAttribute('aria-disabled')).toBe('true');
    yes.click();
    keydown(document.body, 'Space');
    expect(fake.respondHeard).not.toHaveBeenCalled();
  });
});
