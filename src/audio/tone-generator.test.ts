import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installAudioContext } from '../test/web-audio';
import type { ToneOptions } from './tone-generator';

// AudioInitError is covered in audio-context.test.ts, where it is defined

/** Let playTone get past ensureRunning() and build its audio graph */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

function createNodes() {
  const oscillator = {
    type: 'square' as OscillatorType,
    frequency: { value: 0 },
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
    onended: null as (() => void) | null,
  };
  const gain = {
    gain: {
      value: 0.5,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };
  const panner = {
    pan: { value: 0 },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };
  return { oscillator, gain, panner };
}

const tone: ToneOptions = { frequency: 1000, level: 40, duration: 2000, channel: 'right' };

describe('tone-generator', () => {
  // Each tone gets fresh nodes so tests can tell tones apart
  let created: ReturnType<typeof createNodes>[];
  const latest = () => created[created.length - 1];
  const audioGraph = {
    currentTime: 10,
    createOscillator: () => {
      created.push(createNodes());
      return latest().oscillator;
    },
    createGain: () => latest().gain,
    createStereoPanner: () => latest().panner,
  };
  let constructed: ReturnType<typeof installAudioContext>;

  beforeEach(() => {
    vi.resetModules();
    created = [];
    constructed = installAudioContext(audioGraph);
  });

  /** Start a tone and wait until its nodes exist */
  async function startTone(options: Partial<ToneOptions> = {}) {
    const { playTone } = await import('./tone-generator');
    const done = playTone({ ...tone, ...options });
    await settle();
    return { done, nodes: latest() };
  }

  describe('playTone', () => {
    it('creates the shared AudioContext on the first call', async () => {
      const { done, nodes } = await startTone();

      expect(constructed).toHaveBeenCalledOnce();
      nodes.oscillator.onended?.();
      await done;
    });

    it('plays a sine wave at the requested frequency', async () => {
      const { done, nodes } = await startTone({ frequency: 4000 });

      expect(nodes.oscillator.type).toBe('sine');
      expect(nodes.oscillator.frequency.value).toBe(4000);
      nodes.oscillator.onended?.();
      await done;
    });

    it.each([
      ['right', 1],
      ['left', -1],
      ['both', 0],
    ] as const)('pans the %s channel to %s', async (channel, pan) => {
      const { done, nodes } = await startTone({ channel });

      expect(nodes.panner.pan.value).toBe(pan);
      nodes.oscillator.onended?.();
      await done;
    });

    it('fades in and out over 20 ms around the tone duration', async () => {
      const { done, nodes } = await startTone({ duration: 1000 });
      const { setValueAtTime, linearRampToValueAtTime } = nodes.gain.gain;
      const target = linearRampToValueAtTime.mock.calls[0][0];

      expect(setValueAtTime.mock.calls).toEqual([[0, 10], [target, expect.closeTo(10.98, 6)]]);
      expect(linearRampToValueAtTime.mock.calls).toEqual([[target, expect.closeTo(10.02, 6)], [0, 11]]);
      expect(nodes.oscillator.start).toHaveBeenCalledWith(10);
      nodes.oscillator.onended?.();
      await done;
    });

    it('ramp targets strictly increase from minLevel to maxLevel', async () => {
      const { DEFAULT_TEST_CONFIG } = await import('../types');
      const { minLevel, maxLevel, stepUp } = DEFAULT_TEST_CONFIG;

      const targets: number[] = [];
      for (let level = minLevel; level <= maxLevel; level += stepUp) {
        const { done, nodes } = await startTone({ level });
        // First ramp is the fade-in to the target gain
        targets.push(nodes.gain.gain.linearRampToValueAtTime.mock.calls[0][0]);
        nodes.oscillator.onended?.();
        await done;
      }

      for (let i = 1; i < targets.length; i++) {
        expect(targets[i]).toBeGreaterThan(targets[i - 1]);
      }
      // maxLevel reaches full scale without exceeding it
      expect(targets[targets.length - 1]).toBeCloseTo(1, 6);
    });
  });

  describe('tone lifecycle', () => {
    it('a stale onended from the previous tone does not disconnect the next tone', async () => {
      const first = await startTone();
      const second = await startTone({ channel: 'left' });
      expect(created).toHaveLength(2);

      // The first oscillator's ended event arrives asynchronously, after the second tone started
      first.nodes.oscillator.onended?.();
      await first.done;

      expect(first.nodes.oscillator.disconnect).toHaveBeenCalled();
      expect(second.nodes.oscillator.disconnect).not.toHaveBeenCalled();
      expect(second.nodes.gain.disconnect).not.toHaveBeenCalled();
      expect(second.nodes.panner.disconnect).not.toHaveBeenCalled();

      second.nodes.oscillator.onended?.();
      await second.done;
      expect(second.nodes.oscillator.disconnect).toHaveBeenCalled();
    });

    it('stopTone while the audio context is resuming prevents the pending tone from starting', async () => {
      let finishResume!: () => void;
      const resume = vi.fn(() => new Promise<void>(resolve => { finishResume = resolve; }));
      installAudioContext({ ...audioGraph, state: 'suspended', resume });
      const { playTone, stopTone } = await import('./tone-generator');

      const done = playTone(tone);
      expect(resume).toHaveBeenCalled();
      stopTone();
      finishResume();
      await done;

      expect(created).toHaveLength(0);
    });

    it('stopTone ramps the gain to 0 before stopping the oscillator', async () => {
      const { done, nodes: { oscillator, gain } } = await startTone();
      const { stopTone } = await import('./tone-generator');
      gain.gain.linearRampToValueAtTime.mockClear();
      oscillator.stop.mockClear();

      stopTone();

      expect(gain.gain.cancelScheduledValues).toHaveBeenCalledWith(10);
      expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledTimes(1);
      const [rampValue, rampEnd] = gain.gain.linearRampToValueAtTime.mock.calls[0];
      expect(rampValue).toBe(0);
      expect(rampEnd).toBeGreaterThan(10);
      expect(oscillator.stop).toHaveBeenCalledTimes(1);
      expect(oscillator.stop.mock.calls[0][0]).toBeGreaterThanOrEqual(rampEnd);

      oscillator.onended?.();
      await done;
    });

    it('playCalibrationTone plays a 2 s, 1 kHz tone at 40 dB HL in one ear', async () => {
      const { playCalibrationTone } = await import('./tone-generator');

      const done = playCalibrationTone('left');
      await settle();
      const { oscillator, panner } = latest();

      expect(oscillator.frequency.value).toBe(1000);
      expect(panner.pan.value).toBe(-1);
      expect(oscillator.stop).toHaveBeenCalledWith(12.1);
      oscillator.onended?.();
      await done;
    });
  });
});
