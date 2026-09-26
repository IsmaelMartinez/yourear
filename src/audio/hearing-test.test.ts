import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HearingTest } from './hearing-test';
import { playTone } from './tone-generator';

// Mock the tone generator
vi.mock('./tone-generator', () => ({
  playTone: vi.fn().mockResolvedValue(undefined),
  stopTone: vi.fn(),
}));

/**
 * Walk one ear-frequency through ADR 002 from the 40 dB start:
 * heard at 40, not heard at 30, then heard twice while ascending at 35.
 */
async function findThreshold(test: HearingTest): Promise<void> {
  await test.respondHeard();
  await test.respondNotHeard();
  await test.respondHeard();
  await test.respondHeard();
}

describe('HearingTest', () => {
  // Fake timers keep each test's response window from firing after it ends
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

    it('counts each ear-frequency threshold found as a share of the whole test', async () => {
      const test = new HearingTest({ frequencies: [1000, 2000] });
      await test.start();

      // 2 frequencies x 2 ears = 4 thresholds, each worth 25%
      await findThreshold(test);
      expect(test.getProgress()).toBe(25);
      await findThreshold(test);
      expect(test.getProgress()).toBe(50);
      await findThreshold(test);
      await findThreshold(test);
      expect(test.getProgress()).toBe(100);
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
  describe('Hughson-Westlake procedure (ADR 002)', () => {
    it('descends 10 dB, ascends 5 dB, and records the level heard twice while ascending', async () => {
      const test = new HearingTest({ frequencies: [1000] });
      await test.start();

      await test.respondHeard();
      expect(test.getState().currentLevel).toBe(30);
      await test.respondNotHeard();
      expect(test.getState().currentLevel).toBe(35);
      await test.respondHeard();
      // One ascending hit re-presents the same level without recording it
      expect(test.getState().currentLevel).toBe(35);
      expect(test.getState().responses.size).toBe(0);
      await test.respondHeard();

      expect(test.getState().responses.get('right-1000')).toBe(35);
    });

    it('does not record ascending hits at different levels', async () => {
      const test = new HearingTest({ frequencies: [1000] });
      await test.start();

      await test.respondHeard();    // 40 -> 30
      await test.respondNotHeard(); // 30 -> 35, ascending
      await test.respondHeard();    // first hit at 35
      await test.respondNotHeard(); // 35 -> 40, hit count reset
      await test.respondHeard();    // first hit at 40
      expect(test.getState().responses.size).toBe(0);

      await test.respondHeard();    // second hit at 40
      expect(test.getState().responses.get('right-1000')).toBe(40);
    });

    it('records minLevel when heard below the quietest level', async () => {
      const test = new HearingTest({ frequencies: [1000], startLevel: 0, minLevel: -10, stepDown: 10 });
      await test.start();

      await test.respondHeard(); // 0 -> -10, still in range
      expect(test.getState().responses.size).toBe(0);
      await test.respondHeard(); // -10 -> -20, below minLevel

      expect(test.getState().responses.get('right-1000')).toBe(-10);
    });

    it('records no response when not heard above maxLevel', async () => {
      const test = new HearingTest({ frequencies: [1000], startLevel: 85, maxLevel: 90, stepUp: 5 });
      await test.start();

      await test.respondNotHeard(); // 85 -> 90, still in range
      expect(test.getState().currentEar).toBe('right');
      await test.respondNotHeard(); // 90 -> 95, above maxLevel

      const state = test.getState();
      expect(state.responses.has('right-1000')).toBe(false);
      expect(test.getResults().thresholds[0].rightEar).toBeNull();
      // The procedure moves on rather than stalling at the ceiling
      expect(state.currentEar).toBe('left');
      expect(state.currentLevel).toBe(85);
    });

    it('tests every frequency in the right ear, then the left, then completes', async () => {
      const test = new HearingTest({ frequencies: [1000, 2000] });
      const handler = vi.fn();
      test.on(handler);
      await test.start();

      const visited: string[] = [];
      for (let i = 0; i < 4; i++) {
        const { currentEar, currentFrequency, currentLevel } = test.getState();
        visited.push(`${currentEar}-${currentFrequency}`);
        // Each new ear-frequency restarts the descent from startLevel
        expect(currentLevel).toBe(40);
        await findThreshold(test);
      }

      expect(visited).toEqual(['right-1000', 'right-2000', 'left-1000', 'left-2000']);
      expect(test.getState().phase).toBe('complete');
      const completions = handler.mock.calls.filter(([event]) => event === 'testComplete');
      expect(completions).toHaveLength(1);
      expect(completions[0][1]).toMatchObject({
        thresholds: [
          { frequency: 1000, rightEar: 35, leftEar: 35 },
          { frequency: 2000, rightEar: 35, leftEar: 35 },
        ],
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('plays each tone at the current frequency, level and ear', async () => {
      const test = new HearingTest({ frequencies: [1000], toneDuration: 1500 });
      await test.start();
      await test.respondHeard();

      expect(vi.mocked(playTone).mock.calls.map(([options]) => options)).toEqual([
        { frequency: 1000, level: 40, duration: 1500, channel: 'right' },
        { frequency: 1000, level: 30, duration: 1500, channel: 'right' },
      ]);
    });

    it('ignores responses once the test is complete', async () => {
      const test = new HearingTest({ frequencies: [1000] });
      await test.start();
      await findThreshold(test);
      await findThreshold(test);
      const toneCount = vi.mocked(playTone).mock.calls.length;

      await test.respondHeard();
      await test.respondNotHeard();

      expect(test.getState().phase).toBe('complete');
      expect(vi.mocked(playTone).mock.calls.length).toBe(toneCount);
    });

    it('counts a response window that times out as not heard', async () => {
      const test = new HearingTest({ frequencies: [1000], responseDuration: 3000 });
      await test.start();

      await vi.advanceTimersByTimeAsync(2999);
      expect(test.getState().currentLevel).toBe(40);
      await vi.advanceTimersByTimeAsync(1);
      expect(test.getState().currentLevel).toBe(45);

      // The timeout starts the ascent, so two hits at 45 record the threshold
      await test.respondHeard();
      await test.respondHeard();
      expect(test.getState().responses.get('right-1000')).toBe(45);
    });

    it('cancels the response window when the listener answers', async () => {
      const test = new HearingTest({ frequencies: [1000], responseDuration: 3000 });
      await test.start();
      await vi.advanceTimersByTimeAsync(2000);

      await test.respondHeard(); // 40 -> 30, new 3000 ms window
      await vi.advanceTimersByTimeAsync(2000);

      // The first window would have fired by now had it not been cleared
      expect(test.getState().currentLevel).toBe(30);
      expect(vi.getTimerCount()).toBe(1);
    });
  });
});
