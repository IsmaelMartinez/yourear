import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HearingTest } from './hearing-test';
import { playTone } from './tone-generator';

// Mock the tone generator
vi.mock('./tone-generator', () => ({
  playTone: vi.fn().mockResolvedValue(undefined),
  stopTone: vi.fn(),
}));

describe('HearingTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts in idle phase', () => {
      const test = new HearingTest();
      expect(test.getState().phase).toBe('idle');
    });

    it('starts with right ear', () => {
      const test = new HearingTest();
      expect(test.getState().currentEar).toBe('right');
    });

    it('starts at first frequency', () => {
      const test = new HearingTest();
      expect(test.getState().currentFrequency).toBe(250);
    });

    it('starts at configured start level', () => {
      const test = new HearingTest({ startLevel: 50 });
      expect(test.getState().currentLevel).toBe(50);
    });

    it('starts with 0% progress', () => {
      const test = new HearingTest();
      expect(test.getProgress()).toBe(0);
    });
  });

  describe('start()', () => {
    it('changes phase to testing', async () => {
      const test = new HearingTest();
      await test.start();
      expect(test.getState().phase).toBe('testing');
    });

    it('emits stateChange event', async () => {
      const test = new HearingTest();
      const handler = vi.fn();
      test.on(handler);
      
      await test.start();
      
      expect(handler).toHaveBeenCalledWith('stateChange', undefined);
    });
  });

  describe('stop()', () => {
    it('changes phase to idle', async () => {
      const test = new HearingTest();
      await test.start();
      test.stop();
      expect(test.getState().phase).toBe('idle');
    });

    it('sets isPlaying to false', async () => {
      const test = new HearingTest();
      await test.start();
      test.stop();
      expect(test.getState().isPlaying).toBe(false);
    });
  });

  describe('respondHeard()', () => {
    it('does nothing when not waiting for response', async () => {
      const test = new HearingTest();
      const initialLevel = test.getState().currentLevel;
      await test.respondHeard();
      expect(test.getState().currentLevel).toBe(initialLevel);
    });
  });

  describe('respondNotHeard()', () => {
    it('does nothing when not waiting for response', async () => {
      const test = new HearingTest();
      const initialLevel = test.getState().currentLevel;
      await test.respondNotHeard();
      expect(test.getState().currentLevel).toBe(initialLevel);
    });
  });

  describe('getProgress()', () => {
    it('returns 0 at start', () => {
      const test = new HearingTest();
      expect(test.getProgress()).toBe(0);
    });

    it('calculates based on completed frequencies', () => {
      const test = new HearingTest({ frequencies: [1000, 2000] });
      // 2 frequencies × 2 ears = 4 total tests
      // Manually set responses to simulate completion
      const state = test.getState();
      state.responses.set('right-1000', 30);
      expect(test.getProgress()).toBe(25); // 1/4 = 25%
    });
  });

  describe('getResults()', () => {
    it('returns thresholds for all frequencies', () => {
      const test = new HearingTest({ frequencies: [1000, 2000, 4000] });
      const results = test.getResults();
      
      expect(results.thresholds).toHaveLength(3);
      expect(results.thresholds.map(t => t.frequency)).toEqual([1000, 2000, 4000]);
    });

    it('returns null for untested ears', () => {
      const test = new HearingTest({ frequencies: [1000] });
      const results = test.getResults();
      
      expect(results.thresholds[0].leftEar).toBeNull();
      expect(results.thresholds[0].rightEar).toBeNull();
    });

    it('includes timestamps', () => {
      const test = new HearingTest();
      const results = test.getResults();
      
      expect(results.createdAt).toBeInstanceOf(Date);
      expect(results.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('event subscription', () => {
    it('returns unsubscribe function', () => {
      const test = new HearingTest();
      const handler = vi.fn();
      const unsubscribe = test.on(handler);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe stops events', async () => {
      const test = new HearingTest();
      const handler = vi.fn();
      const unsubscribe = test.on(handler);
      
      unsubscribe();
      await test.start();
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('custom config', () => {
    it('uses custom frequencies', () => {
      const test = new HearingTest({ frequencies: [500, 1000] });
      expect(test.getState().currentFrequency).toBe(500);
    });

    it('uses custom levels', () => {
      const test = new HearingTest({ 
        startLevel: 30,
        minLevel: 0,
        maxLevel: 80,
      });
      expect(test.getState().currentLevel).toBe(30);
    });
  });

  describe('stop() during a tone', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /** Make the next playTone call resolve only when the returned function is called */
    function deferNextTone(): () => void {
      let finish!: () => void;
      vi.mocked(playTone).mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
      return () => finish();
    }

    it('leaves no response timer when the tone ends after stop()', async () => {
      const test = new HearingTest();
      const endTone = deferNextTone();

      const started = test.start();
      test.stop();
      endTone();
      await started;

      expect(vi.getTimerCount()).toBe(0);
    });

    it('does not change the level of a restarted test', async () => {
      const test = new HearingTest({ startLevel: 40, stepUp: 5, responseDuration: 3000 });
      const endFirstTone = deferNextTone();

      const first = test.start();
      test.stop();
      const restarted = test.start();
      endFirstTone();
      await Promise.all([first, restarted]);

      // Only the restarted test's own response window is pending
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(3000);
      expect(test.getState().currentLevel).toBe(45);
    });
  });
});
