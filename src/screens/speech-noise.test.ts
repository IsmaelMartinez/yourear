import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface MockUtterance {
  text: string;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
}

function installMocks() {
  const sources: { started: boolean; stopped: boolean }[] = [];
  globalThis.AudioContext = class {
    state = 'running' as AudioContextState;
    sampleRate = 100;
    currentTime = 0;
    destination = {};
    createBuffer = vi.fn((channels: number, length: number) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { getChannelData: (c: number) => data[c] };
    });
    createBufferSource = vi.fn(() => {
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
    });
    createGain = vi.fn(() => ({
      gain: { value: 1, setTargetAtTime: vi.fn() },
      connect: vi.fn((n) => n),
      disconnect: vi.fn(),
      context: this,
    }));
  } as unknown as typeof AudioContext;

  const utterances: MockUtterance[] = [];
  globalThis.SpeechSynthesisUtterance = class {
    onend: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    constructor(public text: string) {}
  } as unknown as typeof SpeechSynthesisUtterance;
  const speechSynthesisMock = {
    speak: vi.fn((u: MockUtterance) => { utterances.push(u); }),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
  };
  Object.defineProperty(window, 'speechSynthesis', { value: speechSynthesisMock, configurable: true });
  Object.defineProperty(globalThis, 'speechSynthesis', { value: speechSynthesisMock, configurable: true });

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
  let originalAudioContext: typeof globalThis.AudioContext;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    originalAudioContext = globalThis.AudioContext;
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.AudioContext = originalAudioContext;
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
