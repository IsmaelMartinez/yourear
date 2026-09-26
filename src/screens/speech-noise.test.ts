import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { installAudioContext } from '../test/web-audio';

interface MockSource {
  loop: boolean;
  started: boolean;
  stopped: boolean;
  onended: (() => void) | null;
}

function createBuffer(channels: number, length: number) {
  const data = Array.from({ length: channels }, () => new Float32Array(length).fill(0.1));
  return { numberOfChannels: channels, length, getChannelData: (c: number) => data[c] };
}

function installMocks() {
  const sources: MockSource[] = [];
  installAudioContext({
    sampleRate: 100,
    createBuffer,
    decodeAudioData: async () => createBuffer(1, 50),
    createBufferSource: () => {
      const source = {
        loop: false,
        buffer: null,
        started: false,
        stopped: false,
        onended: null as (() => void) | null,
        connect: vi.fn((n) => n),
        disconnect: vi.fn(),
        start: vi.fn(() => { source.started = true; }),
        stop: vi.fn(() => { source.stopped = true; source.onended?.(); }),
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

  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));

  const live = () => sources.filter(s => s.started && !s.stopped);
  const words = () => live().filter(s => !s.loop);
  return { sources, live, words };
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
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts exactly one noise source for a run', async () => {
    const mocks = installMocks();
    await loadScreen();

    click('start-test');
    await vi.advanceTimersByTimeAsync(600);

    expect(mocks.live().filter(s => s.loop)).toHaveLength(1);
  });

  it('moves focus to the word choices when a response is needed', async () => {
    const mocks = installMocks();
    await loadScreen();

    click('start-test');
    await vi.advanceTimersByTimeAsync(600);
    mocks.words()[0].onended?.();
    await vi.advanceTimersByTimeAsync(400);

    expect(document.activeElement?.classList.contains('speech-option')).toBe(true);
  });

  it('cancelling mid-trial leaves Home rendered and stops the word and the noise', async () => {
    const mocks = installMocks();
    await loadScreen();

    click('start-test');
    await vi.advanceTimersByTimeAsync(600);
    expect(mocks.words()).toHaveLength(1);

    click('cancel-test');
    expect(document.getElementById('home-screen')).not.toBeNull();
    expect(mocks.live()).toHaveLength(0);

    // The stopped word ends after cancel; nothing may render over Home.
    await vi.advanceTimersByTimeAsync(1000);

    expect(document.getElementById('home-screen')).not.toBeNull();
    expect(document.getElementById('main-content')).toBeNull();
  });

  it('ends the run with an error instead of asking for a word that never played', async () => {
    const mocks = installMocks();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    await loadScreen();

    click('start-test');
    await vi.advanceTimersByTimeAsync(1000);

    expect(document.querySelector('.speech-option')).toBeNull();
    expect(document.getElementById('start-test')).not.toBeNull();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Could not play the test word');
    expect(mocks.live()).toHaveLength(0);
    consoleError.mockRestore();
  });
});
