import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installAudioContext } from '../test/web-audio';
import {
  SNR_LEVELS,
  SNRLevel,
  WORD_LISTS,
  advanceTrial,
  calculateSNR50,
  createEmptyResults,
  getRandomWord,
  interpretSNR50,
  noiseLevelDbForSNR,
} from './speech-noise';

interface MockSource {
  loop: boolean;
  buffer: unknown;
  started: boolean;
  stopped: boolean;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

function installMockAudioContext() {
  const sources: MockSource[] = [];
  const gains: { gain: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> } }[] = [];
  const createBuffer = vi.fn((channels: number, length: number) => {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData: (c: number) => data[c] };
  });

  installAudioContext({
    sampleRate: 100,
    createBuffer,
    createBufferSource: () => {
      const source: MockSource = {
        loop: false,
        buffer: null,
        started: false,
        stopped: false,
        connect: vi.fn((node) => node),
        disconnect: vi.fn(),
        start: vi.fn(() => { source.started = true; }),
        stop: vi.fn(() => { source.stopped = true; }),
      };
      sources.push(source);
      return source;
    },
    // Method shorthand so `this` is the context, which setNoiseLevel reads the time from
    createGain() {
      const node = {
        gain: { value: 1, setTargetAtTime: vi.fn() },
        connect: vi.fn((n) => n),
        disconnect: vi.fn(),
        context: this,
      };
      gains.push(node);
      return node;
    },
  });

  const live = () => sources.filter(s => s.started && !s.stopped);
  return { sources, gains, createBuffer, live };
}

function results(entries: [SNRLevel, number, number][]) {
  const map = createEmptyResults();
  for (const [snr, correct, total] of entries) map.set(snr, { correct, total });
  return map;
}

describe('speech-noise audio', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('leaves exactly one live looping source when startNoise is called twice in the same tick', async () => {
    const mock = installMockAudioContext();
    const { startNoise, stopNoise } = await import('./speech-noise');

    await Promise.all([startNoise(0), startNoise(-5)]);

    expect(mock.live()).toHaveLength(1);
    expect(mock.live()[0].loop).toBe(true);

    stopNoise();
    expect(mock.live()).toHaveLength(0);
  });

  it('starts nothing if stopNoise is called while startNoise is pending', async () => {
    const mock = installMockAudioContext();
    const { startNoise, stopNoise } = await import('./speech-noise');

    const pending = startNoise(0);
    stopNoise();
    await pending;

    expect(mock.live()).toHaveLength(0);
  });

  it('builds the pink-noise buffer once and reuses it across runs', async () => {
    const mock = installMockAudioContext();
    const { startNoise, stopNoise } = await import('./speech-noise');

    await startNoise(0);
    stopNoise();
    await startNoise(-5);
    stopNoise();

    expect(mock.createBuffer).toHaveBeenCalledTimes(1);
    expect(mock.sources[0].buffer).toBe(mock.sources[1].buffer);
  });

  it('changes the noise level with a gain ramp instead of a new source', async () => {
    const mock = installMockAudioContext();
    const { startNoise, setNoiseLevel, stopNoise } = await import('./speech-noise');

    await startNoise(noiseLevelDbForSNR(10));
    setNoiseLevel(noiseLevelDbForSNR(-10));

    expect(mock.sources).toHaveLength(1);
    const expected = Math.pow(10, (10 - 30) / 20);
    expect(mock.gains[0].gain.setTargetAtTime).toHaveBeenCalledWith(expected, 0, expect.any(Number));
    stopNoise();
  });
});

describe('noiseLevelDbForSNR', () => {
  it('raises the noise as the SNR falls', () => {
    expect(noiseLevelDbForSNR(10)).toBe(-10);
    expect(noiseLevelDbForSNR(0)).toBe(0);
    expect(noiseLevelDbForSNR(-10)).toBe(10);
  });
});

describe('advanceTrial', () => {
  const start = { currentSNR: SNR_LEVELS[0] as SNRLevel, currentTrial: 0, results: createEmptyResults() };

  it('records a correct answer and stays on the same SNR', () => {
    const next = advanceTrial(start, true, 4);
    expect(next.results.get(10)).toEqual({ correct: 1, total: 1 });
    expect(next).toMatchObject({ currentSNR: 10, currentTrial: 1, done: false });
  });

  it('does not mutate the input progress', () => {
    advanceTrial(start, true, 4);
    expect(start.results.get(10)).toEqual({ correct: 0, total: 0 });
    expect(start.currentTrial).toBe(0);
  });

  it('moves to the next SNR after the last trial of a level', () => {
    const next = advanceTrial({ ...start, currentTrial: 3 }, false, 4);
    expect(next.results.get(10)).toEqual({ correct: 0, total: 1 });
    expect(next).toMatchObject({ currentSNR: 5, currentTrial: 0, done: false });
  });

  it('finishes after the last trial of the last SNR', () => {
    const next = advanceTrial({ ...start, currentSNR: -10, currentTrial: 3 }, true, 4);
    expect(next.done).toBe(true);
    expect(next.currentSNR).toBe(-10);
  });

  it('completes a full run in SNR_LEVELS.length * trialsPerSNR responses', () => {
    let progress = { ...start, done: false };
    let count = 0;
    while (!progress.done) {
      progress = advanceTrial(progress, true, 2);
      count++;
    }
    expect(count).toBe(SNR_LEVELS.length * 2);
    SNR_LEVELS.forEach(snr => expect(progress.results.get(snr)).toEqual({ correct: 2, total: 2 }));
  });
});

describe('calculateSNR50', () => {
  it('returns null with fewer than two tested levels', () => {
    expect(calculateSNR50(results([[10, 4, 4]]))).toBeNull();
  });

  it('interpolates the 50% crossing between two levels', () => {
    // 100% at 0 dB, 0% at -5 dB -> 50% at -2.5 dB
    expect(calculateSNR50(results([[10, 4, 4], [5, 4, 4], [0, 4, 4], [-5, 0, 4], [-10, 0, 4]]))).toBeCloseTo(-2.5);
  });

  it('returns 5 dB below the hardest level when always above 50%', () => {
    expect(calculateSNR50(results([[10, 4, 4], [5, 4, 4], [0, 4, 4], [-5, 4, 4], [-10, 3, 4]]))).toBe(-15);
  });

  it('returns 5 dB above the easiest level when always below 50%', () => {
    expect(calculateSNR50(results([[10, 1, 4], [5, 0, 4]]))).toBe(15);
  });
});

describe('interpretSNR50', () => {
  it.each([
    [-8, 'Excellent'],
    [-5, 'Excellent'],
    [-2, 'Good'],
    [3, 'Average'],
    [8, 'Below Average'],
    [12, 'Difficulty'],
  ])('grades %s dB as %s', (snr50, grade) => {
    expect(interpretSNR50(snr50).grade).toBe(grade);
  });
});

describe('getRandomWord', () => {
  it('returns a word from the requested list', () => {
    expect(WORD_LISTS.colors).toContain(getRandomWord('colors'));
  });

  it('never returns an excluded word while others remain', () => {
    const exclude = WORD_LISTS.numbers.slice(0, 9);
    for (let i = 0; i < 20; i++) {
      expect(getRandomWord('numbers', exclude)).toBe('ten');
    }
  });

  it('falls back to the full list when every word is excluded', () => {
    expect(WORD_LISTS.animals).toContain(getRandomWord('animals', [...WORD_LISTS.animals]));
  });
});
