import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface FakeParam {
  value: number;
  setTargetAtTime: ReturnType<typeof vi.fn>;
  cancelScheduledValues: ReturnType<typeof vi.fn>;
  setValueAtTime: ReturnType<typeof vi.fn>;
}

function fakeParam(value = 0): FakeParam {
  return {
    value,
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
  };
}

const oscillators: Array<{ start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; frequency: FakeParam }> = [];
const gains: Array<{ gain: FakeParam }> = [];

const fakeCtx = {
  currentTime: 0,
  destination: {},
  createOscillator: vi.fn(() => {
    const osc = {
      type: 'sine',
      frequency: fakeParam(440),
      connect: vi.fn((n: unknown) => n),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    oscillators.push(osc);
    return osc;
  }),
  createGain: vi.fn(() => {
    const g = { gain: fakeParam(1), connect: vi.fn((n: unknown) => n), disconnect: vi.fn() };
    gains.push(g);
    return g;
  }),
};

vi.mock('./audio-context', () => ({
  ensureRunning: vi.fn(async () => fakeCtx),
}));

import {
  startTinnitusTone,
  stopTinnitusTone,
  setTinnitusFrequency,
  setTinnitusVolume,
  getTinnitusSettings,
  resetTinnitusSettings,
} from './tinnitus-tone';

describe('tinnitus-tone', () => {
  beforeEach(() => {
    resetTinnitusSettings();
    oscillators.length = 0;
    gains.length = 0;
    fakeCtx.createOscillator.mockClear();
  });

  afterEach(() => {
    stopTinnitusTone();
  });

  it('clamps frequency to 100–12000 Hz', () => {
    setTinnitusFrequency(50);
    expect(getTinnitusSettings().frequency).toBe(100);
    setTinnitusFrequency(20000);
    expect(getTinnitusSettings().frequency).toBe(12000);
  });

  it('clamps volume to 0–60 dB', () => {
    setTinnitusVolume(-10);
    expect(getTinnitusSettings().volume).toBe(0);
    setTinnitusVolume(100);
    expect(getTinnitusSettings().volume).toBe(60);
  });

  it('start is idempotent', async () => {
    await startTinnitusTone();
    await startTinnitusTone();
    expect(fakeCtx.createOscillator).toHaveBeenCalledTimes(1);
    expect(getTinnitusSettings().isPlaying).toBe(true);
  });

  it('fades in on start and ramps volume changes with setTargetAtTime', async () => {
    await startTinnitusTone();
    const gain = gains[0].gain;
    expect(gain.value).toBe(0);
    expect(gain.setTargetAtTime).toHaveBeenCalledTimes(1);

    const before = gain.value;
    setTinnitusVolume(50);
    expect(gain.value).toBe(before);
    expect(gain.setTargetAtTime).toHaveBeenCalledTimes(2);
  });

  it('fades out on stop and reports not playing', async () => {
    await startTinnitusTone();
    const gain = gains[0].gain;
    const osc = oscillators[0];
    stopTinnitusTone();
    expect(gain.setTargetAtTime).toHaveBeenLastCalledWith(0, expect.any(Number), expect.any(Number));
    expect(osc.stop).toHaveBeenCalledWith(expect.any(Number));
    expect(getTinnitusSettings().isPlaying).toBe(false);
  });

  it('reset stops playback and restores defaults', async () => {
    setTinnitusFrequency(1000);
    setTinnitusVolume(10);
    await startTinnitusTone();
    resetTinnitusSettings();
    expect(getTinnitusSettings()).toEqual({ frequency: 4000, volume: 30, isPlaying: false });
  });
});
