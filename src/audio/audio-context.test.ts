import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('audio-context', () => {
  let originalAudioContext: typeof globalThis.AudioContext;

  beforeEach(() => {
    vi.resetModules();
    originalAudioContext = globalThis.AudioContext;
  });

  afterEach(() => {
    globalThis.AudioContext = originalAudioContext;
  });

  describe('AudioInitError', () => {
    it('is an Error with the correct name', async () => {
      const { AudioInitError } = await import('./audio-context');
      const err = new AudioInitError('boom');
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('AudioInitError');
      expect(err.message).toBe('boom');
    });

    it('stores a readonly cause', async () => {
      const { AudioInitError } = await import('./audio-context');
      const cause = new TypeError('underlying');
      const err = new AudioInitError('wrapped', cause);
      expect(err.cause).toBe(cause);
    });
  });

  describe('getAudioContext', () => {
    it('creates an AudioContext on first call', async () => {
      const ctorSpy = vi.fn();
      globalThis.AudioContext = class {
        constructor() { ctorSpy(); }
        state = 'running' as AudioContextState;
      } as unknown as typeof AudioContext;

      const { getAudioContext } = await import('./audio-context');
      const ctx = getAudioContext();
      expect(ctorSpy).toHaveBeenCalledOnce();
      expect(ctx).toBeDefined();
    });

    it('returns the same instance on subsequent calls', async () => {
      globalThis.AudioContext = class {
        state = 'running' as AudioContextState;
      } as unknown as typeof AudioContext;

      const { getAudioContext } = await import('./audio-context');
      const a = getAudioContext();
      const b = getAudioContext();
      expect(a).toBe(b);
    });

    it('throws AudioInitError when AudioContext constructor fails', async () => {
      globalThis.AudioContext = class {
        constructor() { throw new Error('not supported'); }
      } as unknown as typeof AudioContext;

      const { getAudioContext, AudioInitError } = await import('./audio-context');
      expect(() => getAudioContext()).toThrow(AudioInitError);
      expect(() => getAudioContext()).toThrow('Could not initialize audio');
    });
  });

  describe('ensureRunning', () => {
    it('resumes a suspended context', async () => {
      const resumeSpy = vi.fn().mockResolvedValue(undefined);
      globalThis.AudioContext = class {
        state = 'suspended' as AudioContextState;
        resume = resumeSpy;
      } as unknown as typeof AudioContext;

      const { ensureRunning } = await import('./audio-context');
      const ctx = await ensureRunning();
      expect(resumeSpy).toHaveBeenCalledOnce();
      expect(ctx).toBeDefined();
    });

    it('does not call resume on a running context', async () => {
      const resumeSpy = vi.fn();
      globalThis.AudioContext = class {
        state = 'running' as AudioContextState;
        resume = resumeSpy;
      } as unknown as typeof AudioContext;

      const { ensureRunning } = await import('./audio-context');
      await ensureRunning();
      expect(resumeSpy).not.toHaveBeenCalled();
    });

    it('throws AudioInitError when resume fails', async () => {
      globalThis.AudioContext = class {
        state = 'suspended' as AudioContextState;
        resume = vi.fn().mockRejectedValue(new Error('user gesture required'));
      } as unknown as typeof AudioContext;

      const { ensureRunning, AudioInitError } = await import('./audio-context');
      await expect(ensureRunning()).rejects.toThrow(AudioInitError);
      await expect(ensureRunning()).rejects.toThrow('Could not resume audio context');
    });
  });
});
