import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { installAudioContext } from '../test/web-audio';

interface MockUtterance {
  text: string;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
}

function installMocks() {
  const sources: { started: boolean; stopped: boolean }[] = [];
  installAudioContext({
    sampleRate: 100,
    createBuffer: (channels: number, length: number) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { getChannelData: (c: number) => data[c] };
    },
    createBufferSource: () => {
      const source = {
        loop: false,
        buffer: null,
        started: false,
        stopped: false,
        connect: vi.fn((n) => n),
        disconnect: vi.fn(),
        start: vi.fn(() => { source.started = true; }),
        stop: vi.fn(() => { source.stopped = true; }),
      };
      sources.push(source);
      return source;
    },
    createGain() {
      return {
        gain: { value: 1, setTargetAtTime: vi.fn() },
        connect: vi.fn((n) => n),
        disconnect: vi.fn(),
        context: this,
      };
    },
  });

  const utterances: MockUtterance[] = [];
  vi.stubGlobal('SpeechSynthesisUtterance', class {
    onend: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    constructor(public text: string) {}
  });
  const speechSynthesisMock = {
    speak: vi.fn((u: MockUtterance) => { utterances.push(u); }),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
  };
  vi.stubGlobal('speechSynthesis', speechSynthesisMock);

  return { sources, utterances, speechSynthesis: speechSynthesisMock };
}

async function loadScreen() {
  const appState = await import('../state/app-state');
  const screen = await import('./speech-noise');
  // Mirror the router in main.ts: clean up when leaving, then render.
  appState.setRenderCallback(() => {
    if (appState.getState().screen !== 'speech-noise') {
      screen.cleanupSpeechNoiseScreen();
      document.getElementById('app')!.innerHTML = '<div id="home-screen">Home</div>';
    } else {
      screen.renderSpeechNoise();
    }
  });
  appState.navigateTo('speech-noise');
  return screen;
}

function click(id: string) {
  document.getElementById(id)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('speech-noise screen lifecycle', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="app"></div><div id="announcer" aria-live="polite"></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts exactly one noise source for a run', async () => {
    const mocks = installMocks();
    await loadScreen();

    click('start-test');
    await vi.advanceTimersByTimeAsync(600);

    expect(mocks.sources.filter(s => s.started && !s.stopped)).toHaveLength(1);
  });

  it('moves focus to the word choices when a response is needed', async () => {
    const mocks = installMocks();
    await loadScreen();

    click('start-test');
    await vi.advanceTimersByTimeAsync(600);
    mocks.utterances[0].onend?.();
    await vi.advanceTimersByTimeAsync(400);

    expect(document.activeElement?.classList.contains('speech-option')).toBe(true);
  });

  it('keeps the word options and focus in place between trials', async () => {
    const mocks = installMocks();
    await loadScreen();

    click('start-test');
    await vi.advanceTimersByTimeAsync(600);
    mocks.utterances[0].onend?.();
    await vi.advanceTimersByTimeAsync(400);

    const options = [...document.querySelectorAll<HTMLElement>('.speech-option')];
    options[1].focus();
    options[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // Listening phase for the next word: nothing may pull focus to the page top
    await vi.advanceTimersByTimeAsync(200);

    expect([...document.querySelectorAll('.speech-option')]).toEqual(options);
    expect(document.activeElement).toBe(options[1]);
    expect(options[1].getAttribute('aria-disabled')).toBe('true');
    expect(document.querySelectorAll('[aria-live], [role="alert"], [role="status"]')).toHaveLength(1);

    // A click while the next word plays is ignored rather than scored
    options[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(mocks.utterances).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(400);
    mocks.utterances[1].onend?.();
    await vi.advanceTimersByTimeAsync(400);

    expect(document.activeElement).toBe(options[1]);
    expect(options[1].getAttribute('aria-disabled')).toBe('false');
    expect(document.getElementById('announcer')!.textContent).toBe('What word did you hear? Choose from the options.');
  });

  it('cancelling mid-trial leaves Home rendered, cancels speech and stops noise', async () => {
    const mocks = installMocks();
    await loadScreen();

    click('start-test');
    await vi.advanceTimersByTimeAsync(600);
    expect(mocks.utterances).toHaveLength(1);

    click('cancel-test');
    expect(document.getElementById('home-screen')).not.toBeNull();
    expect(mocks.speechSynthesis.cancel).toHaveBeenCalled();

    // The in-flight word finishes after cancel; nothing may render over Home.
    mocks.utterances[0].onend?.();
    await vi.advanceTimersByTimeAsync(1000);

    expect(document.getElementById('home-screen')).not.toBeNull();
    expect(document.getElementById('main-content')).toBeNull();
    expect(mocks.sources.filter(s => s.started && !s.stopped)).toHaveLength(0);
  });
});
