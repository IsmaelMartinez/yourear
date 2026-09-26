import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { installAudioContext, stubGetUserMedia } from '../test/web-audio';

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
      installAudioContext({ createMediaStreamSource: () => source, createAnalyser: () => analyser });
    }

    beforeEach(() => {
      vi.resetModules();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('throws AudioInitError when getUserMedia is unavailable', async () => {
      stubGetUserMedia(null);

      const { startNoiseMeter } = await import('./noise-meter');
      const { AudioInitError } = await import('./audio-context');
      await expect(startNoiseMeter(() => {})).rejects.toBeInstanceOf(AudioInitError);
    });

    it('throws AudioInitError when permission is denied', async () => {
      stubGetUserMedia(new Error('NotAllowedError'));

      const { startNoiseMeter } = await import('./noise-meter');
      const { AudioInitError } = await import('./audio-context');
      await expect(startNoiseMeter(() => {})).rejects.toBeInstanceOf(AudioInitError);
    });

    it('stops media tracks when audio setup fails after getUserMedia', async () => {
      const track = createMockTrack();
      installAudioContext({ state: 'suspended', resume: vi.fn().mockRejectedValue(new Error('blocked')) });

      stubGetUserMedia({ getTracks: () => [track] });

      const { startNoiseMeter } = await import('./noise-meter');
      const { AudioInitError } = await import('./audio-context');
      await expect(startNoiseMeter(() => {})).rejects.toBeInstanceOf(AudioInitError);
      expect(track.stop).toHaveBeenCalled();
    });

    it('stops media tracks when creating the analyser fails', async () => {
      const track = createMockTrack();
      installAudioContext({
        createMediaStreamSource: () => createMockSource(),
        createAnalyser: () => { throw new Error('analyser failed'); },
      });

      stubGetUserMedia({ getTracks: () => [track] });

      const { startNoiseMeter } = await import('./noise-meter');
      await expect(startNoiseMeter(() => {})).rejects.toThrow('analyser failed');
      expect(track.stop).toHaveBeenCalled();
    });

    it('stops media tracks and sampling when the first sample fails', async () => {
      const source = createMockSource();
      const track = createMockTrack();
      installMockAudioContext(createMockAnalyser(0.1), source);

      stubGetUserMedia({ getTracks: () => [track] });

      const { startNoiseMeter } = await import('./noise-meter');
      await expect(startNoiseMeter(() => { throw new Error('callback failed'); })).rejects.toThrow('callback failed');
      expect(track.stop).toHaveBeenCalled();
      expect(source.disconnect).toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('invokes the callback with samples once the meter starts', async () => {
      const analyser = createMockAnalyser(0.1);
      const source = createMockSource();
      const track = createMockTrack();
      installMockAudioContext(analyser, source);

      stubGetUserMedia({ getTracks: () => [track] });

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

      stubGetUserMedia({ getTracks: () => [track] });

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

      stubGetUserMedia({ getTracks: () => [track] });

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

      stubGetUserMedia({ getTracks: () => [track] });

      const { startNoiseMeter } = await import('./noise-meter');
      const handle = await startNoiseMeter(() => {});
      handle.stop();
      handle.stop();

      expect(track.stop).toHaveBeenCalledTimes(1);
    });
  });
});
