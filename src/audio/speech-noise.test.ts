import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installAudioContext } from '../test/web-audio';
import {
  SNR_LEVELS,
  SNRLevel,
  SPEECH_LEVEL_DBFS,
  WORD_LISTS,
  advanceTrial,
  calculateSNR50,
  createEmptyResults,
  getRandomWord,
  interpretSNR50,
  noiseLevelDbfsForSNR,
} from './speech-noise';

interface MockBuffer {
  numberOfChannels: number;
  length: number;
  getChannelData: (c: number) => Float32Array;
}

interface MockSource {
  loop: boolean;
  buffer: MockBuffer | null;
  started: boolean;
  stopped: boolean;
  onended: (() => void) | null;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

function installMockAudioContext() {
  const sources: MockSource[] = [];
  const gains: { gain: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> } }[] = [];
  const createBuffer = vi.fn((channels: number, length: number): MockBuffer => {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { numberOfChannels: channels, length, getChannelData: (c: number) => data[c] };
  });
  // Every decoded word is a constant 0.1 signal: RMS 0.1, i.e. -20 dBFS
  const decodeAudioData = vi.fn(async () => {
    const buffer = createBuffer(1, 50);
    buffer.getChannelData(0).fill(0.1);
    return buffer;
  });

  installAudioContext({
    sampleRate: 100,
    createBuffer,
    decodeAudioData,
    createBufferSource: () => {
      const source: MockSource = {
        loop: false,
        buffer: null,
        started: false,
        stopped: false,
        onended: null,
        connect: vi.fn((node) => node),
        disconnect: vi.fn(),
        start: vi.fn(() => { source.started = true; }),
        stop: vi.fn(() => { source.stopped = true; source.onended?.(); }),
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
  return { sources, gains, createBuffer, decodeAudioData, live };
}

function stubFetch() {
  const fetchMock = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function rms(buffer: MockBuffer): number {
  let sum = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    for (const x of buffer.getChannelData(c)) sum += x * x;
  }
  return Math.sqrt(sum / (buffer.numberOfChannels * buffer.length));
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

    await startNoise(noiseLevelDbfsForSNR(10));
    setNoiseLevel(noiseLevelDbfsForSNR(-10));

    expect(mock.sources).toHaveLength(1);
    const noiseRms = rms(mock.sources[0].buffer!);
    const expected = Math.pow(10, (SPEECH_LEVEL_DBFS + 10) / 20) / noiseRms;
    expect(mock.gains[0].gain.setTargetAtTime).toHaveBeenCalledWith(expected, 0, expect.any(Number));
    stopNoise();
  });

  it.each([5, 0, -5] as const)('plays speech and noise %s dB apart in RMS', async (snr) => {
    const mock = installMockAudioContext();
    stubFetch();
    const { startNoise, speakWord, stopNoise, stopSpeech } = await import('./speech-noise');

    await startNoise(noiseLevelDbfsForSNR(snr));
    const spoken = speakWord('one');
    await vi.waitFor(() => expect(mock.sources).toHaveLength(2));

    const [noise, speech] = mock.sources;
    const noiseOut = rms(noise.buffer!) * mock.gains[0].gain.value;
    const speechOut = rms(speech.buffer!) * mock.gains[1].gain.value;
    expect(20 * Math.log10(speechOut / noiseOut)).toBeCloseTo(snr, 6);
    expect(20 * Math.log10(speechOut)).toBeCloseTo(SPEECH_LEVEL_DBFS, 6);

    stopSpeech();
    await spoken;
    stopNoise();
  });
});

describe('speakWord', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('fetches the clip under the app base URL', async () => {
    installMockAudioContext();
    const fetchMock = stubFetch();
    vi.stubEnv('BASE_URL', '/yourear/');
    const { speakWord, stopSpeech } = await import('./speech-noise');

    const spoken = speakWord('seven');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/yourear/speech/seven.mp3'));
    stopSpeech();
    await spoken;
    vi.unstubAllEnvs();
  });

  it('fetches and decodes each clip once, then plays it from the cache', async () => {
    const mock = installMockAudioContext();
    const fetchMock = stubFetch();
    const { speakWord } = await import('./speech-noise');

    for (let i = 0; i < 2; i++) {
      const spoken = speakWord('red');
      await vi.waitFor(() => expect(mock.live()).toHaveLength(1));
      mock.live()[0].onended?.();
      mock.live()[0].stopped = true;
      await spoken;
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mock.decodeAudioData).toHaveBeenCalledTimes(1);
    expect(mock.sources[0].buffer).toBe(mock.sources[1].buffer);
  });

  it('resolves when the word finishes playing', async () => {
    const mock = installMockAudioContext();
    stubFetch();
    const { speakWord } = await import('./speech-noise');

    let done = false;
    const spoken = speakWord('cat').then(() => { done = true; });
    await vi.waitFor(() => expect(mock.live()).toHaveLength(1));
    expect(done).toBe(false);

    mock.live()[0].onended?.();
    await spoken;
    expect(done).toBe(true);
  });

  it('stopSpeech stops the playing word and resolves it', async () => {
    const mock = installMockAudioContext();
    stubFetch();
    const { speakWord, stopSpeech } = await import('./speech-noise');

    const spoken = speakWord('dog');
    await vi.waitFor(() => expect(mock.live()).toHaveLength(1));

    stopSpeech();
    await spoken;
    expect(mock.live()).toHaveLength(0);
  });

  it('plays nothing if stopSpeech is called while the clip is loading', async () => {
    const mock = installMockAudioContext();
    stubFetch();
    const { speakWord, stopSpeech } = await import('./speech-noise');

    const spoken = speakWord('pig');
    stopSpeech();
    await spoken;

    expect(mock.sources).toHaveLength(0);
  });

  it('stops the previous word when a new one starts', async () => {
    const mock = installMockAudioContext();
    stubFetch();
    const { speakWord, stopSpeech } = await import('./speech-noise');

    const first = speakWord('one');
    await vi.waitFor(() => expect(mock.live()).toHaveLength(1));
    const second = speakWord('one');
    await first;
    await vi.waitFor(() => expect(mock.sources).toHaveLength(2));

    expect(mock.live()).toEqual([mock.sources[1]]);
    stopSpeech();
    await second;
  });

  it('rejects when the clip cannot be fetched, and retries next time', async () => {
    const mock = installMockAudioContext();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
    vi.stubGlobal('fetch', fetchMock);
    const { speakWord, stopSpeech } = await import('./speech-noise');

    await expect(speakWord('two')).rejects.toThrow('404');

    const spoken = speakWord('two');
    await vi.waitFor(() => expect(mock.live()).toHaveLength(1));
    stopSpeech();
    await spoken;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('speech clips', () => {
  it('ships exactly one clip per word in WORD_LISTS', () => {
    const clips = Object.keys(import.meta.glob('../../public/speech/*.mp3'))
      .map(path => path.split('/').pop())
      .sort();
    const words = Object.values(WORD_LISTS).flat().map(w => `${w}.mp3`).sort();
    expect(clips).toEqual(words);
  });
});

describe('noiseLevelDbfsForSNR', () => {
  it('sets the noise RMS the SNR below the fixed speech level', () => {
    expect(noiseLevelDbfsForSNR(10)).toBe(SPEECH_LEVEL_DBFS - 10);
    expect(noiseLevelDbfsForSNR(0)).toBe(SPEECH_LEVEL_DBFS);
    expect(noiseLevelDbfsForSNR(-10)).toBe(SPEECH_LEVEL_DBFS + 10);
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
