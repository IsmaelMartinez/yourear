import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('noise-meter', () => {
  describe('rmsToDbSpl', () => {
    it('returns 0 for silence (rms = 0)', async () => {
      const { rmsToDbSpl } = await import('./noise-meter');
      expect(rmsToDbSpl(0)).toBe(0);
    });

    it('returns ~94 dB at full-scale rms (1.0)', async () => {
      const { rmsToDbSpl } = await import('./noise-meter');
      expect(rmsToDbSpl(1)).toBeCloseTo(94, 5);
    });

    it('returns a dB value consistent with the 94 dB offset', async () => {
      const { rmsToDbSpl } = await import('./noise-meter');
      // rms = 0.1 -> -20 dBFS -> 74 dB SPL
      expect(rmsToDbSpl(0.1)).toBeCloseTo(74, 5);
    });

    it('clamps negative readings to 0 dB', async () => {
      const { rmsToDbSpl } = await import('./noise-meter');
      // Absurdly small rms would produce a negative dB SPL; clamp it.
      expect(rmsToDbSpl(1e-10)).toBe(0);
    });
  });

  describe('NOISE_WARNING_THRESHOLD_DB', () => {
    it('is set to 40 dB per Phase 1 spec', async () => {
      const { NOISE_WARNING_THRESHOLD_DB } = await import('./noise-meter');
      expect(NOISE_WARNING_THRESHOLD_DB).toBe(40);
    });
  });

  describe('startNoiseMeter', () => {
    let originalAudioContext: typeof globalThis.AudioContext;
    let originalMediaDevices: MediaDevices | undefined;

    function createMockAnalyser(sampleValue = 0) {
      return {
        fftSize: 2048,
        connect: vi.fn(),
        disconnect: vi.fn(),
        getFloatTimeDomainData: vi.fn((buffer: Float32Array) => {
          buffer.fill(sampleValue);
        }),
      };
    }

    function createMockSource() {
      return {
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }

    function createMockTrack() {
      return { stop: vi.fn() };
    }

    function installMockAudioContext(analyser: ReturnType<typeof createMockAnalyser>, source: ReturnType<typeof createMockSource>) {
      globalThis.AudioContext = class {
        state = 'running' as AudioContextState;
        createMediaStreamSource = vi.fn(() => source);
        createAnalyser = vi.fn(() => analyser);
      } as unknown as typeof AudioContext;
    }

    beforeEach(() => {
      vi.resetModules();
      vi.useFakeTimers();
      originalAudioContext = globalThis.AudioContext;
      originalMediaDevices = navigator.mediaDevices;
    });

    afterEach(() => {
      vi.useRealTimers();
      globalThis.AudioContext = originalAudioContext;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: originalMediaDevices,
        configurable: true,
      });
    });

    it('throws AudioInitError when getUserMedia is unavailable', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        configurable: true,
      });

      const { startNoiseMeter } = await import('./noise-meter');
      const { AudioInitError } = await import('./audio-context');
      await expect(startNoiseMeter(() => {})).rejects.toBeInstanceOf(AudioInitError);
    });

    it('throws AudioInitError when permission is denied', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
        },
        configurable: true,
      });

      const { startNoiseMeter } = await import('./noise-meter');
      const { AudioInitError } = await import('./audio-context');
      await expect(startNoiseMeter(() => {})).rejects.toBeInstanceOf(AudioInitError);
    });

    it('invokes the callback with samples once the meter starts', async () => {
      const analyser = createMockAnalyser(0.1);
      const source = createMockSource();
      const track = createMockTrack();
      installMockAudioContext(analyser, source);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [track],
          }),
        },
        configurable: true,
      });

      const { startNoiseMeter } = await import('./noise-meter');
      const onSample = vi.fn();
      const handle = await startNoiseMeter(onSample);

      expect(onSample).toHaveBeenCalled();
      const firstSample = onSample.mock.calls[0][0];
      // rms = 0.1 -> -20 dBFS -> 74 dB SPL
      expect(firstSample.db).toBeCloseTo(74, 0);
      expect(firstSample.peakDb).toBeCloseTo(74, 0);

      handle.stop();
    });

    it('tracks peak dB across samples', async () => {
      const analyser = createMockAnalyser(0.01); // -> ~54 dB
      const source = createMockSource();
      const track = createMockTrack();
      installMockAudioContext(analyser, source);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [track],
          }),
        },
        configurable: true,
      });

      const { startNoiseMeter } = await import('./noise-meter');
      const samples: number[] = [];
      const onSample = vi.fn((s: { db: number; peakDb: number }) => {
        samples.push(s.peakDb);
      });

      const handle = await startNoiseMeter(onSample);

      // Bump the measured level; peak should only ever grow.
      analyser.getFloatTimeDomainData = vi.fn((buffer: Float32Array) => {
        buffer.fill(0.1); // -> ~74 dB
      });
      vi.advanceTimersByTime(250);

      analyser.getFloatTimeDomainData = vi.fn((buffer: Float32Array) => {
        buffer.fill(0.001); // -> ~34 dB, but peak should stay high
      });
      vi.advanceTimersByTime(250);

      const peaks = samples;
      expect(peaks[peaks.length - 1]).toBeGreaterThanOrEqual(peaks[0]);
      expect(peaks[peaks.length - 1]).toBeCloseTo(74, 0);

      handle.stop();
    });

    it('stop() disconnects nodes and stops media tracks', async () => {
      const analyser = createMockAnalyser(0);
      const source = createMockSource();
      const track = createMockTrack();
      installMockAudioContext(analyser, source);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [track],
          }),
        },
        configurable: true,
      });

      const { startNoiseMeter } = await import('./noise-meter');
      const handle = await startNoiseMeter(() => {});
      handle.stop();

      expect(source.disconnect).toHaveBeenCalled();
      expect(analyser.disconnect).toHaveBeenCalled();
      expect(track.stop).toHaveBeenCalled();
    });

    it('stop() is idempotent', async () => {
      const analyser = createMockAnalyser(0);
      const source = createMockSource();
      const track = createMockTrack();
      installMockAudioContext(analyser, source);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [track],
          }),
        },
        configurable: true,
      });

      const { startNoiseMeter } = await import('./noise-meter');
      const handle = await startNoiseMeter(() => {});
      handle.stop();
      handle.stop();

      expect(track.stop).toHaveBeenCalledTimes(1);
    });
  });
});
