import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { startTest, stopTest } from './test-runner';
import { HearingTest, type TestEventHandler } from '../audio/hearing-test';
import { AudioInitError } from '../audio/audio-context';
import { announce } from '../utils/dom';
import { getState, navigateTo, resetState, setRenderCallback } from '../state/app-state';

vi.mock('../audio/hearing-test', () => ({
  HearingTest: vi.fn(),
}));

vi.mock('../utils/dom', () => ({
  announce: vi.fn(),
}));

vi.mock('../storage/profile', () => ({
  createProfile: vi.fn(),
}));

interface MockTest {
  on: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  emit: (event: 'stateChange' | 'testComplete') => void;
}

describe('test-runner', () => {
  let mockTest: MockTest;
  let render: Mock<() => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    render = vi.fn();
    setRenderCallback(render);

    const handlers: TestEventHandler[] = [];
    mockTest = {
      on: vi.fn((handler: TestEventHandler) => { handlers.push(handler); }),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      emit: (event) => handlers.forEach(h => h(event)),
    };
    vi.mocked(HearingTest).mockImplementation(function () { return mockTest; } as never);
    navigateTo('calibration');
  });

  it('starts the test on the test screen', () => {
    startTest();

    expect(getState().screen).toBe('test');
    expect(getState().hearingTest).toBe(mockTest);
    expect(mockTest.start).toHaveBeenCalled();
  });

  it('returns to home with an announced error when audio fails to start', async () => {
    mockTest.start.mockRejectedValue(new AudioInitError('Could not initialize audio.'));

    startTest();

    await vi.waitFor(() => {
      expect(getState().screen).toBe('home');
    });
    expect(getState().hearingTest).toBeNull();
    expect(mockTest.stop).toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith(expect.stringContaining('Could not initialize audio.'), 'assertive');
  });

  it('stopTest clears the test from state and returns home', () => {
    startTest();

    stopTest();

    expect(mockTest.stop).toHaveBeenCalled();
    expect(getState().hearingTest).toBeNull();
    expect(getState().screen).toBe('home');
  });

  it('ignores state changes from a stopped test', () => {
    startTest();
    stopTest();
    render.mockClear();

    mockTest.emit('stateChange');

    expect(render).not.toHaveBeenCalled();
  });
});
