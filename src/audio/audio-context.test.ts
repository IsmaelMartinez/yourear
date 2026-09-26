import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installAudioContext } from '../test/web-audio';

describe('audio-context', () => {
  beforeEach(() => {
    vi.resetModules();
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
      const constructed = installAudioContext();

      const { getAudioContext } = await import('./audio-context');
      const ctx = getAudioContext();
      expect(constructed).toHaveBeenCalledOnce();
      expect(constructed).toHaveBeenCalledWith(ctx);
    });

    it('returns the same instance on subsequent calls', async () => {
      installAudioContext();

      const { getAudioContext } = await import('./audio-context');
      const a = getAudioContext();
      const b = getAudioContext();
      expect(a).toBe(b);
    });

    it('throws AudioInitError when AudioContext constructor fails', async () => {
      vi.stubGlobal('AudioContext', class {
        constructor() { throw new Error('not supported'); }
      });

      const { getAudioContext, AudioInitError } = await import('./audio-context');
      expect(() => getAudioContext()).toThrow(AudioInitError);
      expect(() => getAudioContext()).toThrow('Could not initialize audio');
    });
  });

  describe('ensureRunning', () => {
    it('resumes a suspended context', async () => {
      const resumeSpy = vi.fn().mockResolvedValue(undefined);
      installAudioContext({ state: 'suspended', resume: resumeSpy });

      const { ensureRunning } = await import('./audio-context');
      const ctx = await ensureRunning();
      expect(resumeSpy).toHaveBeenCalledOnce();
      expect(ctx).toBeDefined();
    });

    it('does not call resume on a running context', async () => {
      const resumeSpy = vi.fn();
      installAudioContext({ resume: resumeSpy });

      const { ensureRunning } = await import('./audio-context');
      await ensureRunning();
      expect(resumeSpy).not.toHaveBeenCalled();
    });

    it('throws AudioInitError when resume fails', async () => {
      installAudioContext({ state: 'suspended', resume: vi.fn().mockRejectedValue(new Error('user gesture required')) });

      const { ensureRunning, AudioInitError } = await import('./audio-context');
      await expect(ensureRunning()).rejects.toThrow(AudioInitError);
      await expect(ensureRunning()).rejects.toThrow('Could not resume audio context');
    });
  });
});
