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
      globalThis.AudioContext = vi.fn(() => mockAudioContext) as unknown as typeof AudioContext;
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
      
      // Give it a tick to set up
      await vi.waitFor(() => {
        expect(globalThis.AudioContext).toHaveBeenCalled();
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
      globalThis.AudioContext = vi.fn(() => mockAudioContext) as unknown as typeof AudioContext;
      
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
  });
});
