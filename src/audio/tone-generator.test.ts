import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioInitError } from './tone-generator';

// For integration tests with mocked AudioContext, we need careful setup
// The module uses a singleton AudioContext, so we mock at the global level

describe('tone-generator', () => {
  describe('AudioInitError', () => {
    it('is an instance of Error', () => {
      const error = new AudioInitError('test message');
      expect(error).toBeInstanceOf(Error);
    });

    it('has correct name', () => {
      const error = new AudioInitError('test message');
      expect(error.name).toBe('AudioInitError');
    });

    it('preserves message', () => {
      const error = new AudioInitError('custom error message');
      expect(error.message).toBe('custom error message');
    });

    it('stores cause when provided', () => {
      const cause = new Error('original error');
      const error = new AudioInitError('wrapped error', cause);
      expect(error.cause).toBe(cause);
    });

    it('can be caught in try-catch', () => {
      const throwError = () => {
        throw new AudioInitError('audio init failed');
      };

      expect(throwError).toThrow(AudioInitError);
      expect(throwError).toThrow('audio init failed');
    });
  });

  describe('module exports', () => {
    it('exports playTone function', async () => {
      const module = await import('./tone-generator');
      expect(typeof module.playTone).toBe('function');
    });

    it('exports stopTone function', async () => {
      const module = await import('./tone-generator');
      expect(typeof module.stopTone).toBe('function');
    });

    it('exports playCalibrationTone function', async () => {
      const module = await import('./tone-generator');
      expect(typeof module.playCalibrationTone).toBe('function');
    });

    it('exports AudioInitError class', async () => {
      const module = await import('./tone-generator');
      expect(module.AudioInitError).toBeDefined();
      expect(new module.AudioInitError('test')).toBeInstanceOf(Error);
    });
  });

  describe('playTone with mocked AudioContext', () => {
    let mockOscillator: ReturnType<typeof createMockOscillator>;
    let mockGain: ReturnType<typeof createMockGain>;
    let mockPanner: ReturnType<typeof createMockPanner>;
    let mockAudioContext: ReturnType<typeof createMockAudioContext>;
    let originalAudioContext: typeof globalThis.AudioContext;

    function createMockOscillator() {
      const mock = {
        type: 'sine' as OscillatorType,
        frequency: { value: 0 },
        connect: vi.fn().mockReturnThis(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
        onended: null as (() => void) | null,
      };
      return mock;
    }

    function createMockGain() {
      return {
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          cancelScheduledValues: vi.fn(),
        },
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
      };
    }

    function createMockPanner() {
      return {
        pan: { value: 0 },
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
      };
    }

    function createMockAudioContext() {
      return {
        state: 'running' as AudioContextState,
        currentTime: 0,
        destination: {},
        createOscillator: vi.fn(() => mockOscillator),
        createGain: vi.fn(() => mockGain),
        createStereoPanner: vi.fn(() => mockPanner),
        resume: vi.fn().mockResolvedValue(undefined),
      };
    }

    beforeEach(() => {
      vi.resetModules();
      mockOscillator = createMockOscillator();
      mockGain = createMockGain();
      mockPanner = createMockPanner();
      mockAudioContext = createMockAudioContext();
      
      originalAudioContext = globalThis.AudioContext;
      // Use a class constructor for vitest v4 compatibility
      globalThis.AudioContext = class MockAudioContext {
        state = mockAudioContext.state;
        currentTime = mockAudioContext.currentTime;
        destination = mockAudioContext.destination;
        createOscillator = mockAudioContext.createOscillator;
        createGain = mockAudioContext.createGain;
        createStereoPanner = mockAudioContext.createStereoPanner;
        resume = mockAudioContext.resume;
      } as unknown as typeof AudioContext;
    });

    afterEach(() => {
      globalThis.AudioContext = originalAudioContext;
    });

    it('creates AudioContext on first playTone call', async () => {
      const { playTone } = await import('./tone-generator');
      
      // Start tone but don't wait - immediately trigger onended
      const promise = playTone({
        frequency: 1000,
        level: 40,
        duration: 100,
        channel: 'right',
      });
      
      // Give it a tick to set up and verify oscillator was created
      await vi.waitFor(() => {
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      }, { timeout: 100 });
      
      // Trigger end
      mockOscillator.onended?.();
      await promise;
    });

    it('sets oscillator frequency correctly', async () => {
      const { playTone } = await import('./tone-generator');
      
      const promise = playTone({
        frequency: 4000,
        level: 40,
        duration: 100,
        channel: 'right',
      });
      
      await vi.waitFor(() => {
        expect(mockOscillator.frequency.value).toBe(4000);
      }, { timeout: 100 });
      
      mockOscillator.onended?.();
      await promise;
    });

    it('pans to right ear when channel is right', async () => {
      const { playTone } = await import('./tone-generator');
      
      const promise = playTone({
        frequency: 1000,
        level: 40,
        duration: 100,
        channel: 'right',
      });
      
      await vi.waitFor(() => {
        expect(mockPanner.pan.value).toBe(1);
      }, { timeout: 100 });
      
      mockOscillator.onended?.();
      await promise;
    });

    it('pans to left ear when channel is left', async () => {
      vi.resetModules();
      mockOscillator = createMockOscillator();
      mockGain = createMockGain();
      mockPanner = createMockPanner();
      mockAudioContext = createMockAudioContext();
      mockAudioContext.createOscillator = vi.fn(() => mockOscillator);
      mockAudioContext.createGain = vi.fn(() => mockGain);
      mockAudioContext.createStereoPanner = vi.fn(() => mockPanner);
      // Use a class constructor for vitest v4 compatibility
      globalThis.AudioContext = class MockAudioContext {
        state = mockAudioContext.state;
        currentTime = mockAudioContext.currentTime;
        destination = mockAudioContext.destination;
        createOscillator = mockAudioContext.createOscillator;
        createGain = mockAudioContext.createGain;
        createStereoPanner = mockAudioContext.createStereoPanner;
        resume = mockAudioContext.resume;
      } as unknown as typeof AudioContext;
      
      const { playTone } = await import('./tone-generator');
      
      const promise = playTone({
        frequency: 1000,
        level: 40,
        duration: 100,
        channel: 'left',
      });
      
      await vi.waitFor(() => {
        expect(mockPanner.pan.value).toBe(-1);
      }, { timeout: 100 });
      
      mockOscillator.onended?.();
      await promise;
    });

    it('uses sine wave oscillator type', async () => {
      const { playTone } = await import('./tone-generator');
      
      const promise = playTone({
        frequency: 1000,
        level: 40,
        duration: 100,
        channel: 'right',
      });
      
      await vi.waitFor(() => {
        expect(mockOscillator.type).toBe('sine');
      }, { timeout: 100 });
      
      mockOscillator.onended?.();
      await promise;
    });

    it('applies gain envelope for smooth fade', async () => {
      const { playTone } = await import('./tone-generator');
      
      const promise = playTone({
        frequency: 1000,
        level: 40,
        duration: 100,
        channel: 'right',
      });
      
      await vi.waitFor(() => {
        expect(mockGain.gain.setValueAtTime).toHaveBeenCalled();
        expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalled();
      }, { timeout: 100 });
      
      mockOscillator.onended?.();
      await promise;
    });

    it('ramp targets strictly increase from minLevel to maxLevel', async () => {
      const { playTone } = await import('./tone-generator');
      const { DEFAULT_TEST_CONFIG } = await import('../types');
      const { minLevel, maxLevel, stepUp } = DEFAULT_TEST_CONFIG;

      const targets: number[] = [];
      for (let level = minLevel; level <= maxLevel; level += stepUp) {
        mockGain.gain.linearRampToValueAtTime.mockClear();
        const promise = playTone({ frequency: 1000, level, duration: 100, channel: 'right' });
        await vi.waitFor(() => {
          expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalled();
        }, { timeout: 100 });
        // First ramp is the fade-in to the target gain
        targets.push(mockGain.gain.linearRampToValueAtTime.mock.calls[0][0]);
        mockOscillator.onended?.();
        await promise;
      }

      for (let i = 1; i < targets.length; i++) {
        expect(targets[i]).toBeGreaterThan(targets[i - 1]);
      }
      // maxLevel reaches full scale without exceeding it
      expect(targets[targets.length - 1]).toBeCloseTo(1, 6);
    });
  });

  describe('tone lifecycle', () => {
    function createNodes() {
      const oscillator = {
        type: 'sine' as OscillatorType,
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

    let created: ReturnType<typeof createNodes>[];
    let originalAudioContext: typeof globalThis.AudioContext;

    beforeEach(() => {
      vi.resetModules();
      created = [];
      originalAudioContext = globalThis.AudioContext;
      // Each tone gets fresh nodes so we can tell them apart
      globalThis.AudioContext = class MockAudioContext {
        state = 'running' as AudioContextState;
        currentTime = 10;
        destination = {};
        createOscillator = vi.fn(() => {
          created.push(createNodes());
          return created[created.length - 1].oscillator;
        });
        createGain = vi.fn(() => created[created.length - 1].gain);
        createStereoPanner = vi.fn(() => created[created.length - 1].panner);
        resume = vi.fn().mockResolvedValue(undefined);
      } as unknown as typeof AudioContext;
    });

    afterEach(() => {
      globalThis.AudioContext = originalAudioContext;
    });

    it("a stale onended from the previous tone does not disconnect the next tone", async () => {
      const { playTone } = await import('./tone-generator');

      const first = playTone({ frequency: 1000, level: 40, duration: 2000, channel: 'right' });
      await vi.waitFor(() => expect(created).toHaveLength(1));
      const second = playTone({ frequency: 1000, level: 40, duration: 2000, channel: 'left' });
      await vi.waitFor(() => expect(created).toHaveLength(2));

      // The first oscillator's ended event arrives asynchronously, after the second tone started
      await Promise.resolve();
      created[0].oscillator.onended?.();
      await first;

      expect(created[0].oscillator.disconnect).toHaveBeenCalled();
      expect(created[1].oscillator.disconnect).not.toHaveBeenCalled();
      expect(created[1].gain.disconnect).not.toHaveBeenCalled();
      expect(created[1].panner.disconnect).not.toHaveBeenCalled();

      created[1].oscillator.onended?.();
      await second;
      expect(created[1].oscillator.disconnect).toHaveBeenCalled();
    });

    it('stopTone ramps the gain to 0 before stopping the oscillator', async () => {
      const { playTone, stopTone } = await import('./tone-generator');

      const promise = playTone({ frequency: 1000, level: 40, duration: 2000, channel: 'right' });
      await vi.waitFor(() => expect(created).toHaveLength(1));
      const { oscillator, gain } = created[0];
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
      await promise;
    });
  });
});
